import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../providers/Socket";
import "./Home.css";

const Home = () => {
    const { socket } = useSocket();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [roomId, setRoomId] = useState('');

    const handleRoomJoined = useCallback(({ roomId }) => {
        navigate(`/room/${roomId}`);
    }, [navigate]);

    useEffect(() => {
        if (!socket) return;
        socket.on("joined-room", handleRoomJoined);
        return () => {
            socket.off("joined-room", handleRoomJoined);
        };
    }, [socket, handleRoomJoined]);

    const handleJoinRoom = () => {
        if (email.trim() && roomId.trim()) {
            socket.emit("join-room", { emailId: email, roomId });
        }
    };

    const handleGenerateRoomId = () => {
        const id = Math.random().toString(36).substring(2, 10).toUpperCase();
        setRoomId(id);
    };

    return (
        <div className="home-container">
            <div className="form-card">
                <h2>Join Video Chat</h2>
                <p className="subtitle">Enter a room ID and your name to start</p>

                <label>Your Name</label>
                <input
                    type="text"
                    placeholder="Enter your name"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <label>Room ID</label>
                <div className="room-id-row">
                    <input
                        type="text"
                        placeholder="Enter room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                    />
                    <button onClick={handleGenerateRoomId}>Generate</button>
                </div>

                <button className="join-btn" onClick={handleJoinRoom}>Join Room</button>
            </div>
        </div>
    );
};

export default Home;
