const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./database');

const jwt = require('jsonwebtoken');
const { z } = require('zod');
const crypto = require('crypto');

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

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['parent', 'child', 'individual']),
  familyCode: z.string().length(6).optional(),
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

// Data Helpers
async function findUserByEmail(email) {
  const { rows } = await pool.query(
    `SELECT id, email, password_hash, first_name AS "firstName", last_name AS "lastName",
            date_of_birth AS "dateOfBirth", created_at AS "createdAt"
     FROM users
     WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

async function createUser({ email, passwordHash, firstName, lastName, dateOfBirth }) {
  const dob = dateOfBirth.toISOString().slice(0, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, date_of_birth)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, first_name AS "firstName", last_name AS "lastName",
               date_of_birth AS "dateOfBirth", created_at AS "createdAt"`,
    [email, passwordHash, firstName, lastName, dob]
  );
  return rows[0];
}

// Register Function
async function registerUser(payload) {
  const { email, password, firstName, lastName, dateOfBirth } = validate(RegisterSchema, payload);

  const exists = await findUserByEmail(email);
  if (exists) {
    const err = new Error('Email already in use');
    err.status = 409;
    throw err;
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({ email, passwordHash, firstName, lastName, dateOfBirth });
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

// Starts Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
