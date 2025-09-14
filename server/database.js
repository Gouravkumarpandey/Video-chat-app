const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

class Database {
    constructor() {
        this.db = new sqlite3.Database('./meetings.db', (err) => {
            if (err) {
                console.error('Error opening database:', err);
            } else {
                console.log('Connected to SQLite database');
                this.initTables();
            }
        });
    }

    initTables() {
        // Users table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firstName TEXT NOT NULL,
                lastName TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Meetings table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS meetings (
                id TEXT PRIMARY KEY,
                room_id TEXT UNIQUE NOT NULL,
                title TEXT,
                host_name TEXT NOT NULL,
                host_socket_id TEXT,
                host_user_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                ended_at DATETIME,
                is_webinar BOOLEAN DEFAULT 0,
                max_participants INTEGER DEFAULT 100,
                require_approval BOOLEAN DEFAULT 0,
                record_meeting BOOLEAN DEFAULT 0,
                FOREIGN KEY (host_user_id) REFERENCES users (id)
            )
        `);

        // Participants table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS participants (
                id TEXT PRIMARY KEY,
                meeting_id TEXT,
                user_id INTEGER,
                name TEXT NOT NULL,
                socket_id TEXT,
                role TEXT DEFAULT 'participant', -- host, co-host, participant, moderator
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                left_at DATETIME,
                is_muted BOOLEAN DEFAULT 0,
                is_video_off BOOLEAN DEFAULT 0,
                FOREIGN KEY (meeting_id) REFERENCES meetings (id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);

        // Chat messages table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id TEXT PRIMARY KEY,
                meeting_id TEXT,
                participant_id TEXT,
                message TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                message_type TEXT DEFAULT 'text', -- text, file, system
                is_private BOOLEAN DEFAULT 0,
                recipient_id TEXT,
                FOREIGN KEY (meeting_id) REFERENCES meetings (id),
                FOREIGN KEY (participant_id) REFERENCES participants (id)
            )
        `);

        // Breakout rooms table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS breakout_rooms (
                id TEXT PRIMARY KEY,
                meeting_id TEXT,
                room_name TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (meeting_id) REFERENCES meetings (id)
            )
        `);

        // Breakout assignments table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS breakout_assignments (
                id TEXT PRIMARY KEY,
                breakout_room_id TEXT,
                participant_id TEXT,
                assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (breakout_room_id) REFERENCES breakout_rooms (id),
                FOREIGN KEY (participant_id) REFERENCES participants (id)
            )
        `);

        // Transcriptions table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS transcriptions (
                id TEXT PRIMARY KEY,
                meeting_id TEXT,
                participant_name TEXT,
                text TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                confidence REAL,
                FOREIGN KEY (meeting_id) REFERENCES meetings (id)
            )
        `);

        // Waiting room table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS waiting_room (
                id TEXT PRIMARY KEY,
                meeting_id TEXT,
                name TEXT NOT NULL,
                socket_id TEXT,
                requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'waiting', -- waiting, approved, denied
                FOREIGN KEY (meeting_id) REFERENCES meetings (id)
            )
        `);

        // Password reset tokens table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                token TEXT UNIQUE NOT NULL,
                expires_at DATETIME NOT NULL,
                used BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);

        // OTP verification table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS otp_verifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                otp_code TEXT NOT NULL,
                purpose TEXT NOT NULL, -- 'email_verification', 'login_verification', 'password_reset'
                expires_at DATETIME NOT NULL,
                verified BOOLEAN DEFAULT 0,
                attempts INTEGER DEFAULT 0,
                max_attempts INTEGER DEFAULT 3,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    // Meeting methods
    createMeeting(roomId, hostName, hostSocketId, options = {}) {
        return new Promise((resolve, reject) => {
            const meetingId = uuidv4();
            const {
                title = `Meeting ${roomId}`,
                isWebinar = false,
                maxParticipants = 100,
                requireApproval = false,
                recordMeeting = false
            } = options;

            this.db.run(`
                INSERT INTO meetings (id, room_id, title, host_name, host_socket_id, is_webinar, max_participants, require_approval, record_meeting)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [meetingId, roomId, title, hostName, hostSocketId, isWebinar, maxParticipants, requireApproval, recordMeeting], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ meetingId, roomId });
                }
            });
        });
    }

    getMeeting(roomId) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT * FROM meetings WHERE room_id = ? AND ended_at IS NULL
            `, [roomId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    endMeeting(roomId) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE meetings SET ended_at = CURRENT_TIMESTAMP WHERE room_id = ?
            `, [roomId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    // Participant methods
    addParticipant(meetingId, name, socketId, role = 'participant') {
        return new Promise((resolve, reject) => {
            const participantId = uuidv4();
            this.db.run(`
                INSERT INTO participants (id, meeting_id, name, socket_id, role)
                VALUES (?, ?, ?, ?, ?)
            `, [participantId, meetingId, name, socketId, role], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ participantId, meetingId, name, socketId, role });
                }
            });
        });
    }

    updateParticipantRole(participantId, role) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE participants SET role = ? WHERE id = ?
            `, [role, participantId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    getParticipants(meetingId) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT * FROM participants WHERE meeting_id = ? AND left_at IS NULL
            `, [meetingId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    removeParticipant(socketId) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE participants SET left_at = CURRENT_TIMESTAMP WHERE socket_id = ?
            `, [socketId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    // Chat methods
    saveChatMessage(meetingId, participantId, message, messageType = 'text', isPrivate = false, recipientId = null) {
        return new Promise((resolve, reject) => {
            const messageId = uuidv4();
            this.db.run(`
                INSERT INTO chat_messages (id, meeting_id, participant_id, message, message_type, is_private, recipient_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [messageId, meetingId, participantId, message, messageType, isPrivate, recipientId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ messageId, meetingId, participantId, message, messageType, isPrivate, recipientId });
                }
            });
        });
    }

    getChatHistory(meetingId) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT cm.*, p.name as sender_name 
                FROM chat_messages cm
                JOIN participants p ON cm.participant_id = p.id
                WHERE cm.meeting_id = ? AND cm.is_private = 0
                ORDER BY cm.timestamp ASC
            `, [meetingId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Transcription methods
    saveTranscription(meetingId, participantName, text, confidence = 0.9) {
        return new Promise((resolve, reject) => {
            const transcriptionId = uuidv4();
            this.db.run(`
                INSERT INTO transcriptions (id, meeting_id, participant_name, text, confidence)
                VALUES (?, ?, ?, ?, ?)
            `, [transcriptionId, meetingId, participantName, text, confidence], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ transcriptionId, meetingId, participantName, text, confidence });
                }
            });
        });
    }

    getTranscriptions(meetingId) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT * FROM transcriptions WHERE meeting_id = ? ORDER BY timestamp ASC
            `, [meetingId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Waiting room methods
    addToWaitingRoom(meetingId, name, socketId) {
        return new Promise((resolve, reject) => {
            const waitingId = uuidv4();
            this.db.run(`
                INSERT INTO waiting_room (id, meeting_id, name, socket_id)
                VALUES (?, ?, ?, ?)
            `, [waitingId, meetingId, name, socketId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ waitingId, meetingId, name, socketId });
                }
            });
        });
    }

    updateWaitingRoomStatus(waitingId, status) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE waiting_room SET status = ? WHERE id = ?
            `, [status, waitingId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    getWaitingRoom(meetingId) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT * FROM waiting_room WHERE meeting_id = ? AND status = 'waiting'
            `, [meetingId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // User Management Methods
    createUser(userData) {
        return new Promise((resolve, reject) => {
            const { firstName, lastName, email, password } = userData;
            this.db.run(`
                INSERT INTO users (firstName, lastName, email, password) 
                VALUES (?, ?, ?, ?)
            `, [firstName, lastName, email, password], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    getUserByEmail(email) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT * FROM users WHERE email = ?
            `, [email], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    getUserById(id) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT * FROM users WHERE id = ?
            `, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    updateUser(id, userData) {
        return new Promise((resolve, reject) => {
            const { firstName, lastName, email } = userData;
            this.db.run(`
                UPDATE users 
                SET firstName = ?, lastName = ?, email = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `, [firstName, lastName, email, id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    deleteUser(id) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                DELETE FROM users WHERE id = ?
            `, [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    // Password reset methods
    createPasswordResetToken(userId, token, expiresAt) {
        return new Promise((resolve, reject) => {
            const tokenId = uuidv4();
            this.db.run(`
                INSERT INTO password_reset_tokens (id, user_id, token, expires_at) 
                VALUES (?, ?, ?, ?)
            `, [tokenId, userId, token, expiresAt], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(tokenId);
                }
            });
        });
    }

    getPasswordResetToken(token) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT prt.*, u.email 
                FROM password_reset_tokens prt
                JOIN users u ON prt.user_id = u.id
                WHERE prt.token = ? AND prt.used = 0 AND prt.expires_at > datetime('now')
            `, [token], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    markPasswordResetTokenAsUsed(token) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE password_reset_tokens 
                SET used = 1 
                WHERE token = ?
            `, [token], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    updateUserPassword(userId, newPassword) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE users 
                SET password = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `, [newPassword, userId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    // OTP Methods
    createOTP(email, otpCode, purpose, expiresAt) {
        return new Promise((resolve, reject) => {
            // First, cleanup any expired OTPs for this email and purpose
            this.db.run(`
                DELETE FROM otp_verifications 
                WHERE email = ? AND purpose = ? AND (expires_at < CURRENT_TIMESTAMP OR verified = 1)
            `, [email, purpose], (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Create new OTP
                this.db.run(`
                    INSERT INTO otp_verifications (email, otp_code, purpose, expires_at)
                    VALUES (?, ?, ?, ?)
                `, [email, otpCode, purpose, expiresAt], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this.lastID);
                    }
                });
            });
        });
    }

    getOTP(email, purpose) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT * FROM otp_verifications 
                WHERE email = ? AND purpose = ? AND verified = 0 AND expires_at > CURRENT_TIMESTAMP
                ORDER BY created_at DESC
                LIMIT 1
            `, [email, purpose], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    verifyOTP(email, otpCode, purpose) {
        return new Promise((resolve, reject) => {
            // First get the OTP record
            this.db.get(`
                SELECT * FROM otp_verifications 
                WHERE email = ? AND purpose = ? AND otp_code = ? AND verified = 0 AND expires_at > CURRENT_TIMESTAMP
            `, [email, purpose, otpCode], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!row) {
                    resolve({ success: false, message: 'Invalid or expired OTP' });
                    return;
                }

                if (row.attempts >= row.max_attempts) {
                    resolve({ success: false, message: 'Maximum attempts exceeded' });
                    return;
                }

                // Mark as verified
                this.db.run(`
                    UPDATE otp_verifications 
                    SET verified = 1, attempts = attempts + 1
                    WHERE id = ?
                `, [row.id], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ success: true, message: 'OTP verified successfully' });
                    }
                });
            });
        });
    }

    incrementOTPAttempts(email, purpose) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE otp_verifications 
                SET attempts = attempts + 1
                WHERE email = ? AND purpose = ? AND verified = 0 AND expires_at > CURRENT_TIMESTAMP
            `, [email, purpose], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    cleanupExpiredOTPs() {
        return new Promise((resolve, reject) => {
            this.db.run(`
                DELETE FROM otp_verifications 
                WHERE expires_at < CURRENT_TIMESTAMP OR verified = 1
            `, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Error closing database:', err);
            } else {
                console.log('Database connection closed');
            }
        });
    }
}

module.exports = Database;