# 📹 Video Chat App

A full-stack real-time video chat application built using **React.js**, **Node.js**, **WebRTC**, and **Socket.io**.
This app allows users to create or join rooms and perform peer-to-peer video calling in real-time.

## 🚀 Features

- 🔗 Peer-to-peer video calling using WebRTC
- 🌐 Real-time communication with Socket.IO
- 📹 Local video preview before call
- 📞 Auto-connect to other peers in the room
- ✅ Easy room joining and unique room creation
- 🔒 Private rooms with unique Room IDs

## 🛠️ Tech Stack

### Frontend
- React.js
- WebRTC API
- Context API (for managing sockets and peer state)
- React Router

### Backend
- Node.js
- Express.js
- Socket.io

## 📁 Project Structure

Video-chat-app/
├── client/ # React frontend
│ ├── src/
│ │ ├── components/ # Reusable UI components
│ │ ├── pages/ # HomePage, RoomPage
│ │ ├── providers/ # useSocket, usePeer hooks
│ │ └── App.js # Routes
├── server/ # Express + Socket.IO backend
│ └── index.js # Server and socket logic
├── assets/ # Diagrams or images
└── README.md




