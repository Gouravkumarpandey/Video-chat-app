const express = require('express');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');

const io = new Server({
  cors: true,
});
const app = express();

app.use(bodyParser.json());

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on('connection', (socket) => {
  console.log('🔗 New Connection');

  socket.on('join-room', (data) => {
    const { roomId, emailId } = data;
    console.log("✅ User", emailId, "joined Room", roomId);

    emailToSocketMapping.set(emailId, socket.id);
    socketToEmailMapping.set(socket.id, emailId);
    socket.join(roomId);

    socket.emit('joined-room', { roomId });
    socket.broadcast.to(roomId).emit('user-joined', { emailId });
  });

  socket.on('call-user', (data) => {
    const { emailId, offer } = data;
    const fromEmail = socketToEmailMapping.get(socket.id);
    const socketId = emailToSocketMapping.get(emailId);

    console.log(`📞 Calling ${emailId} from ${fromEmail}`);

    if (socketId) {
      socket.to(socketId).emit('incomming-call', { from: fromEmail, offer });
    }
  });

  socket.on('call-accepted', (data) => {
    const { emailId, ans } = data;
    const socketId = emailToSocketMapping.get(emailId);

    console.log(`✅ Call accepted by ${emailId}`);

    if (socketId) {
      socket.to(socketId).emit('call-accepted', { ans });
    }
  });

  socket.on('send-message', ({ message }) => {
    const email = socketToEmailMapping.get(socket.id);
    const socketId = socket.id;

    // Broadcast to everyone except sender in same rooms
    const rooms = [...socket.rooms].filter((room) => room !== socket.id);
    rooms.forEach((room) => {
      socket.to(room).emit('receive-message', { message, from: email });
    });
  });

  socket.on('end-call', ({ to }) => {
    const toSocketId = emailToSocketMapping.get(to);
    if (toSocketId) {
      socket.to(toSocketId).emit('receive-end-call');
    }
  });

  socket.on('disconnect', () => {
    const email = socketToEmailMapping.get(socket.id);
    console.log(`❌ Disconnected: ${email || 'unknown user'}`);
    emailToSocketMapping.delete(email);
    socketToEmailMapping.delete(socket.id);
  });
});

app.listen(8000, () => console.log("✅ HTTP server running at PORT 8000"));
io.listen(8001, () => console.log("✅ WebSocket server running at PORT 8001"));
