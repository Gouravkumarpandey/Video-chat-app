const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Server } = require('socket.io');
const Database = require('./database');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: true });
const db = new Database();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// --- Email Transporter ---
const emailTransporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

(async () => {
  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await emailTransporter.verify();
      console.log('✅ Email transporter ready');
    } else {
      console.log('⚠️ Email not configured, fallback to console logging');
    }
  } catch (err) {
    console.log('❌ Email transporter failed:', err.message);
  }
})();

// --- Utility functions ---
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const sendResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request - VideoMeet',
    html: `<p>Click here to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
  };
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    await emailTransporter.sendMail(mailOptions);
  } else {
    console.log('📧 DEMO RESET LINK:', resetUrl);
  }
};

const sendOTPEmail = async (email, otp, purpose) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Your VideoMeet OTP - ${otp}`,
    html: `<h2>${otp}</h2><p>Use this for ${purpose}</p>`,
  };
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    await emailTransporter.sendMail(mailOptions);
  } else {
    console.log('📧 DEMO OTP:', otp);
  }
};

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// --- Auth Routes ---
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ error: 'All fields required' });

    const existing = await db.getUserByEmail(email);
    if (existing) return res.status(400).json({ error: 'User exists' });

    const hashed = await bcrypt.hash(password, 10);
    const id = await db.createUser({ firstName, lastName, email, password: hashed });

    const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token, user: { id, firstName, lastName, email } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.getUserByEmail(email);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await db.getUserByEmail(email);
    if (!user) return res.json({ success: true });

    const token = crypto.randomBytes(32).toString('hex');
    await db.createPasswordResetToken(user.id, token, new Date(Date.now() + 3600000));
    await sendResetEmail(email, token);
    res.json({ success: true });
  } catch (err) {
    console.error('Forgot error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const data = await db.getPasswordResetToken(token);
    if (!data) return res.status(400).json({ error: 'Invalid token' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.updateUserPassword(data.user_id, hashed);
    await db.markPasswordResetTokenAsUsed(token);
    res.json({ success: true });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email, purpose } = req.body;
    const otp = generateOTP();
    await db.createOTP(email, otp, purpose, new Date(Date.now() + 10 * 60000));
    await sendOTPEmail(email, otp, purpose);
    res.json({ success: true });
  } catch (err) {
    console.error('OTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;
    const result = await db.verifyOTP(email, otp, purpose);
    if (!result.success) return res.status(400).json({ error: result.message });
    res.json({ success: true });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  const user = await db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// --- Socket.IO Logic (simplified demo) ---
io.on('connection', (socket) => {
  console.log('🔌 New client:', socket.id);

  socket.on('join-room', ({ roomId, name }) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', { name, socketId: socket.id });
  });

  socket.on('chat-message', ({ roomId, message, from }) => {
    socket.to(roomId).emit('chat-message', { from, message });
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected:', socket.id);
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
