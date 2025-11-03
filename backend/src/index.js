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
            role, family_code AS "familyCode", date_of_birth AS "dateOfBirth", created_at AS "createdAt"
     FROM users
     WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

async function findUserById(id) {
  const { rows } = await pool.query(
    `SELECT id, email, first_name AS "firstName", last_name AS "lastName",
            role, family_code AS "familyCode", date_of_birth AS "dateOfBirth", created_at AS "createdAt"
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

// Update account info (first name, username only)
app.put('/api/account/update-account', authMiddleware, async (req, res) => {
  const { firstName, username } = req.body;
  const userId = req.user.sub;

  if (!firstName && !username) {
    return res.status(400).json({ error: 'At least one field (firstName or username) is required.' });
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

    values.push(userId);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${idx}
      RETURNING id, email, username, first_name AS "firstName", last_name AS "lastName", role;
    `;

    const { rows } = await pool.query(query, values);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating account:', err);
    res.status(500).json({ error: 'Failed to update account info.' });
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


// Starts Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
