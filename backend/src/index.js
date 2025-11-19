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
  dateOfBirth: IsoDateString.optional(),
}).refine((data) => {
  if (data.role === 'parent' || data.role === 'individual') {
    if (!data.dateOfBirth) return false;
    return isAtLeastAge(data.dateOfBirth, 13);
  }
  return true;
}, {
  message: 'Parent and individual accounts must have a valid date of birth (13+).'
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
    console.log("✅ Authenticated user:", decoded);
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
            role, family_code AS "familyCode", date_of_birth AS "dateOfBirth", created_at AS "createdAt", points
     FROM users
     WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

async function findUserById(id) {
  const { rows } = await pool.query(
    `SELECT id, email, first_name AS "firstName", last_name AS "lastName",
            role, family_code AS "familyCode", date_of_birth AS "dateOfBirth", created_at AS "createdAt", points
     FROM users
     WHERE id = $1`,
    [id]
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

  const token = generateToken(user);
  return { user, token };
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

  const { password_hash, ...user } = userRow;
  const token = generateToken(user);
  return { user, token };
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
    const { user, token } = await loginUser(req.body);
    res.json({ user, token });
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

  console.log(`Generated verification code for ${email}: ${code}`);

  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is missing');
    return res.status(500).json({ error: 'Email service not configured' });
  }

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

    console.log('Executing query:', query);
    console.log('With values:', values);
    const { rows } = await pool.query(query, values);
    console.log('Query successful, rows returned:', rows);
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

// Get all pets for current user (with accessories)
app.get('/api/pets', authMiddleware, async (req, res) => {
  const userId = req.user.sub;

  try {
    const { rows } = await pool.query(
      `SELECT
         p.id,
         p.user_id      AS "userId",
         p.name,
         p.image_url    AS "imageUrl",
         p.is_unlocked  AS "isUnlocked",
         p.is_visible   AS "isVisible",
         p.cost,
         COALESCE(
           json_agg(
             json_build_object(
               'id', a.id,
               'name', a.name,
               'imageUrl', a.image_url,
               'isUnlocked', a.is_unlocked,
               'isVisible', a.is_visible,
               'cost', a.cost
             )
           ) FILTER (WHERE a.id IS NOT NULL),
           '[]'
         ) AS accessories
       FROM pets p
       LEFT JOIN pet_accessories a ON a.pet_id = p.id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.id`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /api/pets error:', err);
    res.status(500).json({ error: 'Failed to fetch pet collection' });
  }
});

// Toggle pet visibility
app.patch('/api/pets/:id/visibility', authMiddleware, async (req, res) => {
  const userId = req.user.sub;
  const petId = parseInt(req.params.id, 10);
  const { isVisible } = req.body;

  if (Number.isNaN(petId)) {
    return res.status(400).json({ error: 'Invalid pet id' });
  }
  if (typeof isVisible !== 'boolean') {
    return res.status(400).json({ error: 'isVisible must be boolean' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE pets
       SET is_visible = $1
       WHERE id = $2 AND user_id = $3
       RETURNING
         id,
         user_id     AS "userId",
         name,
         image_url   AS "imageUrl",
         is_unlocked AS "isUnlocked",
         is_visible  AS "isVisible",
         cost`,
      [isVisible, petId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /api/pets/:id/visibility error:', err);
    res.status(500).json({ error: 'Failed to update pet visibility' });
  }
});

// Toggle accessory visibility
app.patch('/api/pet-accessories/:id/visibility', authMiddleware, async (req, res) => {
  const userId = req.user.sub;
  const accessoryId = parseInt(req.params.id, 10);
  const { isVisible } = req.body;

  if (Number.isNaN(accessoryId)) {
    return res.status(400).json({ error: 'Invalid accessory id' });
  }
  if (typeof isVisible !== 'boolean') {
    return res.status(400).json({ error: 'isVisible must be boolean' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE pet_accessories a
       SET is_visible = $1
       FROM pets p
       WHERE a.id = $2
         AND a.pet_id = p.id
         AND p.user_id = $3
       RETURNING
         a.id,
         a.pet_id,
         a.name,
         a.image_url AS "imageUrl",
         a.is_unlocked AS "isUnlocked",
         a.is_visible AS "isVisible",
         a.cost`,
      [isVisible, accessoryId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Accessory not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /api/pet-accessories/:id/visibility error:', err);
    res.status(500).json({ error: 'Failed to update accessory visibility' });
  }
});

// Create a new pet for the logged-in user
app.post("/api/pets", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub; // comes from your JWT middleware
    const {
      name,
      imageUrl = null,
      isUnlocked = false,
      isVisible = false,
      cost = 0,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Pet name is required." });
    }

    // If this pet is set visible, you may want to hide others for this user
    if (isVisible) {
      await pool.query(
        "UPDATE pets SET is_visible = FALSE WHERE user_id = $1",
        [userId]
      );
    }

    const result = await pool.query(
      `INSERT INTO pets (user_id, name, image_url, is_unlocked, is_visible, cost)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, name, imageUrl, isUnlocked, isVisible, cost]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating pet:", err);
    return res.status(500).json({ error: "Failed to create pet." });
  }
});

// Create a new accessory for one of the user's pets
app.post("/api/pet-accessories", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const {
      petId,
      name,
      imageUrl = null,
      isUnlocked = false,
      isVisible = false,
      cost = 0,
    } = req.body;

    if (!petId || !name) {
      return res.status(400).json({ error: "petId and name are required." });
    }

    // Verify that this pet belongs to the logged-in user
    const petCheck = await pool.query(
      "SELECT id FROM pets WHERE id = $1 AND user_id = $2",
      [petId, userId]
    );
    if (petCheck.rowCount === 0) {
      return res.status(403).json({ error: "You do not own this pet." });
    }

    if (isVisible) {
      await pool.query(
        `UPDATE pet_accessories
         SET is_visible = FALSE
         WHERE pet_id = $1`,
        [petId]
      );
    }

    const result = await pool.query(
      `INSERT INTO pet_accessories (pet_id, name, image_url, is_unlocked, is_visible, cost)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [petId, name, imageUrl, isUnlocked, isVisible, cost]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating pet accessory:", err);
    return res.status(500).json({ error: "Failed to create pet accessory." });
  }
});

// SEED DEFAULT PETS + ACCESSORIES FOR THE LOGGED-IN USER
app.post('/api/pets/seed-defaults', authMiddleware, async (req, res) => {
  const userId = req.user.sub;

  try {
    const client = await pool.connect();
    await client.query('BEGIN');

    // 1. Insert default pets
    const defaultPets = [
      { name: "Dragon", imageUrl: null, isUnlocked: true,  isVisible: true,  cost: 0 },
      { name: "Cat",    imageUrl: null, isUnlocked: true,  isVisible: false, cost: 0 },
      { name: "Dog",    imageUrl: null, isUnlocked: true,  isVisible: false, cost: 0 },
      { name: "Lion",   imageUrl: null, isUnlocked: false, isVisible: false, cost: 200 },
      { name: "Unicorn",imageUrl: null, isUnlocked: false, isVisible: false, cost: 300 }
    ];

    const petIds = {};

    for (const pet of defaultPets) {
      const result = await client.query(
        `INSERT INTO pets (user_id, name, image_url, is_unlocked, is_visible, cost)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [userId, pet.name, pet.imageUrl, pet.isUnlocked, pet.isVisible, pet.cost]
      );
      petIds[pet.name] = result.rows[0].id;
    }

    // 2. Default accessories
    const accessories = [
      { petName: "Dragon", name: "Baseball Cap", imageUrl: null, isUnlocked: true, isVisible: false, cost: 0 },
      { petName: "Dragon", name: "Top Hat",      imageUrl: null, isUnlocked: true, isVisible: false, cost: 50 },
      { petName: "Dragon", name: "Sunglasses",   imageUrl: null, isUnlocked: false, isVisible: false, cost: 30 },
      { petName: "Dragon", name: "Football",     imageUrl: null, isUnlocked: false, isVisible: false, cost: 40 }
    ];

    for (const a of accessories) {
      const petId = petIds[a.petName];
      await client.query(
        `INSERT INTO pet_accessories (pet_id, name, image_url, is_unlocked, is_visible, cost)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [petId, a.name, a.imageUrl, a.isUnlocked, a.isVisible, a.cost]
      );
    }

    await client.query('COMMIT');
    client.release();

    res.json({ message: "Default pets + accessories seeded!", pets: defaultPets.length, accessories: accessories.length });
  } catch (err) {
    console.error("❌ Seeding error:", err);
    res.status(500).json({ error: "Failed to seed defaults." });
  }
});

// Add or subtract points from the logged-in user
app.post('/api/users/me/add-points', authMiddleware, async (req, res) => {
  const userId = req.user.sub;
  const { amount } = req.body;

  if (typeof amount !== "number") {
    return res.status(400).json({ error: "amount must be a number" });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE users
       SET points = points + $1
       WHERE id = $2
       RETURNING id, email, points`,
      [amount, userId]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("Error updating points:", err);
    res.status(500).json({ error: "Failed to update points" });
  }
});

// Grabs children in family for task creation
app.get('/api/parent/children', authMiddleware, async (req, res) => {
  const parentId = req.user.sub;

  try {
    // Get parent to extract their family_code
    const { rows: parentRows } = await pool.query(
      `SELECT family_code FROM users WHERE id = $1 AND role = 'parent'`,
      [parentId]
    );

    if (parentRows.length === 0) {
      return res.status(400).json({ error: 'Parent account not found.' });
    }

    const familyCode = parentRows[0].family_code;

    // Get all children in that family
    const { rows: children } = await pool.query(
      `SELECT id, first_name AS "firstName", last_name AS "lastName", email
       FROM users
       WHERE family_code = $1 AND role = 'child'`,
      [familyCode]
    );

    res.json(children);
  } catch (err) {
    console.error('GET /parent/children error:', err);
    res.status(500).json({ error: 'Failed to load children list' });
  }
});

// Create and Send Task to Child
app.post('/api/tasks', authMiddleware, async (req, res) => {
  const parentId = req.user.sub;
  const { title, description, dueDate, pointValue, category, assignedTo } = req.body;

  if (!title || !assignedTo) {
    return res.status(400).json({ error: 'Title and assignedTo are required.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks
        (user_id, title, description, due_date, point_value, category, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        parentId,
        title,
        description || '',
        dueDate || null,
        pointValue || 0,
        category || 'Other',
        assignedTo
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/tasks error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Get all tasks created by parent
app.get('/api/parent/my-tasks', authMiddleware, async (req, res) => {
  const parentId = req.user.sub;

  try {
    const { rows: tasks } = await pool.query(
      `SELECT 
         t.id,
         t.title,
         t.description,
         t.due_date AS "dueDate",
         t.completed,
         t.point_value AS "points",
         t.category,
         t.assigned_to AS "assignedTo",
         u.first_name AS "childName",
         u.email AS "childEmail"
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.user_id = $1
       ORDER BY t.due_date DESC`,
      [parentId]
    );

    // Format tasks for frontend
    const formattedTasks = tasks.map(task => {
      let dateString = '';
      let timeDisplay = 'All Day';
      
      if (task.dueDate) {
        try {
          const dueDate = new Date(task.dueDate);
          if (!isNaN(dueDate.getTime())) {
            dateString = dueDate.getFullYear() + '-' + 
                        String(dueDate.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(dueDate.getDate()).padStart(2, '0');
            
            timeDisplay = dueDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
          }
        } catch (err) {
          console.error('Error parsing dueDate:', err);
        }
      }
      
      return {
        id: task.id.toString(),
        text: task.title,
        description: task.description || '',
        completed: task.completed || false,
        category: task.category || 'Other',
        points: task.points || 0,
        assignedTo: task.assignedTo,
        childName: task.childName || 'Unassigned',
        childEmail: task.childEmail,
        date: dateString,
        time: timeDisplay
      };
    });

    res.json(formattedTasks);
  } catch (err) {
    console.error('GET /api/parent/my-tasks error:', err);
    res.status(500).json({ error: 'Failed to load parent tasks' });
  }
});

// Update task
app.put('/api/parent/tasks/:id', authMiddleware, async (req, res) => {
  const parentId = req.user.sub;
  const taskId = req.params.id;
  const { title, description, points, category, dueDate } = req.body;

  try {
    // Verify the task belongs to this parent
    const { rows: existingTasks } = await pool.query(
      `SELECT id FROM tasks WHERE id = $1 AND user_id = $2`,
      [taskId, parentId]
    );

    if (existingTasks.length === 0) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    const { rows: updatedTask } = await pool.query(
      `UPDATE tasks 
       SET title = $1, description = $2, point_value = $3, category = $4, due_date = $5
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [title, description, points, category, dueDate, taskId, parentId]
    );

    res.json(updatedTask[0]);
  } catch (err) {
    console.error('PUT /api/parent/tasks/:id error:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
app.delete('/api/parent/tasks/:id', authMiddleware, async (req, res) => {
  const parentId = req.user.sub;
  const taskId = req.params.id;

  try {
    // Verify the task belongs to this parent
    const { rows: existingTasks } = await pool.query(
      `SELECT id FROM tasks WHERE id = $1 AND user_id = $2`,
      [taskId, parentId]
    );

    if (existingTasks.length === 0) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    await pool.query(
      `DELETE FROM tasks WHERE id = $1 AND user_id = $2`,
      [taskId, parentId]
    );

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/parent/tasks/:id error:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Get tasks for parent's children (for calendar)
app.get('/api/parent/children-tasks', authMiddleware, async (req, res) => {
  const parentId = req.user.sub;

  try {
    // Get parent's family code
    const { rows: parentRows } = await pool.query(
      `SELECT family_code FROM users WHERE id = $1 AND role = 'parent'`,
      [parentId]
    );

    if (parentRows.length === 0) {
      return res.status(400).json({ error: 'Parent account not found.' });
    }

    const familyCode = parentRows[0].family_code;

    // Get all tasks for children in this family
    const { rows: tasks } = await pool.query(
      `SELECT 
         t.id,
         t.title AS "taskName",
         t.description,
         t.due_date AS "dueDate",
         t.completed,
         t.point_value AS "points",
         t.category,
         t.assigned_to AS "assignedTo",
         u.id AS "childId",
         u.first_name AS "childName",
         u.email AS "childEmail"
       FROM tasks t
       JOIN users u ON t.assigned_to = u.id
       WHERE u.family_code = $1 
         AND u.role = 'child'
         AND t.due_date IS NOT NULL
       ORDER BY t.due_date`,
      [familyCode]
    );

    // Format tasks for frontend
    const formattedTasks = tasks.map(task => {
      let timeString = 'All Day';
      let dateString = '';
      
      if (task.dueDate) {
        try {
          const dueDate = new Date(task.dueDate);
          if (!isNaN(dueDate.getTime())) {
            dateString = dueDate.getFullYear() + '-' + 
                        String(dueDate.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(dueDate.getDate()).padStart(2, '0');
            
            timeString = dueDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
          }
        } catch (err) {
          console.error('Error parsing dueDate:', err);
        }
      }
      
      return {
        id: task.id.toString(),
        childName: task.childName,
        childId: task.childId,
        taskName: task.taskName,
        description: task.description || '',
        time: timeString,
        points: task.points || 0,
        completed: task.completed || false,
        category: task.category || 'Other',
        date: dateString
      };
    });

    res.json(formattedTasks);
  } catch (err) {
    console.error('GET /api/parent/children-tasks error:', err);
    res.status(500).json({ error: 'Failed to load children tasks' });
  }
});


// Starts Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
