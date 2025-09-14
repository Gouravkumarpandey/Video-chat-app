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

// Load environment variables
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: true,
});
const db = new Database();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Email configuration
const emailTransporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify email transporter configuration
const verifyEmailConfig = async () => {
    try {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await emailTransporter.verify();
            console.log('✅ Email transporter is ready to send emails');
        } else {
            console.log('⚠️  Email credentials not configured. Using console logging for emails.');
        }
    } catch (error) {
        console.log('❌ Email transporter verification failed:', error.message);
        console.log('📧 Falling back to console logging for emails.');
    }
};

// Initialize email configuration
verifyEmailConfig();

// Enhanced email sending function
const sendResetEmail = async (email, token) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Request - VideoMeet',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">VideoMeet</h1>
                </div>
                <div style="padding: 30px 20px;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p style="color: #666; line-height: 1.6;">
                        We received a request to reset your password for your VideoMeet account.
                    </p>
                    <p style="color: #666; line-height: 1.6;">
                        Click the button below to reset your password:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #4F46E5; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 6px; display: inline-block;
                                  font-weight: bold;">
                            Reset Your Password
                        </a>
                    </div>
                    <p style="color: #666; line-height: 1.6; font-size: 14px;">
                        This link will expire in 1 hour for security reasons.
                    </p>
                    <p style="color: #666; line-height: 1.6; font-size: 14px;">
                        If you didn't request this password reset, please ignore this email.
                    </p>
                </div>
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </div>
        `
    };

    // Try to send email if configured, otherwise log to console
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            await emailTransporter.sendMail(mailOptions);
            console.log(`✅ Password reset email sent to: ${email}`);
        } catch (error) {
            console.log(`❌ Failed to send email to ${email}:`, error.message);
            // Log the email content as fallback
            console.log('\n=== EMAIL CONTENT (FALLBACK) ===');
            console.log(`To: ${email}`);
            console.log(`Subject: ${mailOptions.subject}`);
            console.log(`Reset Link: ${resetUrl}`);
            console.log('=== END EMAIL ===\n');
            throw new Error('Failed to send reset email');
        }
    } else {
        // Log to console when email is not configured
        console.log('\n=== PASSWORD RESET EMAIL (DEMO MODE) ===');
        console.log(`To: ${email}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Reset Link: ${resetUrl}`);
        console.log('=== END EMAIL ===\n');
    }
};

// OTP Generation and Email Functions
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

const sendOTPEmail = async (email, otp, purpose) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Your VideoMeet Verification Code - ${otp}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">VideoMeet</h1>
                </div>
                <div style="padding: 30px 20px; text-align: center;">
                    <h2 style="color: #333;">Verification Code</h2>
                    <p style="color: #666; line-height: 1.6;">
                        ${purpose === 'email_verification' ? 'Welcome to VideoMeet! Please verify your email address.' : 
                          purpose === 'login_verification' ? 'Please verify your identity to continue.' :
                          'Please use this code to reset your password.'}
                    </p>
                    <div style="background-color: #f8f9fa; border: 2px dashed #4F46E5; padding: 20px; margin: 30px 0; border-radius: 8px;">
                        <h1 style="margin: 0; color: #4F46E5; font-size: 36px; letter-spacing: 8px;">${otp}</h1>
                    </div>
                    <p style="color: #666; line-height: 1.6; font-size: 14px;">
                        This code will expire in ${parseInt(process.env.OTP_EXPIRY_MINUTES) || 10} minutes for security reasons.
                    </p>
                    <p style="color: #666; line-height: 1.6; font-size: 14px;">
                        If you didn't request this code, please ignore this email.
                    </p>
                </div>
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </div>
        `
    };

    // Try to send email if configured, otherwise log to console
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            await emailTransporter.sendMail(mailOptions);
            console.log(`✅ OTP email sent to: ${email}`);
        } catch (error) {
            console.log(`❌ Failed to send OTP email to ${email}:`, error.message);
            // Log the OTP content as fallback
            console.log('\n=== OTP EMAIL CONTENT (FALLBACK) ===');
            console.log(`To: ${email}`);
            console.log(`Subject: ${mailOptions.subject}`);
            console.log(`OTP Code: ${otp}`);
            console.log('=== END EMAIL ===\n');
            throw new Error('Failed to send OTP email');
        }
    } else {
        // Log to console when email is not configured
        console.log('\n=== OTP EMAIL (DEMO MODE) ===');
        console.log(`To: ${email}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`OTP Code: ${otp}`);
        console.log(`Purpose: ${purpose}`);
        console.log('=== END EMAIL ===\n');
    }
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Authentication Routes

// User Registration
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Validate input
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const userId = await db.createUser({
            firstName,
            lastName,
            email,
            password: hashedPassword
        });

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: userId, 
                email: email,
                name: `${firstName} ${lastName}`
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: userId,
                firstName,
                lastName,
                email,
                name: `${firstName} ${lastName}`
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Get user from database
        const user = await db.getUserByEmail(email);
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email,
                name: `${user.firstName} ${user.lastName}`
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                name: `${user.firstName} ${user.lastName}`
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        // Validate input
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Check if user exists
        const user = await db.getUserByEmail(email);
        if (!user) {
            // For security, don't reveal if email exists or not
            return res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

        // Store reset token in database
        await db.createPasswordResetToken(user.id, resetToken, expiresAt);

        // Send reset email (for demo, we'll console.log it)
        await sendResetEmail(email, resetToken);

        res.json({ 
            success: true, 
            message: 'If an account with that email exists, a reset link has been sent.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Validate input
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Get reset token from database
        const resetTokenData = await db.getPasswordResetToken(token);
        if (!resetTokenData) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update user password
        await db.updateUserPassword(resetTokenData.user_id, hashedPassword);

        // Mark token as used
        await db.markPasswordResetTokenAsUsed(token);

        res.json({ 
            success: true, 
            message: 'Password has been reset successfully' 
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// OTP Endpoints

// Send OTP for email verification
app.post('/api/auth/send-otp', async (req, res) => {
    try {
        const { email, purpose = 'email_verification' } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

        // Save OTP to database
        await db.createOTP(email, otp, purpose, expiresAt);

        // Send OTP email
        await sendOTPEmail(email, otp, purpose);

        res.json({
            message: 'OTP sent successfully',
            expiresIn: `${expiryMinutes} minutes`
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp, purpose = 'email_verification' } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        // Verify OTP
        const result = await db.verifyOTP(email, otp, purpose);

        if (result.success) {
            res.json({
                success: true,
                message: result.message
            });
        } else {
            // Increment attempts for failed verification
            if (result.message !== 'Maximum attempts exceeded') {
                await db.incrementOTPAttempts(email, purpose);
            }
            res.status(400).json({
                success: false,
                error: result.message
            });
        }
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await db.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Store user and room information
const nameToSocketMapping = new Map();
const socketToNameMapping = new Map();
const socketToRoomMapping = new Map();
const socketToParticipantMapping = new Map();
const roomParticipants = new Map(); // roomId -> Set of socket IDs
const roomMeetings = new Map(); // roomId -> meeting data
const waitingRooms = new Map(); // roomId -> Set of waiting participants

io.on("connection", (socket) => {
    console.log('New Connection:', socket.id);

    socket.on("create-meeting", async (data) => {
        const { roomId, name, title, isWebinar = false, requireApproval = false } = data;
        console.log("Creating meeting:", roomId, "by", name);
        
        try {
            const meeting = await db.createMeeting(roomId, name, socket.id, {
                title,
                isWebinar,
                requireApproval
            });
            
            roomMeetings.set(roomId, {
                ...meeting,
                hostName: name,
                hostSocketId: socket.id,
                title,
                isWebinar,
                requireApproval
            });
            
            socket.emit("meeting-created", { meeting });
        } catch (error) {
            console.error("Error creating meeting:", error);
            socket.emit("meeting-error", { error: "Failed to create meeting" });
        }
    });

    socket.on("join-room", async (data) => {
        const { roomId, name } = data;
        console.log("User", name, "requesting to join Room", roomId);
        
        try {
            // Check if meeting exists
            let meeting = await db.getMeeting(roomId);
            if (!meeting) {
                // Create meeting if it doesn't exist (first user becomes host)
                meeting = await db.createMeeting(roomId, name, socket.id, {
                    title: `Meeting ${roomId}`
                });
                roomMeetings.set(roomId, {
                    ...meeting,
                    hostName: name,
                    hostSocketId: socket.id,
                    title: `Meeting ${roomId}`,
                    isWebinar: false,
                    requireApproval: false
                });
            }

            const meetingData = roomMeetings.get(roomId) || meeting;
            const isHost = meetingData.hostSocketId === socket.id || meetingData.hostName === name;
            const requireApproval = meetingData.requireApproval && !isHost;

            if (requireApproval) {
                // Add to waiting room
                const waitingEntry = await db.addToWaitingRoom(meeting.id, name, socket.id);
                
                if (!waitingRooms.has(roomId)) {
                    waitingRooms.set(roomId, new Set());
                }
                waitingRooms.get(roomId).add(socket.id);
                
                socket.emit("waiting-for-approval", { roomId, name });
                
                // Notify host about waiting participant
                if (meetingData.hostSocketId) {
                    io.to(meetingData.hostSocketId).emit("participant-waiting", {
                        name,
                        socketId: socket.id,
                        waitingId: waitingEntry.waitingId
                    });
                }
                return;
            }

            // Add participant to database
            const role = isHost ? 'host' : 'participant';
            const participant = await db.addParticipant(meeting.id, name, socket.id, role);
            
            // Store mappings
            nameToSocketMapping.set(name, socket.id);
            socketToNameMapping.set(socket.id, name);
            socketToRoomMapping.set(socket.id, roomId);
            socketToParticipantMapping.set(socket.id, participant);
            
            // Add to room participants
            if (!roomParticipants.has(roomId)) {
                roomParticipants.set(roomId, new Set());
            }
            roomParticipants.get(roomId).add(socket.id);
            
            // Join the room
            socket.join(roomId);
            
            // Load chat history
            const chatHistory = await db.getChatHistory(meeting.id);
            
            // Notify the user they joined successfully
            socket.emit("joined-room", { 
                roomId, 
                role,
                isHost,
                meeting: meetingData,
                chatHistory 
            });
            
            // Notify others in the room about the new user
            socket.broadcast.to(roomId).emit("user-joined", { 
                name, 
                socketId: socket.id,
                role
            });
            
            console.log(`Room ${roomId} now has ${roomParticipants.get(roomId).size} participants`);
        } catch (error) {
            console.error("Error joining room:", error);
            socket.emit("join-error", { error: "Failed to join room" });
        }
    });

    socket.on("approve-participant", async (data) => {
        const { waitingId, approved } = data;
        const hostSocket = socket.id;
        
        try {
            const status = approved ? 'approved' : 'denied';
            await db.updateWaitingRoomStatus(waitingId, status);
            
            if (approved) {
                // Handle approved participant joining
                // This would trigger the normal join flow
                socket.emit("participant-approved", { waitingId });
            } else {
                socket.emit("participant-denied", { waitingId });
            }
        } catch (error) {
            console.error("Error approving participant:", error);
        }
    });

    socket.on('call-user', data => {
        const { socketId, offer } = data;
        const fromName = socketToNameMapping.get(socket.id);
        console.log(`Call from ${fromName} to socket ${socketId}`);
        
        socket.to(socketId).emit('incomming-call', {
            from: socket.id,
            fromName: fromName,
            offer
        });
    });

    socket.on("call-accepted", (data) => {
        const { socketId, ans } = data;
        console.log(`Call accepted from socket ${socketId}`);
        socket.to(socketId).emit("call-accepted", { ans });
    });

    // Handle chat messages with persistence
    socket.on("chat-message", async (data) => {
        const { roomId, message, from, timestamp } = data;
        const participant = socketToParticipantMapping.get(socket.id);
        
        if (participant) {
            try {
                // Save message to database
                await db.saveChatMessage(participant.meetingId, participant.participantId, message);
                
                console.log(`Chat message in room ${roomId} from ${from}: ${message}`);
                
                // Broadcast message to all other users in the room
                socket.broadcast.to(roomId).emit("chat-message", {
                    message,
                    from,
                    timestamp
                });
            } catch (error) {
                console.error("Error saving chat message:", error);
            }
        }
    });

    // Host/Co-host controls
    socket.on("mute-participant", (data) => {
        const { socketId, roomId } = data;
        const hostParticipant = socketToParticipantMapping.get(socket.id);
        
        if (hostParticipant && (hostParticipant.role === 'host' || hostParticipant.role === 'co-host')) {
            io.to(socketId).emit("force-mute", { by: hostParticipant.name });
            socket.broadcast.to(roomId).emit("participant-muted", { 
                socketId, 
                by: hostParticipant.name 
            });
        }
    });

    socket.on("remove-participant", (data) => {
        const { socketId, roomId } = data;
        const hostParticipant = socketToParticipantMapping.get(socket.id);
        
        if (hostParticipant && (hostParticipant.role === 'host' || hostParticipant.role === 'co-host')) {
            io.to(socketId).emit("removed-from-meeting", { by: hostParticipant.name });
            socket.broadcast.to(roomId).emit("participant-removed", { 
                socketId, 
                by: hostParticipant.name 
            });
        }
    });

    socket.on("promote-to-cohost", async (data) => {
        const { socketId, roomId } = data;
        const hostParticipant = socketToParticipantMapping.get(socket.id);
        const targetParticipant = socketToParticipantMapping.get(socketId);
        
        if (hostParticipant && hostParticipant.role === 'host' && targetParticipant) {
            try {
                await db.updateParticipantRole(targetParticipant.participantId, 'co-host');
                targetParticipant.role = 'co-host';
                
                io.to(socketId).emit("role-updated", { role: 'co-host' });
                socket.broadcast.to(roomId).emit("participant-role-updated", { 
                    socketId, 
                    role: 'co-host',
                    by: hostParticipant.name 
                });
            } catch (error) {
                console.error("Error promoting to co-host:", error);
            }
        }
    });

    // Transcription
    socket.on("transcription", async (data) => {
        const { roomId, text, confidence } = data;
        const participant = socketToParticipantMapping.get(socket.id);
        
        if (participant) {
            try {
                await db.saveTranscription(participant.meetingId, participant.name, text, confidence);
                
                // Broadcast transcription to all participants
                socket.broadcast.to(roomId).emit("transcription", {
                    participant: participant.name,
                    text,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error("Error saving transcription:", error);
            }
        }
    });

    // Screen sharing
    socket.on("start-screen-share", (data) => {
        const { roomId } = data;
        const participant = socketToParticipantMapping.get(socket.id);
        
        if (participant) {
            socket.broadcast.to(roomId).emit("screen-share-started", {
                participantName: participant.name,
                socketId: socket.id
            });
        }
    });

    socket.on("stop-screen-share", (data) => {
        const { roomId } = data;
        const participant = socketToParticipantMapping.get(socket.id);
        
        if (participant) {
            socket.broadcast.to(roomId).emit("screen-share-stopped", {
                participantName: participant.name,
                socketId: socket.id
            });
        }
    });

    // Handle user leaving room
    socket.on("leave-room", async (data) => {
        const { roomId } = data;
        const userName = socketToNameMapping.get(socket.id);
        
        console.log(`User ${userName} leaving room ${roomId}`);
        
        try {
            // Update participant in database
            await db.removeParticipant(socket.id);
            
            // Remove from room participants
            if (roomParticipants.has(roomId)) {
                roomParticipants.get(roomId).delete(socket.id);
                
                // If room is empty, end meeting
                if (roomParticipants.get(roomId).size === 0) {
                    roomParticipants.delete(roomId);
                    await db.endMeeting(roomId);
                    roomMeetings.delete(roomId);
                }
            }
            
            // Notify others in the room
            socket.broadcast.to(roomId).emit("user-left", { 
                socketId: socket.id, 
                name: userName 
            });
            
            // Leave the room
            socket.leave(roomId);
            
            // Clean up mappings
            const name = socketToNameMapping.get(socket.id);
            if (name) {
                nameToSocketMapping.delete(name);
            }
            socketToNameMapping.delete(socket.id);
            socketToRoomMapping.delete(socket.id);
            socketToParticipantMapping.delete(socket.id);
        } catch (error) {
            console.error("Error leaving room:", error);
        }
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
        console.log('User disconnected:', socket.id);
        
        const userName = socketToNameMapping.get(socket.id);
        const roomId = socketToRoomMapping.get(socket.id);
        
        if (roomId && userName) {
            try {
                // Update participant in database
                await db.removeParticipant(socket.id);
                
                // Remove from room participants
                if (roomParticipants.has(roomId)) {
                    roomParticipants.get(roomId).delete(socket.id);
                    
                    // If room is empty, end meeting
                    if (roomParticipants.get(roomId).size === 0) {
                        roomParticipants.delete(roomId);
                        await db.endMeeting(roomId);
                        roomMeetings.delete(roomId);
                    }
                }
                
                // Notify others in the room
                socket.broadcast.to(roomId).emit("user-left", { 
                    socketId: socket.id, 
                    name: userName 
                });
                
                console.log(`User ${userName} disconnected from room ${roomId}`);
            } catch (error) {
                console.error("Error handling disconnect:", error);
            }
        }
        
        // Clean up mappings
        if (userName) {
            nameToSocketMapping.delete(userName);
        }
        socketToNameMapping.delete(socket.id);
        socketToRoomMapping.delete(socket.id);
        socketToParticipantMapping.delete(socket.id);
    });

    // Handle ICE candidates for WebRTC
    socket.on("ice-candidate", (data) => {
        const { socketId, candidate } = data;
        socket.to(socketId).emit("ice-candidate", {
            candidate,
            from: socket.id
        });
    });
});

// API endpoints
app.get('/api/room/:roomId', async (req, res) => {
    const { roomId } = req.params;
    
    try {
        const meeting = await db.getMeeting(roomId);
        if (meeting) {
            const participants = await db.getParticipants(meeting.id);
            res.json({
                meeting,
                participants,
                participantCount: participants.length
            });
        } else {
            res.json({
                roomId,
                participantCount: 0,
                participants: []
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/room/:roomId/chat', async (req, res) => {
    const { roomId } = req.params;
    
    try {
        const meeting = await db.getMeeting(roomId);
        if (meeting) {
            const chatHistory = await db.getChatHistory(meeting.id);
            res.json(chatHistory);
        } else {
            res.json([]);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/room/:roomId/transcription', async (req, res) => {
    const { roomId } = req.params;
    
    try {
        const meeting = await db.getMeeting(roomId);
        if (meeting) {
            const transcriptions = await db.getTranscriptions(meeting.id);
            res.json(transcriptions);
        } else {
            res.json([]);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        activeRooms: roomParticipants.size,
        totalConnections: socketToNameMapping.size
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    db.close();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    db.close();
    process.exit(0);
});

server.listen(8000, () => console.log("Server running at PORT 8000 with Socket.IO"));