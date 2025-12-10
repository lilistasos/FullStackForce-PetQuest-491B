const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });
const pool = require('./database');

const jwt = require('jsonwebtoken');
const { z } = require('zod');
const crypto = require('crypto');

const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

console.log('Loaded SendGrid Key:', process.env.SENDGRID_API_KEY);


const app = express();
app.use(cors());
app.use(express.json());

// Validation using Zod
const IsoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
  .transform((s) => new Date(s + 'T00:00:00Z'));

function isAtLeastAge(dateOfBirth, minYears) {
  const today = new Date();
  const min = new Date(
    today.getUTCFullYear() - minYears,
    today.getUTCMonth(),
    today.getUTCDate()
  );
  return dateOfBirth <= min;
}

// Schemas
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['parent', 'child', 'individual']),
  familyCode: z.string().length(6).nullable().optional(),
  dateOfBirth: IsoDateString, // Required for all roles (database constraint)
}).refine((data) => {
  // Parents and individuals must be 13+
  if (data.role === 'parent' || data.role === 'individual') {
    return isAtLeastAge(data.dateOfBirth, 13);
  }
  
  // Children can be any age (no minimum age requirement)
  return true;
}, {
  message: 'Date of birth is required. Parent and individual accounts must be 13+ years old.'
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  dateOfBirth: IsoDateString.optional(),
});

const ResetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

function validate(schema, data) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
    const err = new Error(issues.join('; '));
    err.status = 400;
    throw err;
  }
  return parsed.data;
}

// Password Helpers
function scryptAsync(password, salt, keylen = 64) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

// Store as "saltHex:hashHex" in a single column
async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const dk = await scryptAsync(password, salt);
  return `${salt.toString('hex')}:${dk.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const hash = Buffer.from(hashHex, 'hex');
  const candidate = await scryptAsync(password, salt, hash.length);
  return crypto.timingSafeEqual(candidate, hash);
}

// JWT
function generateToken({ id, email }) {
  return jwt.sign({ sub: id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Data Helpers
async function findUserByEmail(email) {
  const { rows } = await pool.query(
    `SELECT id, email, password_hash, first_name AS "firstName", last_name AS "lastName",
            role, family_code AS "familyCode", date_of_birth AS "dateOfBirth", created_at AS "createdAt",
            points, last_login_date
     FROM users
     WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

async function findUserById(id) {
  // For UUID primary keys, just pass the id through as-is
  const userId = id;

  const { rows } = await pool.query(
    `SELECT id, email, first_name AS "firstName", last_name AS "lastName",
            role, family_code AS "familyCode", date_of_birth AS "dateOfBirth", created_at AS "createdAt"
     FROM users
     WHERE id = $1`,
    [userId]
  );
  return rows[0] || null;
}

function generateFamilyCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function createUser({ email, passwordHash, firstName, lastName, role, familyCode, dateOfBirth }) {
  const dob = dateOfBirth ? dateOfBirth.toISOString().slice(0, 10) : null;
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role, family_code, date_of_birth)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, email, first_name AS "firstName", last_name AS "lastName",
               role, family_code AS "familyCode", date_of_birth AS "dateOfBirth", created_at AS "createdAt"`,
    [email, passwordHash, firstName, lastName, role, familyCode || null, dob]
  );
  return rows[0];
}

// Register Function
async function registerUser(payload) {
  const { email, password, firstName, lastName, role, familyCode, dateOfBirth } = validate(RegisterSchema, payload);

  const exists = await findUserByEmail(email);
  if (exists) {
    const err = new Error('Email already in use');
    err.status = 409;
    throw err;
  }

  let finalFamilyCode = familyCode;
  if (role === 'parent') {
    finalFamilyCode = generateFamilyCode();
  } else if (role === 'child') {
    if (!familyCode) {
      const err = new Error('Family code is required for child accounts.');
      err.status = 400;
      throw err;
    }
    const { rows } = await pool.query(
      `SELECT id FROM users WHERE family_code = $1 AND role = 'parent'`,
      [familyCode]
    );
    if (rows.length === 0) {
      const err = new Error('Invalid family code. Parent not found.');
      err.status = 400;
      throw err;
    }
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({
    email,
    passwordHash,
    firstName,
    lastName,
    role,
    familyCode: finalFamilyCode,
    dateOfBirth });

  // Create default pets for child users
  if (role === 'child') {
    await initializeDefaultPets(user.id);
  }

  const token = generateToken(user);
  return { user, token };
}

// Initialize default pets and accessories for a user
async function initializeDefaultPets(userId) {
  const defaultPets = [
    { name: 'Dragon', cost: 0, isUnlocked: true, isVisible: true },
    { name: 'Cat', cost: 50, isUnlocked: false, isVisible: true },
    { name: 'Dog', cost: 75, isUnlocked: false, isVisible: true },
    { name: 'Lion', cost: 100, isUnlocked: false, isVisible: true },
    { name: 'Unicorn', cost: 150, isUnlocked: false, isVisible: true },
  ];

  const defaultAccessories = {
    'Dragon': [
      { name: 'Baseball Cap', cost: 25, isUnlocked: false, isVisible: true },
      { name: 'Top Hat', cost: 30, isUnlocked: false, isVisible: true },
      { name: 'Sunglasses', cost: 20, isUnlocked: false, isVisible: true },
      { name: 'Football', cost: 15, isUnlocked: false, isVisible: true },
    ],
    'Cat': [
      { name: 'Baseball Cap', cost: 25, isUnlocked: false, isVisible: true },
      { name: 'Top Hat', cost: 30, isUnlocked: false, isVisible: true },
      { name: 'Sunglasses', cost: 20, isUnlocked: false, isVisible: true },
      { name: 'Football', cost: 15, isUnlocked: false, isVisible: true },
    ],
    'Dog': [
      { name: 'Baseball Cap', cost: 25, isUnlocked: false, isVisible: true },
      { name: 'Top Hat', cost: 30, isUnlocked: false, isVisible: true },
      { name: 'Sunglasses', cost: 20, isUnlocked: false, isVisible: true },
      { name: 'Football', cost: 15, isUnlocked: false, isVisible: true },
    ],
    'Lion': [
      { name: 'Baseball Cap', cost: 25, isUnlocked: false, isVisible: true },
      { name: 'Top Hat', cost: 30, isUnlocked: false, isVisible: true },
      { name: 'Sunglasses', cost: 20, isUnlocked: false, isVisible: true },
      { name: 'Football', cost: 15, isUnlocked: false, isVisible: true },
    ],
    'Unicorn': [
      { name: 'Baseball Cap', cost: 25, isUnlocked: false, isVisible: true },
      { name: 'Top Hat', cost: 30, isUnlocked: false, isVisible: true },
      { name: 'Sunglasses', cost: 20, isUnlocked: false, isVisible: true },
      { name: 'Football', cost: 15, isUnlocked: false, isVisible: true },
    ],
  };

  for (const pet of defaultPets) {
    try {
      const { rows: petRows } = await pool.query(
        `INSERT INTO pets (user_id, name, is_unlocked, is_visible, cost)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [userId, pet.name, pet.isUnlocked, pet.isVisible, pet.cost]
      );

      const petId = petRows[0].id;
      const accessories = defaultAccessories[pet.name] || [];

      for (const accessory of accessories) {
        await pool.query(
          `INSERT INTO pet_accessories (pet_id, name, is_unlocked, is_visible, cost)
           VALUES ($1, $2, $3, $4, $5)`,
          [petId, accessory.name, accessory.isUnlocked, accessory.isVisible, accessory.cost]
        );
      }
      console.log(`Created pet "${pet.name}" (ID: ${petId}) with ${accessories.length} accessories`);
    } catch (err) {
      console.error(`Error creating pet "${pet.name}":`, err);
      throw err;
    }
  }
  console.log(`Successfully initialized all pets for user ${userId}`);
}

// Login Function
async function loginUser(payload) {
  const { email, password } = validate(LoginSchema, payload);

  const userRow = await findUserByEmail(email);
  if (!userRow) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const ok = await verifyPassword(password, userRow.password_hash);
  if (!ok) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  // Check for daily login reward (only for children)
  let dailyRewardAwarded = false;
  // Get today's date in UTC to avoid timezone issues
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    .toISOString().split('T')[0]; // YYYY-MM-DD format
  
  if (userRow.role === 'child') {
    let lastLoginDate = null;
    if (userRow.last_login_date) {
      // Convert to UTC date string for comparison
      const lastLogin = new Date(userRow.last_login_date);
      lastLoginDate = new Date(Date.UTC(
        lastLogin.getUTCFullYear(), 
        lastLogin.getUTCMonth(), 
        lastLogin.getUTCDate()
      )).toISOString().split('T')[0];
    }
    
    // Award daily reward if last login was not today
    if (lastLoginDate !== today) {
      const newPoints = (userRow.points || 0) + 5;
      await pool.query(
        `UPDATE users SET points = $1, last_login_date = $2 WHERE id = $3`,
        [newPoints, today, userRow.id]
      );
      userRow.points = newPoints;
      dailyRewardAwarded = true;
    } else {
      // Update last_login_date even if reward already given today
      await pool.query(
        `UPDATE users SET last_login_date = $1 WHERE id = $2`,
        [today, userRow.id]
      );
    }
  } else {
    // Update last_login_date for non-child users (no reward)
    await pool.query(
      `UPDATE users SET last_login_date = $1 WHERE id = $2`,
      [today, userRow.id]
    );
  }

  // Fetch updated user data to ensure points are current
  const { rows: updatedUserRows } = await pool.query(
    `SELECT id, email, first_name AS "firstName", last_name AS "lastName", 
            role, family_code AS "familyCode", date_of_birth AS "dateOfBirth", 
            created_at AS "createdAt", points, username, profile_image AS "profileImage"
     FROM users WHERE id = $1`,
    [userRow.id]
  );
  
  const updatedUser = updatedUserRows[0];
  const { password_hash, ...user } = updatedUser || userRow;
  const token = generateToken(user);
  return { user, token, dailyRewardAwarded, dailyRewardPoints: dailyRewardAwarded ? 5 : 0 };
}

// Basic Routes
app.get('/', (req, res) => res.json({ message: 'Backend is running!' }));

app.get('/dbtest', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ connected: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// Register Route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { user, token } = await registerUser(req.body);
    res.status(201).json({ user, token });
  } catch (err) {
    const status = err.status || 500;
    console.error('Register error:', err);
    res.status(status).json({ error: err.message || 'Server error' });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { user, token, dailyRewardAwarded, dailyRewardPoints } = await loginUser(req.body);
    res.json({ user, token, dailyRewardAwarded, dailyRewardPoints });
  } catch (err) {
    const status = err.status || 500;
    console.error('Login error:', err);
    res.status(status).json({ error: err.message || 'Server error' });
  }
});

// Temporary in-memory verification system (for console testing)
const verificationCodes = {}; // store email-code pairs

// Send verification code — prints to console
app.post('/api/auth/send-code', async (req, res) => {
  console.log('📩 /send-code called with:', req.body);
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  // Generate random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[email] = code;

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'lolerpops1@gmail.com',
    subject: 'Your Pet Quest Verification Code',
    text: `Your verification code is: ${code}`,
    html: `<p>Your verification code is: <strong>${code}</strong></p>`,
  };

  try{
    await sgMail.send(msg);
    console.log(`Sent verification code to ${email}: ${code}`);
    res.json({message: 'Verification Code sent to your email'});
  } catch (err){
    console.error('SendGrid error:', err.response?.body || err.message);
    res.status(500).json({error: 'Failed to send verification email.'});
  }

});

// Verify the code entered by the user
app.post('/api/auth/verify-code', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required.' });
  }

  if (verificationCodes[email] !== code) {
    return res.status(400).json({ error: 'Invalid or expired verification code.' });
  }

  //Remove code after success
  delete verificationCodes[email];
  res.json({ message: 'Verification successful!' });
});


// In-memory password reset codes (temporary)
const resetCodes = {};

// Request reset code — sends email now
app.post('/api/auth/forgot-password', async (req, res) => {
  console.log('📩 /forgot-password called with:', req.body)
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ error: 'No account found with that email.' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    resetCodes[email] = code;

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'lolerpops1@gmail.com',
      subject: 'Your Pet Quest Password Reset Code',
      text: `Your Password Reset code is: ${code}`,
      html: `<p>Your Password Reset code is: <strong>${code}</strong></p>`,
    };

    await sgMail.send(msg);
    console.log({message: 'Password reset code sent to ${email}: ${code}`'});
    res.json({message:'Password reset code sent to your email.'});

  } catch (err) {
    console.error('Error generating reset code:', err);
    res.status(500).json({ error: 'Server error during password reset request.' });
  }
});

// Reset password using code (in-app)
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, code, and new password are required.' });
  }

  if (resetCodes[email] !== code) {
    return res.status(400).json({ error: 'Invalid or expired reset code.' });
  }

  try {
    const passwordHash = await hashPassword(newPassword);
    await pool.query(
      `UPDATE users SET password_hash = $1 WHERE email = $2`,
      [passwordHash, email]
    );

    delete resetCodes[email];
    res.json({ message: 'Password successfully reset.' });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ error: 'Server error resetting password.' });
  }
});


// Profile Routes
app.get('/api/users/me', authMiddleware, async (req, res) => {
  try {
    const user = await findUserById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('GET /me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/users/me', authMiddleware, async (req, res) => {
  try {
    const data = validate(UpdateProfileSchema, req.body);
    const dob = data.dateOfBirth ? data.dateOfBirth.toISOString().slice(0, 10) : null;

    const { rows } = await pool.query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           date_of_birth = COALESCE($3, date_of_birth)
       WHERE id = $4
       RETURNING id, email, first_name AS "firstName", last_name AS "lastName",
                 role, family_code AS "familyCode", date_of_birth AS "dateOfBirth", created_at AS "createdAt"`,
      [data.firstName || null, data.lastName || null, dob, req.user.sub]
    );

    res.json(rows[0]);
  } catch (err) {
    const status = err.status || 500;
    console.error('PUT /me error:', err);
    res.status(status).json({ error: err.message || 'Server error' });
  }
});

// Update account info (first name, username, profile image)
app.put('/api/account/update-account', authMiddleware, async (req, res) => {
  const { firstName, username, profileImage } = req.body;
  const userId = req.user.sub;

  if (!firstName && !username && !profileImage) {
    return res.status(400).json({ error: 'At least one field must be provided.' });
  }

  try {
    const updates = [];
    const values = [];
    let idx = 1;

    if (firstName) {
      updates.push(`first_name = $${idx++}`);
      values.push(firstName);
    }
    if (username) {
      updates.push(`username = $${idx++}`);
      values.push(username);
    }
    if (profileImage) {
      updates.push(`profile_image = $${idx++}`);
      values.push(profileImage);
    }

    values.push(userId);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${idx}
      RETURNING id, email, username, first_name AS "firstName", profile_image AS "profileImage", role;
    `;

    const { rows } = await pool.query(query, values);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating account:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      position: err.position
    });
    res.status(500).json({ 
      error: 'Failed to update account info.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});


// Delete account route
app.delete('/api/account/delete-account', authMiddleware, async (req, res) => {
  const userId = req.user.sub;

  try {
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ message: 'Account deleted permanently.' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ error: 'Error deleting account.' });
  }
});

// Task Routes
// Create task schema
const CreateTaskSchema = z.object({
  text: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional().default(''),
  points: z.number().int().min(0).optional().default(0),
  dueDate: z.string(), // ISO string
  assignedToUserId: z.number().int(),
  type: z.enum(['task', 'event']).optional().default('task'), // Allow 'task' or 'event'
});

// Create a task (parent creates task for child)
app.post('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const data = validate(CreateTaskSchema, req.body);
    
    // Verify the user is a parent
    const user = await findUserById(userId);
    if (!user || user.role !== 'parent') {
      return res.status(403).json({ error: 'Only parents can create tasks' });
    }

    // Verify assignedToUserId exists and is a child in the same family
    const { rows: assignedUserRows } = await pool.query(
      `SELECT id, role, family_code FROM users WHERE id = $1`,
      [data.assignedToUserId]
    );
    
    if (assignedUserRows.length === 0) {
      return res.status(404).json({ error: 'Assigned user not found' });
    }
    
    const assignedUser = assignedUserRows[0];
    if (assignedUser.role !== 'child') {
      return res.status(400).json({ error: 'Can only assign tasks to child accounts' });
    }
    
    if (assignedUser.family_code !== user.familyCode) {
      return res.status(403).json({ error: 'Can only assign tasks to children in your family' });
    }

    // Use the validated type from schema (defaults to 'task' if not provided)
    const taskType = data.type || 'task';
    const { rows } = await pool.query(
      `INSERT INTO tasks (text, category, description, points, due_date, assigned_to_user_id, assigned_by_user_id, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, text, completed, category, description, points, 
                 CASE 
                   WHEN type = 'event' AND due_date IS NOT NULL THEN due_date::text
                   WHEN due_date IS NOT NULL THEN TO_CHAR(due_date, 'YYYY-MM-DD')
                   ELSE NULL 
                 END AS "dueDate",
                 assigned_to_user_id AS "assignedToUserId",
                 assigned_by_user_id AS "assignedByUserId", created_at AS "createdAt", type`,
      [data.text, data.category, data.description, data.points, data.dueDate, data.assignedToUserId, userId, taskType]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    const status = err.status || 500;
    console.error('Create task error:', err);
    res.status(status).json({ error: err.message || 'Server error' });
  }
});

// Get tasks (for both parent and child)
app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const user = await findUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let query;
    let params;

    if (user.role === 'parent') {
      // Parents see all tasks they created
      // Return full datetime for events (to include time), date only for tasks
      query = `SELECT t.id, t.text, t.completed, t.category, t.description, t.points, t.type,
                      CASE 
                        WHEN t.type = 'event' AND t.due_date IS NOT NULL THEN t.due_date::text
                        WHEN t.due_date IS NOT NULL THEN TO_CHAR(t.due_date, 'YYYY-MM-DD')
                        ELSE NULL 
                      END AS "dueDate", 
                      t.assigned_to_user_id AS "assignedToUserId",
                      t.assigned_by_user_id AS "assignedByUserId", t.created_at AS "createdAt",
                      u.first_name AS "assignedToName"
               FROM tasks t
               LEFT JOIN users u ON t.assigned_to_user_id = u.id
               WHERE t.assigned_by_user_id = $1
               ORDER BY t.due_date ASC, t.created_at DESC`;
      params = [userId];
    } else if (user.role === 'child') {
      // Children see tasks assigned to them
      // Return full datetime for events (to include time), date only for tasks
      query = `SELECT t.id, t.text, t.completed, t.category, t.description, t.points, t.type,
                      CASE 
                        WHEN t.type = 'event' AND t.due_date IS NOT NULL THEN t.due_date::text
                        WHEN t.due_date IS NOT NULL THEN TO_CHAR(t.due_date, 'YYYY-MM-DD')
                        ELSE NULL 
                      END AS "dueDate", 
                      t.assigned_to_user_id AS "assignedToUserId",
                      t.assigned_by_user_id AS "assignedByUserId", t.created_at AS "createdAt",
                      u.first_name AS "assignedByName"
               FROM tasks t
               LEFT JOIN users u ON t.assigned_by_user_id = u.id
               WHERE t.assigned_to_user_id = $1
               ORDER BY t.due_date ASC, t.created_at DESC`;
      params = [userId];
    } else {
      // Individual users see their own tasks (if any)
      query = `SELECT t.id, t.text, t.completed, t.category, t.description, t.points, t.type,
                      CASE WHEN t.due_date IS NOT NULL THEN TO_CHAR(t.due_date, 'YYYY-MM-DD') ELSE NULL END AS "dueDate", 
                      t.assigned_to_user_id AS "assignedToUserId",
                      t.assigned_by_user_id AS "assignedByUserId", t.created_at AS "createdAt"
               FROM tasks t
               WHERE t.assigned_to_user_id = $1 OR t.assigned_by_user_id = $1
               ORDER BY t.due_date ASC, t.created_at DESC`;
      params = [userId];
    }

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update task (toggle complete, update fields)
app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    // Ensure userId is a number (JWT sub might be string)
    const userId = typeof req.user.sub === 'string' ? parseInt(req.user.sub, 10) : req.user.sub;
    const taskId = req.params.id;
    const { completed, text, category, description, points, dueDate } = req.body;

    // Get the task first
    const { rows: taskRows } = await pool.query(
      `SELECT * FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (taskRows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskRows[0];
    const user = await findUserById(userId);

    // Only the assigned child can toggle completion, or parent can update any field
    // Convert both to numbers for proper comparison (handle both string and number types)
    const assignedToUserId = Number(task.assigned_to_user_id);
    const currentUserId = Number(userId);
    
    // Debug logging
    console.log('Task completion check:', {
      taskId,
      assignedToUserId,
      currentUserId,
      assignedToUserIdRaw: task.assigned_to_user_id,
      currentUserIdRaw: userId,
      assignedToUserIdType: typeof task.assigned_to_user_id,
      currentUserIdType: typeof userId,
      areEqual: assignedToUserId === currentUserId
    });
    
    // Prevent children from completing events
    if (completed !== undefined && task.type === 'event' && user.role === 'child') {
      return res.status(403).json({ error: 'Events cannot be completed. They are informational only.' });
    }
    
    if (completed !== undefined && assignedToUserId !== currentUserId) {
      console.error('Permission denied - User ID mismatch:', {
        assignedTo: assignedToUserId,
        current: currentUserId,
        taskAssignedTo: task.assigned_to_user_id,
        reqUserId: userId
      });
      return res.status(403).json({ error: 'Only the assigned user can complete tasks' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (completed !== undefined) {
      updates.push(`completed = $${paramIndex++}`);
      values.push(completed);
    }
    if (text !== undefined) {
      updates.push(`text = $${paramIndex++}`);
      values.push(text);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(category);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (points !== undefined) {
      updates.push(`points = $${paramIndex++}`);
      values.push(points);
    }
    if (dueDate !== undefined) {
      updates.push(`due_date = $${paramIndex++}`);
      values.push(dueDate);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(taskId);

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE tasks
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, text, completed, category, description, points, type,
                CASE WHEN due_date IS NOT NULL THEN TO_CHAR(due_date, 'YYYY-MM-DD') ELSE NULL END AS "dueDate",
                assigned_to_user_id AS "assignedToUserId",
                assigned_by_user_id AS "assignedByUserId", created_at AS "createdAt"
    `;

    const { rows } = await pool.query(query, values);
    res.json(rows[0]);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete task
app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const taskId = req.params.id;

    // Get the task first
    const { rows: taskRows } = await pool.query(
      `SELECT assigned_by_user_id FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (taskRows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Only the parent who created the task can delete it
    if (taskRows[0].assigned_by_user_id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Only the task creator can delete tasks' });
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get children for a parent (to populate the child selection dropdown)
app.get('/api/users/children', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const user = await findUserById(userId);

    if (!user || user.role !== 'parent') {
      return res.status(403).json({ error: 'Only parents can access this endpoint' });
    }

    const { rows } = await pool.query(
      `SELECT id, first_name AS "firstName", last_name AS "lastName", email
       FROM users
       WHERE family_code = $1 AND role = 'child'
       ORDER BY first_name`,
      [user.familyCode]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get children error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

<<<<<<< HEAD
// Parent adds a child to their family (reuses registerUser logic)
app.post('/api/users/add-child', authMiddleware, async (req, res) => {
  try {
    const parentId = req.user.sub;
    const { email, password, firstName, lastName, dateOfBirth } = req.body;

    // 1. Make sure the requester is a parent
    const parent = await findUserById(parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(403).json({ error: 'Only parents can add children.' });
    }

    if (!parent.familyCode) {
      return res.status(400).json({ error: 'Parent does not have a family code set.' });
    }

    // Validate dateOfBirth is provided
    if (!dateOfBirth || !dateOfBirth.trim()) {
      return res.status(400).json({ error: 'Date of birth is required.' });
    }

    // 2. Register the child user
    console.log('Registering child with dateOfBirth:', dateOfBirth);
    const { user: child } = await registerUser({
      email,
      password,
      firstName,
      lastName,
      role: 'child',
      familyCode: parent.familyCode,
      dateOfBirth: dateOfBirth.trim(), // Include date of birth
    });

    return res.status(201).json({
      message: 'Child added successfully.',
      child,
    });
  } catch (err) {
    console.error('Add child error:', {
      message: err.message,
      status: err.status,
    });
    const status = err.status || 500;
    return res.status(status).json({
      error: err.message || 'Failed to add child.',
    });
  }
});

// Parent removes a child from their family
app.delete('/api/users/remove-child/:id', authMiddleware, async (req, res) => {
  try {
    const parentId = req.user.sub;      // UUID from JWT
    const childId = req.params.id;      // UUID string from URL

    // Verify the requester is a parent
    const parent = await findUserById(parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(403).json({ error: 'Only parents can remove children.' });
    }

    // Find the child
    const child = await findUserById(childId);
    if (!child || child.role !== 'child') {
      return res.status(404).json({ error: 'Child not found.' });
    }

    // Ensure this child is in the same family
    if (child.familyCode !== parent.familyCode) {
      return res.status(403).json({ error: 'This child does not belong to your family.' });
    }

    // Delete the child user (any cascading deletes depend on your DB constraints)
    await pool.query('DELETE FROM users WHERE id = $1', [childId]);

    res.json({ message: 'Child removed successfully.' });
  } catch (err) {
    console.error('Remove child error:', err);
    res.status(500).json({ error: 'Failed to remove child.' });
=======
// Initialize pets for existing users (if they don't have any)
// NOTE: This route must come BEFORE /api/pets to avoid route conflicts
app.post('/api/pets/initialize', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    console.log(`[POST /api/pets/initialize] Initializing pets for user ${userId}`);
    
    // Check if user already has pets
    const { rows: existingPets } = await pool.query(
      `SELECT id FROM pets WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    if (existingPets.length > 0) {
      console.log(`[POST /api/pets/initialize] User ${userId} already has ${existingPets.length} pets`);
      return res.json({ message: 'Pets already initialized', initialized: false });
    }

    console.log(`[POST /api/pets/initialize] Creating default pets for user ${userId}`);
    await initializeDefaultPets(userId);
    
    // Verify pets were created
    const { rows: newPets } = await pool.query(
      `SELECT id, name FROM pets WHERE user_id = $1`,
      [userId]
    );
    console.log(`[POST /api/pets/initialize] Created ${newPets.length} pets:`, newPets.map(p => p.name));
    
    res.json({ message: 'Pets initialized successfully', initialized: true, count: newPets.length });
  } catch (err) {
    console.error('Initialize pets error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Get pets for the current user (with accessories)
app.get('/api/pets', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    
    // Get all pets for this user (including invisible ones for shop display)
    const { rows: pets } = await pool.query(
      `SELECT id, user_id AS "userId", name, image_url AS "imageUrl", 
              is_unlocked AS "isUnlocked", is_visible AS "isVisible", cost
       FROM pets
       WHERE user_id = $1
       ORDER BY id`,
      [userId]
    );

    console.log(`[GET /api/pets] Found ${pets.length} pets for user ${userId}`);

    // Get accessories for each pet
    const petsWithAccessories = await Promise.all(
      pets.map(async (pet) => {
        const { rows: accessories } = await pool.query(
          `SELECT id, name, image_url AS "imageUrl", 
                  is_unlocked AS "isUnlocked", is_visible AS "isVisible", cost
           FROM pet_accessories
           WHERE pet_id = $1
           ORDER BY id`,
          [pet.id]
        );
        return {
          ...pet,
          accessories: accessories || []
        };
      })
    );

    console.log(`[GET /api/pets] Returning ${petsWithAccessories.length} pets with accessories`);
    res.json(petsWithAccessories);
  } catch (err) {
    console.error('Get pets error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Purchase a pet or accessory
app.post('/api/shop/purchase', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { type, id } = req.body;

    if (!type || !id) {
      return res.status(400).json({ error: 'Type and id are required' });
    }

    if (type !== 'pet' && type !== 'accessory') {
      return res.status(400).json({ error: 'Type must be "pet" or "accessory"' });
    }

    // Get user's current points
    const { rows: userRows } = await pool.query(
      `SELECT points FROM users WHERE id = $1`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userPoints = userRows[0].points;

    // Get the item to purchase
    let item;
    if (type === 'pet') {
      const { rows: petRows } = await pool.query(
        `SELECT id, cost, is_unlocked, user_id FROM pets WHERE id = $1`,
        [id]
      );
      if (petRows.length === 0) {
        return res.status(404).json({ error: 'Pet not found' });
      }
      item = petRows[0];
      
      // Verify the pet belongs to this user
      if (item.user_id !== parseInt(userId)) {
        return res.status(403).json({ error: 'You can only purchase your own pets' });
      }
    } else {
      const { rows: accRows } = await pool.query(
        `SELECT pa.id, pa.cost, pa.is_unlocked, pa.pet_id, p.user_id 
         FROM pet_accessories pa
         JOIN pets p ON pa.pet_id = p.id
         WHERE pa.id = $1`,
        [id]
      );
      if (accRows.length === 0) {
        return res.status(404).json({ error: 'Accessory not found' });
      }
      item = accRows[0];
      
      // Verify the accessory's pet belongs to this user
      if (item.user_id !== parseInt(userId)) {
        return res.status(403).json({ error: 'You can only purchase accessories for your pets' });
      }
    }

    // Check if already unlocked
    if (item.is_unlocked) {
      return res.status(400).json({ error: 'Item is already unlocked' });
    }

    // Check if user has enough points
    if (userPoints < item.cost) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Deduct points
      const newPoints = userPoints - item.cost;
      await pool.query(
        `UPDATE users SET points = $1 WHERE id = $2`,
        [newPoints, userId]
      );

      // Unlock the item
      if (type === 'pet') {
        await pool.query(
          `UPDATE pets SET is_unlocked = true WHERE id = $1`,
          [id]
        );
      } else {
        await pool.query(
          `UPDATE pet_accessories SET is_unlocked = true WHERE id = $1`,
          [id]
        );
      }

      await pool.query('COMMIT');

      res.json({ success: true, points: newPoints });
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('Purchase error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update pet name
app.patch('/api/pets/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const petId = req.params.id;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Pet name is required' });
    }

    // Verify the pet belongs to this user
    const { rows: petRows } = await pool.query(
      `SELECT id, user_id FROM pets WHERE id = $1`,
      [petId]
    );

    if (petRows.length === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    if (petRows[0].user_id !== parseInt(userId)) {
      return res.status(403).json({ error: 'You can only update your own pets' });
    }

    // Update the pet name
    const { rows: updatedRows } = await pool.query(
      `UPDATE pets SET name = $1 WHERE id = $2 RETURNING id, name, image_url AS "imageUrl", 
              is_unlocked AS "isUnlocked", is_visible AS "isVisible", cost`,
      [name.trim(), petId]
    );

    res.json(updatedRows[0]);
  } catch (err) {
    console.error('Update pet error:', err);
    res.status(500).json({ error: 'Server error' });
>>>>>>> origin/tasos-4
  }
});

// Starts Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  let networkIP = 'localhost';
  
  // Find the first non-internal IPv4 address
  for (const interfaceName in networkInterfaces) {
    const addresses = networkInterfaces[interfaceName];
    for (const addr of addresses) {
      if (addr.family === 'IPv4' && !addr.internal) {
        networkIP = addr.address;
        break;
      }
    }
    if (networkIP !== 'localhost') break;
  }
  
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`   Accessible at http://localhost:${PORT}`);
  console.log(`   Accessible at http://127.0.0.1:${PORT}`);
  console.log(`   Accessible at http://${networkIP}:${PORT} (for mobile devices/simulators)`);
});
