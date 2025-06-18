![ChatGPT Image Jun 18, 2025, 08_42_47 AM](https://github.com/user-attachments/assets/a23c2651-9996-4d21-9fcf-451432e00ff5)<p align="center">
  <img src="https://raw.githubusercontent.com/Gouravkumarpandey/Video-chat-app/main/assets/architecture.png" alt="Video Chat App Architecture" width="800"/>
</p>



# 📹 Video Chat App

A full-stack real-time video chat application powered by **React.js**, **Node.js**, **Socket.IO**, and **WebRTC**. This app allows users to create or join private rooms and initiate peer-to-peer video calls directly from their browsers.

![App Architecture]([Uploading ChatGPT Image Jun 18, 2025, 08_42_47 AM.png…]()
)

---

## 🚀 Features

* 🔗 **Peer-to-Peer Video Calling** (using WebRTC)
* 🌐 **Real-Time Signaling** via Socket.IO
* 🧠 **Context-based State Management** with React Context API
* 🧪 **Component-based Design** with React
* 📹 **Preview Local Video Feed**
* 🔐 **Private Rooms with Unique Room IDs**

---

## 🛠️ Tech Stack

### 🖥 Frontend

* React.js
* WebRTC API
* Socket.IO Client
* React Router
* Context API

### 🔧 Backend

* Node.js
* Express.js
* Socket.IO (Server)

---

## 📁 Folder Structure

```
VIDEO-CHAT-APP/
├── client/                      # React Frontend
│   ├── public/                  # Static files
│   └── src/
│       ├── components/          # UI components (optional)
│       ├── pages/              # App Pages
│       │   ├── Home.jsx         # Room join/create page
│       │   └── Room.jsx         # Video call UI
│       ├── providers/           # Contexts for Peer & Socket
│       │   ├── Peer.jsx
│       │   └── Socket.jsx
│       ├── App.js               # Main App component
│       ├── index.js             # App entry point
│       ├── App.css / index.css  # Styles
│       └── setupTests.js        # React testing boilerplate
│
├── server/                      # Node.js Backend
│   ├── index.js                 # Server + Socket.IO logic
│   ├── package.json             # Backend dependencies
│
├── README.md                    # Documentation
└── package.json                 # Root metadata
```

---

## 🖥️ Architecture Diagram

![Video Chat Architecture](./assets/architecture.png)

This architecture shows how:

* React initiates WebRTC and connects via Socket.IO.
* Socket.IO handles signaling on both frontend and backend.
* WebRTC handles peer-to-peer media streams after handshake.

---

## 📊 UML Diagrams

### Sequence Diagram

![Sequence UML](./assets/sequence-diagram.png)

### Class Diagram

![Class UML](./assets/class-diagram.png)

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Gouravkumarpandey/Video-chat-app.git
cd Video-chat-app
```

---

### 2. Start Backend Server

```bash
cd server
npm install
node index.js
```

Runs the server on **[http://localhost:5000](http://localhost:5000)**

---

### 3. Start Frontend Client

```bash
cd ../client
npm install
npm start
```

Runs the app on **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 How It Works

1. User opens Home page and creates or joins a room.
2. Socket.IO notifies backend to join a room.
3. WebRTC initiates media stream and sends signaling data via Socket.IO.
4. Once handshake is complete, direct P2P communication is established between peers.
5. Video/audio streams flow directly through WebRTC connection.

---

## 🚀 Potential Enhancements

* ✅ Add Chat Messaging (text)
* 📱 Mobile Responsive UI
* 🔐 Password Protected Rooms
* 🎥 Screen Sharing Feature
* 📂 Recording the call

---

## 🤝 Contributing

Feel free to fork this repo, create issues, or submit pull requests for improvements or features.

---

## 📝 License

MIT License – feel free to use and modify.

---

Would you like this README saved as a markdown file or want help embedding the diagrams in your GitHub repo?





