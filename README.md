<p align="center">
  <img src="https://raw.githubusercontent.com/Gouravkumarpandey/Video-chat-app/main/assets/architecture.png" alt="Video Chat App Architecture" width="800"/>
</p>


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

VIDEO-CHAT-APP/
│
├── client/                                # React frontend
│   ├── public/                            # Static files (index.html, etc.)
│
│   └── src/                               # Application source code
│       ├── components/                    # Reusable UI components
│       │   └── (Optional files here)      # (e.g., VideoCard, Button, etc.)
│
│       ├── pages/                         # Page components
│       │   ├── Home.jsx                   # Home page (room entry UI)
│       │   └── Room.jsx                   # Video room logic and layout
│
│       ├── providers/                     # Context and WebRTC/socket logic
│       │   ├── Peer.jsx                   # Peer connection (WebRTC)
│       │   └── Socket.jsx                 # Socket.IO setup and events
│
│       ├── App.css                        # Global styles
│       ├── App.js                         # Main React app with routes
│       ├── App.test.js                    # React test boilerplate
│       ├── index.css                      # Base styles
│       ├── index.js                       # React DOM render entry
│       ├── logo.svg                       # React logo (can remove)
│       ├── reportWebVitals.js             # Performance metrics
│       └── setupTests.js                  # Testing setup file
│
│   ├── .gitignore                         # Files to ignore in Git
│   ├── package-lock.json                  # Dependency lockfile
│   ├── package.json                       # Frontend project metadata
│   └── README.md                          # Project documentation
│
├── server/                                # Node.js + Socket.IO backend
│   ├── node_modules/                      # Server dependencies
│   ├── index.js                           # Express server with Socket.IO logic
│   ├── package-lock.json                  # Backend lockfile
│   ├── package.json                       # Backend metadata
│   └── README.md                          # (Optional) Backend-specific docs

### 📦 Install Dependencies





