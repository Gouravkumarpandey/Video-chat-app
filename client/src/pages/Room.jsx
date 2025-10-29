import React, { useEffect, useCallback, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';
import { useSocket } from "../providers/Socket";
import { usePeer } from "../providers/Peer";
import { useAuth } from "../contexts/AuthContext";
import { Video, VideoOff, Mic, MicOff, MessageSquare, PhoneOff, Send, Users } from "lucide-react";

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { socket } = useSocket();
    const { peer, createOffer, createAnswer, setRemoteAns, sendStream, remoteStream } = usePeer();
    const { user } = useAuth();
        const [isVideoEnabled, setIsVideoEnabled] = useState(false);
        const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const [showChat, setShowChat] = useState(false);
    const [userName, setUserName] = useState(user?.name || "Anonymous");
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const chatEndRef = useRef(null);

    // Get user media
    const getUserMediaStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            sendStream(stream);
        } catch (err) {
            toast.error('Unable to access camera/microphone');
        }
    }, [sendStream]);

    // Join room and setup listeners
    useEffect(() => {
        getUserMediaStream();
        if (socket && roomId) {
            socket.emit('join-room', { name: userName, roomId });
        }
    }, [getUserMediaStream, socket, roomId, userName]);

    useEffect(() => {
        if (!socket) return;
        const onUserJoined = ({ name, socketId }) => {
            setParticipants(prev => [...prev, { name, socketId }]);
            toast(`${name} joined`, { icon: '👋' });
        };
        const onUserLeft = ({ socketId, name }) => {
            setParticipants(prev => prev.filter(p => p.socketId !== socketId));
            toast(`${name} left`, { icon: '👋' });
        };
        const onChat = (data) => setMessages(prev => [...prev, { ...data, isOwn: false }] );
        socket.on('user-joined', onUserJoined);
        socket.on('user-left', onUserLeft);
        socket.on('chat-message', onChat);
        return () => {
            socket.off('user-joined', onUserJoined);
            socket.off('user-left', onUserLeft);
            socket.off('chat-message', onChat);
        };
    }, [socket]);

    useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    // Controls
    const toggleAudio = () => {
        if (!localStream) return;
        const t = localStream.getAudioTracks()[0];
        if (t) { t.enabled = !t.enabled; setIsAudioEnabled(t.enabled); }
    };
    const toggleVideo = () => {
        if (!localStream) return;
        const t = localStream.getVideoTracks()[0];
        if (t) { t.enabled = !t.enabled; setIsVideoEnabled(t.enabled); }
    };
    const sendMessage = () => {
        if (!inputMessage.trim()) return;
        const msg = { message: inputMessage.trim(), from: userName, timestamp: new Date().toISOString() };
        socket.emit('chat-message', { roomId, ...msg });
        setMessages(prev => [...prev, { ...msg, isOwn: true }]);
        setInputMessage('');
    };
    const leave = () => {
        if (localStream) localStream.getTracks().forEach(t => t.stop());
        if (socket) socket.emit('leave-room', { roomId });
        navigate('/');
    };

    // UI
    return (
        <div className="h-screen bg-gray-900 flex flex-col">
            <Toaster position="top-right" />
            <header className="bg-gray-800 px-4 py-3 flex items-center justify-between">
                <div className="text-white">
                    <span className="font-medium">Room: {roomId}</span>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="text-white text-sm">
                        <Users size={16} className="inline mr-1" />
                        {participants.length + 1} participants
                    </span>
                </div>
            </header>
            <div className="flex-1 flex">
                <div className="flex-1 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                        <div className="bg-gray-800 rounded overflow-hidden">
                            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">{userName} (You)</div>
                        </div>
                        <div className="bg-gray-800 rounded overflow-hidden">
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            {participants.length > 0 && (
                                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">{participants[0]?.name}</div>
                            )}
                        </div>
                    </div>
                </div>
                {showChat && (
                    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
                        <div className="p-4 border-b border-gray-700">
                            <h3 className="text-white font-medium">Chat</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.map((msg, index) => (
                                <div key={index} className={`${msg.isOwn ? 'text-right' : 'text-left'}`}> 
                                    <div className={`inline-block max-w-xs px-3 py-2 rounded-lg text-sm ${msg.isOwn ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                        {!msg.isOwn && (<div className="font-medium text-xs mb-1 opacity-75">{msg.from}</div>)}
                                        <div>{msg.message}</div>
                                        <div className="text-xs opacity-75 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-4 border-t border-gray-700">
                            <div className="flex space-x-2">
                                <input value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Send a message..." className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                <button onClick={sendMessage} disabled={!inputMessage.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center"><Send size={16} /></button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">
                <button onClick={toggleAudio} className="p-3 rounded-full bg-gray-700 text-white">{isAudioEnabled ? <Mic /> : <MicOff />}</button>
                <button onClick={toggleVideo} className="p-3 rounded-full bg-gray-700 text-white">{isVideoEnabled ? <Video /> : <VideoOff />}</button>
                <button onClick={() => setShowChat(s => !s)} className="p-3 rounded-full bg-gray-700 text-white"><MessageSquare /></button>
                <button onClick={leave} className="p-3 rounded-full bg-red-600 text-white"><PhoneOff /></button>
            </div>
        </div>
    );
};

export default Room;

const Room = () => {
    const [localStream, setLocalStream] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const [showChat, setShowChat] = useState(false);
    const [userName, setUserName] = useState(user?.name || "Anonymous");
    const [isHost, setIsHost] = useState(false);
    const [isCoHost, setIsCoHost] = useState(false);
    const [waitingParticipants, setWaitingParticipants] = useState([]);
    const [showParticipants, setShowParticipants] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const chatEndRef = useRef(null);

    // Get user media
    const getUserMediaStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            sendStream(stream);
        } catch (err) {
            toast.error('Unable to access camera/microphone');
        }
    }, [sendStream]);

    // Join room and setup listeners
    useEffect(() => {
        getUserMediaStream();
        if (socket && roomId) {
            socket.emit('join-room', { name: userName, roomId });
        }
    }, [getUserMediaStream, socket, roomId, userName]);

    useEffect(() => {
        if (!socket) return;
        const onUserJoined = ({ name, socketId, role }) => {
            setParticipants(prev => [...prev, { name, socketId, role }]);
            toast(`${name} joined`, { icon: '👋' });
        };
        const onUserLeft = ({ socketId, name }) => {
            setParticipants(prev => prev.filter(p => p.socketId !== socketId));
            toast(`${name} left`, { icon: '👋' });
        };
        const onChat = (data) => setMessages(prev => [...prev, { ...data, isOwn: false }] );
        socket.on('user-joined', onUserJoined);
        socket.on('user-left', onUserLeft);
        socket.on('chat-message', onChat);
        return () => {
            socket.off('user-joined', onUserJoined);
            socket.off('user-left', onUserLeft);
            socket.off('chat-message', onChat);
        };
    }, [socket]);

    useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    // Controls
    const toggleAudio = () => {
        if (!localStream) return;
        const t = localStream.getAudioTracks()[0];
        if (t) { t.enabled = !t.enabled; setIsAudioEnabled(t.enabled); }
    };
    const toggleVideo = () => {
        if (!localStream) return;
        const t = localStream.getVideoTracks()[0];
        if (t) { t.enabled = !t.enabled; setIsVideoEnabled(t.enabled); }
    };
    const sendMessage = () => {
        if (!inputMessage.trim()) return;
        const msg = { message: inputMessage.trim(), from: userName, timestamp: new Date().toISOString() };
        socket.emit('chat-message', { roomId, ...msg });
        setMessages(prev => [...prev, { ...msg, isOwn: true }]);
        setInputMessage('');
    };
    const leave = () => {
        if (localStream) localStream.getTracks().forEach(t => t.stop());
        if (socket) socket.emit('leave-room', { roomId });
        navigate('/');
    };

    // Placeholder for advanced features
    const muteParticipant = (id) => toast('Mute participant: ' + id);
    const removeParticipant = (id) => toast('Remove participant: ' + id);
    const promoteToCoHost = (id) => toast('Promote to co-host: ' + id);
    const startScreenShare = () => setIsScreenSharing(true);
    const startRecording = () => setIsRecording(true);
    const stopRecording = () => setIsRecording(false);
    const handleApproveParticipant = (participant) => toast('Approve: ' + participant.name);

    // UI
    return (
        <div className="h-screen bg-gray-900 flex flex-col">
            <Toaster position="top-right" />
            <header className="bg-gray-800 px-4 py-3 flex items-center justify-between">
                <div className="text-white">
                    <span className="font-medium">Room: {roomId}</span>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="text-white text-sm">
                        <Users size={16} className="inline mr-1" />
                        {participants.length + 1} participants
                    </span>
                </div>
            </header>
            <div className="flex-1 flex">
                <div className="flex-1 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                        <div className="bg-gray-800 rounded overflow-hidden">
                            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">{userName} (You)</div>
                        </div>
                        <div className="bg-gray-800 rounded overflow-hidden">
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            {participants.length > 0 && (
                                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">{participants[0]?.name}</div>
                            )}
                        </div>
                    </div>
                </div>
                {showChat && (
                    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
                        <div className="p-4 border-b border-gray-700">
                            <h3 className="text-white font-medium">Chat</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.map((msg, index) => (
                                <div key={index} className={`${msg.isOwn ? 'text-right' : 'text-left'}`}> 
                                    <div className={`inline-block max-w-xs px-3 py-2 rounded-lg text-sm ${msg.isOwn ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                        {!msg.isOwn && (<div className="font-medium text-xs mb-1 opacity-75">{msg.from}</div>)}
                                        <div>{msg.message}</div>
                                        <div className="text-xs opacity-75 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-4 border-t border-gray-700">
                            <div className="flex space-x-2">
                                <input value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Send a message..." className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                <button onClick={sendMessage} disabled={!inputMessage.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center"><Send size={16} /></button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">
                <button onClick={toggleAudio} className="p-3 rounded-full bg-gray-700 text-white">{isAudioEnabled ? <Mic /> : <MicOff />}</button>
                <button onClick={toggleVideo} className="p-3 rounded-full bg-gray-700 text-white">{isVideoEnabled ? <Video /> : <VideoOff />}</button>
                <button onClick={() => setShowChat(s => !s)} className="p-3 rounded-full bg-gray-700 text-white"><MessageSquare /></button>
                <button onClick={leave} className="p-3 rounded-full bg-red-600 text-white"><PhoneOff /></button>
            </div>
        </div>
    );
};

export default Room;
import React, { useEffect, useCallback, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';
import { useSocket } from "../providers/Socket";
import { usePeer } from "../providers/Peer";
import { useAuth } from "../contexts/AuthContext";
import { Video, VideoOff, Mic, MicOff, MessageSquare, PhoneOff, Send, Users } from "lucide-react";

    const { roomId } = useParams();
    const navigate = useNavigate();
    const { socket } = useSocket();
    const { peer, createOffer, createAnswer, setRemoteAns, sendStream, remoteStream } = usePeer();
    const { user } = useAuth();

    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [localStream, setLocalStream] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const [showChat, setShowChat] = useState(false);
    const [userName, setUserName] = useState('');

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const chatEndRef = useRef(null);

    const getUserMediaStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            return stream;
        } catch (err) {
            console.error('Failed to get media', err);
            toast.error('Unable to access camera/microphone');
        }
    }, []);

    useEffect(() => {
        const name = user?.name || 'Anonymous';
        setUserName(name);
        getUserMediaStream().then(stream => { if (stream) sendStream(stream); });
        if (socket && roomId) socket.emit('join-room', { name, roomId });
    }, [getUserMediaStream, sendStream, socket, roomId, user]);

    useEffect(() => {
        if (!socket) return;
        const onUserJoined = ({ name, socketId }) => {
            setParticipants(prev => [...prev, { name, socketId }]);
            toast(`${name} joined`);
        };

        const onUserLeft = ({ socketId, name }) => {
            setParticipants(prev => prev.filter(p => p.socketId !== socketId));
            toast(`${name} left`);
        };

        const onChat = (data) => setMessages(prev => [...prev, { ...data, isOwn: false }]);

        socket.on('user-joined', onUserJoined);
        socket.on('user-left', onUserLeft);
        socket.on('chat-message', onChat);

        return () => {
            socket.off('user-joined', onUserJoined);
            socket.off('user-left', onUserLeft);
            socket.off('chat-message', onChat);
        };
    }, [socket]);

    useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const toggleAudio = () => {
        if (!localStream) return;
        const t = localStream.getAudioTracks()[0];
        if (t) { t.enabled = !t.enabled; setIsAudioEnabled(t.enabled); }
    };

    const toggleVideo = () => {
        if (!localStream) return;
        const t = localStream.getVideoTracks()[0];
        if (t) { t.enabled = !t.enabled; setIsVideoEnabled(t.enabled); }
    };

    const sendMessage = () => {
        if (!inputMessage.trim()) return;
        const msg = { message: inputMessage.trim(), from: userName, timestamp: new Date().toISOString() };
        socket.emit('chat-message', { roomId, ...msg });
        setMessages(prev => [...prev, { ...msg, isOwn: true }]);
        setInputMessage('');
    };

    const leave = () => {
        if (localStream) localStream.getTracks().forEach(t => t.stop());
        if (socket) socket.emit('leave-room', { roomId });
        navigate('/');
    };

    return (
        <div className="h-screen bg-gray-900 flex flex-col">
            <Toaster position="top-right" />
            <header className="bg-gray-800 px-4 py-3 flex items-center justify-between">
                <div className="text-white">Room: {roomId}</div>
                <div className="text-white">{participants.length + 1} participants</div>
            </header>
            <div className="flex-1 flex">
                <div className="flex-1 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                        <div className="bg-gray-800 rounded overflow-hidden">
                            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

                    import React, { useEffect, useCallback, useState, useRef } from "react";
                    import { useParams, useNavigate } from "react-router-dom";
                    import toast, { Toaster } from 'react-hot-toast';
                    import { useSocket } from "../providers/Socket";
                    import { usePeer } from "../providers/Peer";
                    import { useAuth } from "../contexts/AuthContext";
                    import { Video, VideoOff, Mic, MicOff, MessageSquare, PhoneOff, Send, Users, MonitorSpeaker, Crown, Shield } from "lucide-react";
                        <div className="p-3 border-t border-gray-700 flex space-x-2">
                            <input value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} className="flex-1 bg-gray-700 text-white px-3 py-2 rounded" />
                            <button onClick={sendMessage} className="bg-blue-600 px-3 py-2 rounded text-white">Send</button>
                        </div>
                    </div>
                )}
            </div>
            <div className="bg-gray-800 p-3 flex items-center justify-center space-x-4">
                <button onClick={toggleAudio} className="p-3 rounded bg-gray-700 text-white">{isAudioEnabled ? <Mic /> : <MicOff />}</button>
                <button onClick={toggleVideo} className="p-3 rounded bg-gray-700 text-white">{isVideoEnabled ? <Video /> : <VideoOff />}</button>
                <button onClick={() => setShowChat(s => !s)} className="p-3 rounded bg-gray-700 text-white"><MessageSquare /></button>
                <button onClick={leave} className="p-3 rounded bg-red-600 text-white"><PhoneOff /></button>
            </div>
        </div>
    );
};

export default Room;
import React, { useEffect, useCallback, useState, useRef } from "react";import React, { useEffect, useCallback, useState, useRef } from "react";import React, { useEffect, useCallback, useState, useRef } from "react";

import { useParams, useNavigate } from "react-router-dom";

import toast, { Toaster } from 'react-hot-toast';import { useParams, useNavigate } from "react-router-dom";import { useParams, useNavigate } from "react-router-dom";

import { useSocket } from "../providers/Socket";

import { usePeer } from "../providers/Peer";import { motion, AnimatePresence } from "framer-motion";import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "../contexts/AuthContext";


    Video, 

    VideoOff, import { useSocket } from "../providers/Socket";import { useSocket } from "../providers/Socket";

    Mic, 

    MicOff, import { usePeer } from "../providers/Peer";import { usePeer } from "../providers/Peer";

    MessageSquare, 

    PhoneOff,import { useAuth } from "../contexts/AuthContext";import { useAuth } from "../contexts/AuthContext";

    Send,


} from "lucide-react";

    Video, import { 

const Room = () => {

    const { roomId } = useParams();    VideoOff,     Video, 

    const navigate = useNavigate();

    const { socket } = useSocket();    Mic,     VideoOff, 

    const { peer, createOffer, createAnswer, setRemoteAns, sendStream, remoteStream } = usePeer();

    const { user } = useAuth();    MicOff,     Mic, 



    // States    MonitorSpeaker,    MicOff, 

    const [isVideoEnabled, setIsVideoEnabled] = useState(true);

    const [isAudioEnabled, setIsAudioEnabled] = useState(true);    MessageSquare,     MonitorSpeaker,

    const [localStream, setLocalStream] = useState(null);

    const [participants, setParticipants] = useState([]);    PhoneOff,    MessageSquare, 

    const [messages, setMessages] = useState([]);

    const [inputMessage, setInputMessage] = useState("");    Send,    PhoneOff,

    const [showChat, setShowChat] = useState(false);

    const [userName, setUserName] = useState('');    Users,    Send,



    // Refs    Crown,    Users,

    const localVideoRef = useRef(null);

    const remoteVideoRef = useRef(null);    Shield,    Crown,

    const chatEndRef = useRef(null);

    Link    Shield,

    // Get user media stream

    const getUserMediaStream = useCallback(async () => {} from "lucide-react";    Link

        try {

            const stream = await navigator.mediaDevices.getUserMedia({} from "lucide-react";

                video: true,

                audio: trueconst Room = () => {

            });

            setLocalStream(stream);    const { roomId } = useParams();const Room = () => {

            if (localVideoRef.current) {

                localVideoRef.current.srcObject = stream;    const navigate = useNavigate();    const { roomId } = useParams();

            }

            return stream;    const { socket } = useSocket();    const navigate = useNavigate();

        } catch (error) {

            console.error("Error accessing media devices:", error);    const { peer, createOffer, createAnswer, setRemoteAns, sendStream, remoteStream } = usePeer();    const { socket } = useSocket();

            toast.error("Failed to access camera/microphone");

        }    const { user } = useAuth();    const { peer, createOffer, createAnswer, setRemoteAns, sendStream, remoteStream } = usePeer();

    }, []);

    const { user } = useAuth();

    // Socket event handlers

    const handleNewUserJoined = useCallback(async ({ name, socketId }) => {    // Core states

        console.log("User joined:", name);

        setParticipants(prev => [...prev, { name, socketId }]);    const [isVideoEnabled, setIsVideoEnabled] = useState(true);    // Core states

        

        const offer = await createOffer();    const [isAudioEnabled, setIsAudioEnabled] = useState(true);    const [isVideoEnabled, setIsVideoEnabled] = useState(true);

        socket.emit("call-user", { socketId, offer });

            const [localStream, setLocalStream] = useState(null);    const [isAudioEnabled, setIsAudioEnabled] = useState(true);

        toast(`${name} joined the meeting`);

    }, [createOffer, socket]);    const [participants, setParticipants] = useState([]);    const [myStream, setMyStream] = useState(null);



    const handleIncomingCall = useCallback(async ({ from, offer, fromName }) => {    const [messages, setMessages] = useState([]);    const [isChatOpen, setIsChatOpen] = useState(false);

        console.log("Incoming call from:", fromName);

        const answer = await createAnswer(offer);    const [inputMessage, setInputMessage] = useState("");    const [participants, setParticipants] = useState([]);

        socket.emit("call-accepted", { socketId: from, ans: answer });

    }, [createAnswer, socket]);    const [showChat, setShowChat] = useState(false);    const [messages, setMessages] = useState([]);



    const handleCallAccepted = useCallback(async ({ ans }) => {    const [userName, setUserName] = useState('');    const [waitingParticipants, setWaitingParticipants] = useState([]);

        await setRemoteAns(ans);

    }, [setRemoteAns]);    const [userRole, setUserRole] = useState('participant');    const [inputMessage, setInputMessage] = useState("");



    const handleUserLeft = useCallback(({ socketId, name }) => {    const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);    const [isAudioMuted, setIsAudioMuted] = useState(false);

        console.log("User left:", name);

        setParticipants(prev => prev.filter(p => p.socketId !== socketId));    const [isVideoOff, setIsVideoOff] = useState(false);

        toast(`${name} left the meeting`);

    }, []);    // Refs    const [localStream, setLocalStream] = useState(null);



    const handleMessageReceived = useCallback(({ message, from, timestamp }) => {    const localVideoRef = useRef(null);    const [isScreenSharing, setIsScreenSharing] = useState(false);

        setMessages(prev => [...prev, { message, from, timestamp, isOwn: false }]);

    }, []);    const remoteVideoRef = useRef(null);



    // Control handlers    const chatEndRef = useRef(null);    const [remoteStreams, setRemoteStreams] = useState({});

    const toggleAudio = () => {

        if (localStream) {    const [isRecording, setIsRecording] = useState(false);

            const audioTrack = localStream.getAudioTracks()[0];

            if (audioTrack) {    // Helper functions    const [userName, setUserName] = useState('');

                audioTrack.enabled = !audioTrack.enabled;

                setIsAudioEnabled(audioTrack.enabled);    const isHost = userRole === 'host';    const [userRole, setUserRole] = useState('participant');

            }

        }    const isCoHost = userRole === 'co-host';    const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);

    };

    const [showChat, setShowChat] = useState(false);

    const toggleVideo = () => {

        if (localStream) {    // Get user media stream    const [showParticipants, setShowParticipants] = useState(false);

            const videoTrack = localStream.getVideoTracks()[0];

            if (videoTrack) {    const getUserMediaStream = useCallback(async () => {    const [newMessage, setNewMessage] = useState('');

                videoTrack.enabled = !videoTrack.enabled;

                setIsVideoEnabled(videoTrack.enabled);        try {

            }

        }            const stream = await navigator.mediaDevices.getUserMedia({    const localVideoRef = useRef(null);

    };

                video: true,    const chatEndRef = useRef(null);

    const sendMessage = () => {

        if (inputMessage.trim()) {                audio: true    const remoteVideoRef = useRef(null);

            const message = {

                message: inputMessage.trim(),            });

                from: userName,

                timestamp: new Date().toISOString()            setLocalStream(stream);    // Helper variables

            };

                        if (localVideoRef.current) {    const isHost = userRole === 'host';

            socket.emit("chat-message", { roomId, ...message });

            setMessages(prev => [...prev, { ...message, isOwn: true }]);                localVideoRef.current.srcObject = stream;    const isCoHost = userRole === 'co-host';

            setInputMessage('');

        }            }

    };

            return stream;    // Get user media stream

    const leaveCall = () => {

        if (localStream) {        } catch (error) {    const getUserMediaStream = useCallback(async () => {

            localStream.getTracks().forEach(track => track.stop());

        }            console.error("Error accessing media devices:", error);        try {

        socket.emit("leave-room", { roomId });

        navigate('/home');            toast.error("Failed to access camera/microphone");            const stream = await navigator.mediaDevices.getUserMedia({

    };

        }                video: true,

    // Effects

    useEffect(() => {    }, []);                audio: true

        const name = user?.name || 'Anonymous User';

        setUserName(name);            });

        

        getUserMediaStream().then(stream => {    // Socket event handlers            setLocalStream(stream);

            if (stream) {

                sendStream(stream);    const handleJoinedRoom = useCallback(({ roomId, role, isHost: hostStatus, meeting: meetingData, chatHistory }) => {            if (localVideoRef.current) {

            }

        });        setUserRole(role);                localVideoRef.current.srcObject = stream;



        if (socket && roomId && name) {        setMessages(chatHistory || []);            }

            socket.emit("join-room", { name, roomId });

        }        toast.success('Successfully joined the meeting');            return stream;

    }, [getUserMediaStream, sendStream, socket, roomId, user]);

                } catch (error) {

    useEffect(() => {

        if (!socket) return;        if (hostStatus) {            console.error('Error accessing media devices:', error);



        socket.on("user-joined", handleNewUserJoined);            toast.success('You are the meeting host');            toast.error("Failed to access camera/microphone");

        socket.on("incomming-call", handleIncomingCall);

        socket.on("call-accepted", handleCallAccepted);        }        }

        socket.on("user-left", handleUserLeft);

        socket.on("chat-message", handleMessageReceived);    }, []);    }, []);



        return () => {

            socket.off("user-joined", handleNewUserJoined);

            socket.off("incomming-call", handleIncomingCall);    const handleNewUserJoined = useCallback(async ({ name, socketId, role }) => {    // Socket event handlers

            socket.off("call-accepted", handleCallAccepted);

            socket.off("user-left", handleUserLeft);        console.log("👤 New user joined:", name);    const handleJoinedRoom = useCallback(({ roomId, role, isHost: hostStatus, meeting: meetingData, chatHistory }) => {

            socket.off("chat-message", handleMessageReceived);

        };        setParticipants(prev => [...prev, {         setUserRole(role);

    }, [socket, handleNewUserJoined, handleIncomingCall, handleCallAccepted, handleUserLeft, handleMessageReceived]);

            name,         setMessages(chatHistory || []);

    useEffect(() => {

        if (remoteStream && remoteVideoRef.current) {            socketId,         toast.success('Successfully joined the meeting');

            remoteVideoRef.current.srcObject = remoteStream;

        }            role,        

    }, [remoteStream]);

            isAudioMuted: false,        if (hostStatus) {

    return (

        <div className="h-screen bg-gray-900 flex flex-col">            isVideoOff: false,            toast.success('You are the meeting host');

            <Toaster position="top-right" />

            isConnected: true,        }

            {/* Header */}

            <header className="bg-gray-800 px-4 py-3 flex items-center justify-between">            isSpeaking: false    }, []);

                <div className="text-white">

                    <span className="font-medium">Room: {roomId}</span>        }]);

                </div>

                <div className="flex items-center space-x-4">            const handleNewUserJoined = useCallback(async ({ name, socketId, role }) => {

                    <span className="text-white text-sm">

                        <Users size={16} className="inline mr-1" />        const offer = await createOffer();        console.log("👤 New user joined:", name);

                        {participants.length + 1} participants

                    </span>        socket.emit("call-user", { socketId, offer });        setParticipants(prev => [...prev, { 

                </div>

            </header>                    name, 



            {/* Main Content */}        toast(`${name} joined the meeting`, { icon: '👋' });            socketId, 

            <div className="flex-1 flex">

                {/* Video Area */}    }, [createOffer, socket]);            role,

                <div className="flex-1 p-4">

                    <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-4">            isAudioMuted: false,

                        {/* Local Video */}

                        <div className="relative bg-gray-800 rounded-lg overflow-hidden">    const handleIncomingCall = useCallback(async ({ from, offer, fromName }) => {            isVideoOff: false,

                            <video

                                ref={localVideoRef}        console.log("📞 Incoming call from:", fromName);            isConnected: true,

                                autoPlay

                                playsInline        const answer = await createAnswer(offer);            isSpeaking: false

                                muted

                                className="w-full h-full object-cover"        socket.emit("call-accepted", { socketId: from, ans: answer });        }]);

                            />

                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">                

                                {userName} (You)

                            </div>        setParticipants(prev => {        const offer = await createOffer();

                        </div>

            if (!prev.find(p => p.socketId === from)) {        socket.emit("call-user", { socketId, offer });

                        {/* Remote Video */}

                        <div className="relative bg-gray-800 rounded-lg overflow-hidden">                return [...prev, {         

                            <video

                                ref={remoteVideoRef}                    name: fromName,         toast(`${name} joined the meeting`, { icon: '👋' });

                                autoPlay

                                playsInline                    socketId: from,     }, [createOffer, socket]);

                                className="w-full h-full object-cover"

                            />                    role: 'participant',

                            {participants.length > 0 && (

                                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">                    isAudioMuted: false,    const handleIncomingCall = useCallback(async ({ from, offer, fromName }) => {

                                    {participants[0]?.name}

                                </div>                    isVideoOff: false,        console.log("📞 Incoming call from:", fromName);

                            )}

                        </div>                    isConnected: true,        const answer = await createAnswer(offer);

                    </div>

                </div>                    isSpeaking: false        socket.emit("call-accepted", { socketId: from, ans: answer });



                {/* Chat Panel */}                }];        

                {showChat && (

                    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">            }        setParticipants(prev => {

                        <div className="p-4 border-b border-gray-700">

                            <h3 className="text-white font-medium">Chat</h3>            return prev;            if (!prev.find(p => p.socketId === from)) {

                        </div>

                                });                return [...prev, { 

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">

                            {messages.map((msg, index) => (    }, [createAnswer, socket]);                    name: fromName, 

                                <div key={index} className={`${msg.isOwn ? 'text-right' : 'text-left'}`}>

                                    <div className={`inline-block max-w-xs px-3 py-2 rounded-lg text-sm ${                    socketId: from, 

                                        msg.isOwn ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'

                                    }`}>    const handleCallAccepted = useCallback(async ({ ans }) => {                    role: 'participant',

                                        {!msg.isOwn && (

                                            <div className="font-medium text-xs mb-1 opacity-75">        await setRemoteAns(ans);                    isAudioMuted: false,

                                                {msg.from}

                                            </div>    }, [setRemoteAns]);                    isVideoOff: false,

                                        )}

                                        <div>{msg.message}</div>                    isConnected: true,

                                    </div>

                                </div>    const handleUserLeft = useCallback(({ socketId, name }) => {                    isSpeaking: false

                            ))}

                            <div ref={chatEndRef} />        console.log("👋 User left:", name);                }];

                        </div>

                                setParticipants(prev => prev.filter(p => p.socketId !== socketId));            }

                        <div className="p-4 border-t border-gray-700">

                            <div className="flex space-x-2">        toast(`${name} left the meeting`, { icon: '👋' });            return prev;

                                <input

                                    value={inputMessage}    }, []);        });

                                    onChange={(e) => setInputMessage(e.target.value)}

                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}    }, [createAnswer, socket]);

                                    placeholder="Send a message..."

                                    className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none"    const handleMessageReceived = useCallback(({ message, from, timestamp }) => {

                                />

                                <button        setMessages(prev => [...prev, { message, from, timestamp, isOwn: false }]);    const handleCallAccepted = useCallback(async ({ ans }) => {

                                    onClick={sendMessage}

                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"        if (!showChat) {        await setRemoteAns(ans);

                                >

                                    <Send size={16} />            toast(`New message from ${from}`, {     }, [setRemoteAns]);

                                </button>

                            </div>                icon: '💬',

                        </div>

                    </div>                action: {    const handleUserLeft = useCallback(({ socketId, name }) => {

                )}

            </div>                    label: 'Show',        console.log("👋 User left:", name);



            {/* Controls */}                    onClick: () => setShowChat(true)        setParticipants(prev => prev.filter(p => p.socketId !== socketId));

            <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">

                <button                }        toast(`${name} left the meeting`, { icon: '👋' });

                    onClick={toggleAudio}

                    className={`p-3 rounded-full ${isAudioEnabled ? 'bg-gray-700' : 'bg-red-600'} text-white`}            });    }, []);

                >

                    {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}        }

                </button>

                    }, [showChat]);    const handleMessageReceived = useCallback(({ message, from, timestamp }) => {

                <button

                    onClick={toggleVideo}        setMessages(prev => [...prev, { message, from, timestamp, isOwn: false }]);

                    className={`p-3 rounded-full ${isVideoEnabled ? 'bg-gray-700' : 'bg-red-600'} text-white`}

                >    // Control handlers        if (!showChat) {

                    {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}

                </button>    const toggleAudio = () => {            toast(`New message from ${from}`, { 



                <button        if (localStream) {                icon: '💬',

                    onClick={() => setShowChat(!showChat)}

                    className="p-3 rounded-full bg-gray-700 text-white"            const audioTrack = localStream.getAudioTracks()[0];                action: {

                >

                    <MessageSquare className="h-6 w-6" />            if (audioTrack) {                    label: 'Show',

                </button>

                                audioTrack.enabled = !audioTrack.enabled;                    onClick: () => setShowChat(true)

                <button

                    onClick={leaveCall}                setIsAudioEnabled(audioTrack.enabled);                }

                    className="p-3 rounded-full bg-red-600 text-white"

                >                            });

                    <PhoneOff className="h-6 w-6" />

                </button>                if (socket) {        }

            </div>

        </div>                    socket.emit("audio-toggle", {     }, [showChat]);

    );

};                        roomId, 



export default Room;                        isAudioMuted: !audioTrack.enabled     // Control handlers

                    });    const toggleAudio = () => {

                }        if (localStream) {

            }            const audioTrack = localStream.getAudioTracks()[0];

        }            if (audioTrack) {

    };                audioTrack.enabled = !audioTrack.enabled;

                setIsAudioEnabled(audioTrack.enabled);

    const toggleVideo = () => {                setIsAudioMuted(!audioTrack.enabled);

        if (localStream) {                

            const videoTrack = localStream.getVideoTracks()[0];                if (socket) {

            if (videoTrack) {                    socket.emit("audio-toggle", { 

                videoTrack.enabled = !videoTrack.enabled;                        roomId, 

                setIsVideoEnabled(videoTrack.enabled);                        isAudioMuted: !audioTrack.enabled 

                                    });

                if (socket) {                }

                    socket.emit("video-toggle", {             }

                        roomId,         }

                        isVideoOff: !videoTrack.enabled     };

                    });

                }    const toggleVideo = () => {

            }        if (localStream) {

        }            const videoTrack = localStream.getVideoTracks()[0];

    };            if (videoTrack) {

                videoTrack.enabled = !videoTrack.enabled;

    const sendMessage = () => {                setIsVideoEnabled(videoTrack.enabled);

        if (inputMessage.trim()) {                setIsVideoOff(!videoTrack.enabled);

            const message = {                

                message: inputMessage.trim(),                if (socket) {

                from: userName,                    socket.emit("video-toggle", { 

                timestamp: new Date().toISOString()                        roomId, 

            };                        isVideoOff: !videoTrack.enabled 

                                });

            socket.emit("chat-message", { roomId, ...message });                }

            setMessages(prev => [...prev, { ...message, isOwn: true }]);            }

            setInputMessage('');        }

        }    };

    };

    const sendMessage = () => {

    const leaveCall = () => {        if (inputMessage.trim()) {

        if (localStream) {            const message = {

            localStream.getTracks().forEach(track => track.stop());                message: inputMessage.trim(),

        }                from: userName,

        socket.emit("leave-room", { roomId });                timestamp: new Date().toISOString()

        navigate('/home');            };

    };            

            socket.emit("chat-message", { roomId, ...message });

    // Effects            setMessages(prev => [...prev, { ...message, isOwn: true }]);

    useEffect(() => {            setInputMessage('');

        const name = user?.name || localStorage.getItem('userName') || 'Anonymous User';        }

        setUserName(name);    };

        

        getUserMediaStream().then(stream => {    const leaveCall = () => {

            if (stream) {        if (localStream) {

                sendStream(stream);            localStream.getTracks().forEach(track => track.stop());

            }        }

        });        socket.emit("leave-room", { roomId });

        navigate('/');

        if (socket && roomId && name) {    };

            console.log(`🚪 Joining room: ${roomId} as ${name}`);

            socket.emit("join-room", { name, roomId });    // Effects

        }    useEffect(() => {

    }, [getUserMediaStream, sendStream, socket, roomId, user]);        const name = user?.name || localStorage.getItem('userName') || 'Anonymous User';

        setUserName(name);

    useEffect(() => {        

        if (!socket) return;        getUserMediaStream().then(stream => {

            if (stream) {

        socket.on("joined-room", handleJoinedRoom);                sendStream(stream);

        socket.on("user-joined", handleNewUserJoined);            }

        socket.on("incomming-call", handleIncomingCall);        });

        socket.on("call-accepted", handleCallAccepted);

        socket.on("user-left", handleUserLeft);        if (socket && roomId && name) {

        socket.on("chat-message", handleMessageReceived);            console.log(`🚪 Joining room: ${roomId} as ${name}`);

            socket.emit("join-room", { name, roomId });

        return () => {        }

            socket.off("joined-room", handleJoinedRoom);    }, [getUserMediaStream, sendStream, socket, roomId, user]);

            socket.off("user-joined", handleNewUserJoined);

            socket.off("incomming-call", handleIncomingCall);    useEffect(() => {

            socket.off("call-accepted", handleCallAccepted);        if (!socket) return;

            socket.off("user-left", handleUserLeft);

            socket.off("chat-message", handleMessageReceived);        socket.on("joined-room", handleJoinedRoom);

        };        socket.on("user-joined", handleNewUserJoined);

    }, [socket, handleJoinedRoom, handleNewUserJoined, handleIncomingCall,         socket.on("incomming-call", handleIncomingCall);

        handleCallAccepted, handleUserLeft, handleMessageReceived]);        socket.on("call-accepted", handleCallAccepted);

        socket.on("user-left", handleUserLeft);

    useEffect(() => {        socket.on("chat-message", handleMessageReceived);

        if (chatEndRef.current) {

            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });        return () => {

        }            socket.off("joined-room", handleJoinedRoom);

    }, [messages]);            socket.off("user-joined", handleNewUserJoined);

            socket.off("incomming-call", handleIncomingCall);

    useEffect(() => {            socket.off("call-accepted", handleCallAccepted);

        if (remoteStream && remoteVideoRef.current) {            socket.off("user-left", handleUserLeft);

            remoteVideoRef.current.srcObject = remoteStream;            socket.off("chat-message", handleMessageReceived);

        }        };

    }, [remoteStream]);    }, [socket, handleJoinedRoom, handleNewUserJoined, handleIncomingCall, 

        handleCallAccepted, handleUserLeft, handleMessageReceived]);

    if (isWaitingForApproval) {

        return (    useEffect(() => {

            <div className="h-screen bg-gray-900 flex items-center justify-center">        if (chatEndRef.current) {

                <div className="text-center">            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });

                    <div className="text-white text-xl mb-4">Waiting for host approval...</div>        }

                    <div className="text-gray-400">The meeting host will admit you shortly.</div>    }, [messages]);        

                </div>

            </div>            chatEndRef.current.scrollIntoView({ behavior: "smooth" });        if (approved) {

        );

    }        }            toast.success('Participant admitted');



    return (    }, [messages]);        } else {

        <div className="h-screen bg-gray-900 flex flex-col">

            <Toaster             toast('Participant denied entry');

                position="top-right"

                toastOptions={{    const toggleVideo = () => {        }

                    style: {

                        background: '#374151',        if (localStream) {    }, [socket]);

                        color: '#fff',

                        border: '1px solid #4B5563'            const videoTrack = localStream.getVideoTracks()[0];

                    }

                }}            if (videoTrack) {    const handleParticipantWaiting = useCallback(({ name, socketId, waitingId }) => {

            />

                videoTrack.enabled = !videoTrack.enabled;        setWaitingParticipants(prev => [...prev, { name, socketId, waitingId }]);

            {/* Header */}

            <header className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">                setIsVideoEnabled(videoTrack.enabled);        toast(`${name} is waiting to join`, { 

                <div className="flex items-center space-x-4">

                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">            }            icon: '👋',

                        <span className="text-white font-bold text-sm">M</span>

                    </div>        }            action: {

                    <div className="text-white">

                        <span className="font-medium">Meet</span>    };                label: 'Admit',

                        <span className="ml-2 text-gray-400 text-sm">Room: {roomId}</span>

                    </div>                onClick: () => handleApproveParticipant({ socketId, waitingId, approved: true })

                    {isHost && (

                        <div className="flex items-center space-x-1 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-medium">    const toggleAudio = () => {            }

                            <Crown size={12} />

                            Host        if (localStream) {        });

                        </div>

                    )}            const audioTrack = localStream.getAudioTracks()[0];    }, [handleApproveParticipant]);

                </div>

                            if (audioTrack) {

                <div className="flex items-center space-x-4">

                    <span className="text-white text-sm flex items-center space-x-2">                audioTrack.enabled = !audioTrack.enabled;    const handleNewUserJoined = useCallback(async ({ name, socketId, role }) => {

                        <Users size={16} />

                        <span>{participants.length + 1} participant{participants.length !== 0 ? 's' : ''}</span>                setIsAudioEnabled(audioTrack.enabled);        console.log("👤 New user joined:", name);

                    </span>

                </div>            }        setParticipants(prev => [...prev, { 

            </header>

        }            name, 

            {/* Main Content */}

            <div className="flex-1 flex">    };            socketId, 

                {/* Video Area */}

                <div className={`flex-1 p-4 ${showChat ? 'pr-2' : ''}`}>            role,

                    <div className="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                        {/* Local Video */}    const sendMessage = () => {            isAudioMuted: false,

                        <div className="relative bg-gray-800 rounded-lg overflow-hidden">

                            <video        if (inputMessage.trim() && socket) {            isVideoOff: false,

                                ref={localVideoRef}

                                autoPlay            const messageData = {            isConnected: true,

                                playsInline

                                muted                message: inputMessage,            isSpeaking: false

                                className="w-full h-full object-cover"

                                style={{ display: !isVideoEnabled ? 'none' : 'block' }}                sender: user?.name || 'User',        }]);

                            />

                            {!isVideoEnabled && (                timestamp: new Date().toISOString()        

                                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">

                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">            };        const offer = await createOffer();

                                        <span className="text-white text-xl font-medium">

                                            {userName.charAt(0).toUpperCase()}            socket.emit("send-message", messageData);        socket.emit("call-user", { socketId, offer });

                                        </span>

                                    </div>            setMessages(prev => [...prev, { ...messageData, self: true }]);        

                                </div>

                            )}            setInputMessage("");        toast(`${name} joined the meeting`, { icon: '👋' });

                            

                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">        }    }, [createOffer, socket]);

                                {userName} (You)

                            </div>    };

                        </div>

    const handleIncomingCall = useCallback(async ({ from, offer, fromName }) => {

                        {/* Remote Videos */}

                        {participants.map((participant, index) => (    const leaveRoom = () => {        console.log("📞 Incoming call from:", fromName);

                            <div key={participant.socketId} className="relative bg-gray-800 rounded-lg overflow-hidden">

                                <video        if (localStream) {        const answer = await createAnswer(offer);

                                    ref={index === 0 ? remoteVideoRef : null}

                                    autoPlay            localStream.getTracks().forEach(track => track.stop());        socket.emit("call-accepted", { socketId: from, ans: answer });

                                    playsInline

                                    className="w-full h-full object-cover"        }        

                                />

                                        if (socket) {        setParticipants(prev => {

                                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">

                                    {participant.name}            socket.emit("leave-room", { roomId });            if (!prev.find(p => p.socketId === from)) {

                                </div>

                            </div>        }                return [...prev, { 

                        ))}

                                navigate("/home");                    name: fromName, 

                        {/* Empty state */}

                        {participants.length === 0 && (    };                    socketId: from, 

                            <div className="flex items-center justify-center bg-gray-800 rounded-lg">

                                <div className="text-center text-gray-400">                    role: 'participant',

                                    <div className="text-4xl mb-2">👋</div>

                                    <p>Waiting for others to join...</p>    const handleKeyPress = (e) => {                    isAudioMuted: false,

                                </div>

                            </div>        if (e.key === 'Enter') {                    isVideoOff: false,

                        )}

                    </div>            sendMessage();                    isConnected: true,

                </div>

        }                    isSpeaking: false

                {/* Chat Panel */}

                {showChat && (    };                }];

                    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">

                        <div className="p-4 border-b border-gray-700">            }

                            <div className="flex items-center justify-between">

                                <h3 className="text-white font-medium flex items-center space-x-2">    return (            return prev;

                                    <MessageSquare size={18} />

                                    <span>Chat</span>        <div className="h-screen bg-gray-900 flex">        });

                                </h3>

                                <button            {/* Main Video Area */}    }, [createAnswer, socket]);

                                    onClick={() => setShowChat(false)}

                                    className="text-gray-400 hover:text-white p-1 rounded transition-colors"            <div className="flex-1 flex flex-col">=======

                                >

                                    ×                {/* Header */}import "./RoomPage.css";

                                </button>

                            </div>                <div className="bg-gray-800 p-4 flex items-center justify-between">

                        </div>

                                            <div className="text-white">const RoomPage = () => {

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">

                            {messages.map((msg, index) => (                        <h1 className="text-xl font-semibold">Room: {roomId}</h1>  const { socket } = useSocket();

                                <div key={index} className={`${msg.isOwn ? 'text-right' : 'text-left'}`}>

                                    <div className={`inline-block max-w-xs px-3 py-2 rounded-lg text-sm ${                        <p className="text-gray-400 text-sm">{participants.length + 1} participants</p>  const {

                                        msg.isOwn 

                                            ? 'bg-blue-600 text-white'                     </div>    peer,

                                            : 'bg-gray-700 text-gray-200'

                                    }`}>                    <div className="flex items-center space-x-2">    createOffer,

                                        {!msg.isOwn && (

                                            <div className="font-medium text-xs mb-1 opacity-75">                        <button    createAnswer,

                                                {msg.from}

                                            </div>                            onClick={() => setIsChatOpen(!isChatOpen)}    setRemoteAns,

                                        )}

                                        <div>{msg.message}</div>                            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"    sendStream,

                                    </div>

                                </div>                        >    remoteStream,

                            ))}

                            <div ref={chatEndRef} />                            <MessageSquare className="h-5 w-5" />  } = usePeer();

                        </div>

                                                </button>

                        <div className="p-4 border-t border-gray-700">

                            <div className="flex space-x-2">                        <button  const [myStream, setMyStream] = useState(null);

                                <input

                                    value={inputMessage}                            onClick={() => setIsChatOpen(!isChatOpen)}  const [remoteEmailId, setRemoteEmailId] = useState(null);

                                    onChange={(e) => setInputMessage(e.target.value)}

                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}                            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"  const [micOn, setMicOn] = useState(true);

                                    placeholder="Send a message..."

                                    className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"                        >  const [camOn, setCamOn] = useState(true);

                                />

                                <button                            <Users className="h-5 w-5" />  const [chatOpen, setChatOpen] = useState(true);

                                    onClick={sendMessage}

                                    disabled={!inputMessage.trim()}                        </button>  const [messages, setMessages] = useState([]);

                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"

                                >                    </div>  const [inputMsg, setInputMsg] = useState("");

                                    <Send size={16} />

                                </button>                </div>  const [isMyVideoMain, setIsMyVideoMain] = useState(true);

                            </div>

                        </div>

                    </div>

                )}                {/* Video Grid */}  const localVideoRef = useRef(null);

            </div>

                <div className="flex-1 p-4">  const remoteVideoRef = useRef(null);

            {/* Meeting Controls */}

            <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">  const chatEndRef = useRef(null);

                <button

                    onClick={toggleAudio}                        {/* Local Video */}

                    className={`p-3 rounded-full ${isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-500'} text-white`}

                >                        <div className="relative bg-black rounded-lg overflow-hidden">  const getUserMediaStream = useCallback(async () => {

                    {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}

                </button>                            <video    const stream = await navigator.mediaDevices.getUserMedia({

                

                <button                                ref={localVideoRef}      video: true,

                    onClick={toggleVideo}

                    className={`p-3 rounded-full ${isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-500'} text-white`}                                autoPlay      audio: true,

                >

                    {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}                                muted    });

                </button>

                                playsInline    setMyStream(stream);

                <button

                    onClick={() => setShowChat(!showChat)}                                className="w-full h-full object-cover"    sendStream(stream);

                    className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white"

                >                            />    if (localVideoRef.current) {

                    <MessageSquare className="h-6 w-6" />

                </button>                            <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">      localVideoRef.current.srcObject = stream;

                

                <button                                You {!isVideoEnabled && "(Video Off)"}    }

                    onClick={leaveCall}

                    className="p-3 rounded-full bg-red-600 hover:bg-red-500 text-white"                            </div>  }, [sendStream]);

                >

                    <PhoneOff className="h-6 w-6" />                        </div>

                </button>

            </div>  const handleNewUserJoined = useCallback(

        </div>

    );                        {/* Remote Videos */}    async ({ emailId }) => {

};

                        {participants.map((participant) => (      const offer = await createOffer();

export default Room;
                            <div key={participant.id} className="relative bg-gray-800 rounded-lg overflow-hidden">      socket.emit("call-user", { emailId, offer });

                                {remoteStreams[participant.id] ? (      setRemoteEmailId(emailId);

                                    <video    },

                                        autoPlay    [createOffer, socket]

                                        playsInline  );

                                        className="w-full h-full object-cover"

                                        ref={(video) => {  const handleIncomingCall = useCallback(

                                            if (video && remoteStreams[participant.id]) {    async ({ from, offer }) => {

                                                video.srcObject = remoteStreams[participant.id];      const answer = await createAnswer(offer);

                                            }      socket.emit("call-accepted", { emailId: from, ans: answer });

                                        }}      setRemoteEmailId(from);

                                    />    },

                                ) : (    [createAnswer, socket]

                                    <div className="w-full h-full flex items-center justify-center">  );

                                        <div className="text-center text-white">>>>>>>> 3acab35b9e6419bb66c1c8c6b8a5a4a393f48272

                                            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">

                                                <span className="text-xl font-semibold">  const handleCallAccepted = useCallback(

                                                    {participant.name?.charAt(0).toUpperCase() || 'U'}    async ({ ans }) => {

                                                </span>      await setRemoteAns(ans);

                                            </div>    },

                                            <p className="text-sm">{participant.name}</p>    [setRemoteAns]

                                        </div>  );

                                    </div>

                                )}<<<<<<< HEAD

                                <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">    const handleUserLeft = useCallback(({ socketId, name }) => {

                                    {participant.name}        console.log("👋 User left:", name);

                                </div>        setParticipants(prev => prev.filter(p => p.socketId !== socketId));

                            </div>        toast(`${name} left the meeting`, { icon: '👋' });

                        ))}    }, []);

                    </div>

                </div>    const handleMessageReceived = useCallback(({ message, from, timestamp }) => {

        setMessages(prev => [...prev, { message, from, timestamp, isOwn: false }]);

                {/* Controls */}        if (!showChat) {

                <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">            toast(`New message from ${from}`, { 

                    <button                icon: '💬',

                        onClick={toggleAudio}                action: {

                        className={`p-3 rounded-full ${isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-500'} text-white`}                    label: 'Show',

                    >                    onClick: () => setShowChat(true)

                        {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}                }

                    </button>            });

                            }

                    <button    }, [showChat]);

                        onClick={toggleVideo}

                        className={`p-3 rounded-full ${isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-500'} text-white`}    const handleForceMute = useCallback(({ by }) => {

                    >        setIsAudioMuted(true);

                        {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}        if (myStream) {

                    </button>            const audioTrack = myStream.getAudioTracks()[0];

                                if (audioTrack) {

                    <button                audioTrack.enabled = false;

                        onClick={leaveRoom}            }

                        className="p-3 rounded-full bg-red-600 hover:bg-red-500 text-white"        }

                    >        toast.error(`You were muted by ${by}`);

                        <PhoneOff className="h-6 w-6" />    }, [myStream]);

                    </button>

                </div>    const handleRemovedFromMeeting = useCallback(({ by }) => {

            </div>        toast.error(`You were removed from the meeting by ${by}`);

        setTimeout(() => {

            {/* Chat Sidebar */}            navigate('/');

            {isChatOpen && (        }, 2000);

                <div className="w-80 bg-gray-800 flex flex-col">    }, [navigate]);

                    <div className="p-4 border-b border-gray-700">

                        <h3 className="text-white font-semibold">Chat</h3>    const handleRoleUpdated = useCallback(({ role }) => {

                    </div>        setUserRole(role);

                            toast.success(`You are now a ${role}`);

                    <div className="flex-1 p-4 overflow-y-auto">    }, []);

                        {messages.map((msg, index) => (

                            <div key={index} className={`mb-3 ${msg.self ? 'text-right' : 'text-left'}`}>    // Control handlers

                                <div className={`inline-block p-2 rounded-lg max-w-xs ${    const toggleAudio = () => {

                                    msg.self         if (myStream) {

                                        ? 'bg-blue-600 text-white'             const audioTrack = myStream.getAudioTracks()[0];

                                        : 'bg-gray-700 text-white'            if (audioTrack) {

                                }`}>                audioTrack.enabled = !audioTrack.enabled;

                                    {!msg.self && (                setIsAudioMuted(!audioTrack.enabled);

                                        <p className="text-xs text-gray-300 mb-1">{msg.sender}</p>                

                                    )}                // Notify other participants about audio state change

                                    <p className="text-sm">{msg.message}</p>                if (socket) {

                                </div>                    socket.emit("audio-toggle", { 

                            </div>                        roomId, 

                        ))}                        isAudioMuted: !audioTrack.enabled 

                        <div ref={chatEndRef} />                    });

                    </div>                }

                                }

                    <div className="p-4 border-t border-gray-700">        }

                        <div className="flex space-x-2">    };

                            <input

                                type="text"    const toggleVideo = () => {

                                value={inputMessage}        if (myStream) {

                                onChange={(e) => setInputMessage(e.target.value)}            const videoTrack = myStream.getVideoTracks()[0];

                                onKeyPress={handleKeyPress}            if (videoTrack) {

                                placeholder="Type a message..."                videoTrack.enabled = !videoTrack.enabled;

                                className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"                setIsVideoOff(!videoTrack.enabled);

                            />                

                            <button                // Notify other participants about video state change

                                onClick={sendMessage}                if (socket) {

                                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"                    socket.emit("video-toggle", { 

                            >                        roomId, 

                                <Send className="h-5 w-5" />                        isVideoOff: !videoTrack.enabled 

                            </button>                    });

                        </div>                }

                    </div>            }

                </div>        }

            )}    };



            {/* Participants Panel */}    const startScreenShare = async () => {

            <ParticipantsPanel         try {

                participants={participants}            const screenStream = await navigator.mediaDevices.getDisplayMedia({ 

                isOpen={false}                video: true, 

                onClose={() => {}}                audio: true 

            />            });

        </div>            

    );            const videoTrack = screenStream.getVideoTracks()[0];

};            const sender = peer.getSenders().find(s => 

                s.track && s.track.kind === 'video'

export default Room;            );
            
            if (sender) {
                await sender.replaceTrack(videoTrack);
            }
            
            setIsScreenSharing(true);
            socket.emit("start-screen-share", { roomId });
            toast.success('Screen sharing started');
            
            videoTrack.onended = () => {
                setIsScreenSharing(false);
                socket.emit("stop-screen-share", { roomId });
                toast('Screen sharing stopped');
                
                if (myStream) {
                    const cameraTrack = myStream.getVideoTracks()[0];
                    if (sender && cameraTrack) {
                        sender.replaceTrack(cameraTrack);
                    }
                }
            };
        } catch (error) {
            console.error("Error starting screen share:", error);
            toast.error("Failed to start screen sharing");
        }
    };

    const sendMessage = () => {
        if (newMessage.trim()) {
            const message = {
                message: newMessage.trim(),
                from: userName,
                timestamp: new Date().toISOString()
            };
            
            socket.emit("chat-message", { roomId, ...message });
            setMessages(prev => [...prev, { ...message, isOwn: true }]);
            setNewMessage('');
        }
    };

    const leaveCall = () => {
        if (myStream) {
            myStream.getTracks().forEach(track => track.stop());
        }
        socket.emit("leave-room", { roomId });
        navigate('/');
    };

    const muteParticipant = (socketId) => {
        socket.emit("mute-participant", { socketId, roomId });
    };

    const removeParticipant = (socketId) => {
        socket.emit("remove-participant", { socketId, roomId });
    };

    const promoteToCoHost = (socketId) => {
        socket.emit("promote-to-cohost", { socketId, roomId });
    };

    const startRecording = () => {
        setIsRecording(true);
        toast.success('Recording started');
    };

    const stopRecording = () => {
        setIsRecording(false);
        toast('Recording stopped');
    };

    const copyMeetingLink = () => {
        const link = window.location.href;
        navigator.clipboard.writeText(link);
        toast.success('Meeting link copied!');
    };

    useEffect(() => {
        // Get user name from localStorage
        const name = localStorage.getItem('userName') || 'Anonymous User';
        setUserName(name);
        
        getUserMediaStream().then(stream => {
            if (stream) {
                sendStream(stream);
            }
        });

        // Join the room when component mounts
        if (socket && roomId && name) {
            console.log(`🚪 Joining room: ${roomId} as ${name}`);
            socket.emit("join-room", { name, roomId });
        }
    }, [getUserMediaStream, sendStream, socket, roomId]);

    useEffect(() => {
        if (!socket) return;

        // Core meeting events
        socket.on("joined-room", handleJoinedRoom);
        socket.on("waiting-for-approval", handleWaitingForApproval);
        socket.on("participant-waiting", handleParticipantWaiting);
        socket.on("user-joined", handleNewUserJoined);
        socket.on("incomming-call", handleIncomingCall);
        socket.on("call-accepted", handleCallAccepted);
        socket.on("user-left", handleUserLeft);
        
        // Chat events
        socket.on("chat-message", handleMessageReceived);
        
        // Moderation events
        socket.on("force-mute", handleForceMute);
        socket.on("removed-from-meeting", handleRemovedFromMeeting);
        socket.on("role-updated", handleRoleUpdated);
        
        // Screen sharing events
        socket.on("screen-share-started", ({ participantName }) => {
            toast(`${participantName} started sharing their screen`);
        });
        
        socket.on("screen-share-stopped", ({ participantName }) => {
            toast(`${participantName} stopped sharing their screen`);
        });

        return () => {
            socket.off("joined-room", handleJoinedRoom);
            socket.off("waiting-for-approval", handleWaitingForApproval);
            socket.off("participant-waiting", handleParticipantWaiting);
            socket.off("user-joined", handleNewUserJoined);
            socket.off("incomming-call", handleIncomingCall);
            socket.off("call-accepted", handleCallAccepted);
            socket.off("user-left", handleUserLeft);
            socket.off("chat-message", handleMessageReceived);
            socket.off("force-mute", handleForceMute);
            socket.off("removed-from-meeting", handleRemovedFromMeeting);
            socket.off("role-updated", handleRoleUpdated);
            socket.off("screen-share-started");
            socket.off("screen-share-stopped");
        };
    }, [socket, handleJoinedRoom, handleWaitingForApproval, handleParticipantWaiting, 
        handleNewUserJoined, handleIncomingCall, handleCallAccepted, handleUserLeft, 
        handleMessageReceived, handleForceMute, handleRemovedFromMeeting, handleRoleUpdated]);
=======
  const handleNegotiationNeeded = useCallback(async () => {
    if (!remoteEmailId) return;
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit("call-user", { emailId: remoteEmailId, offer });
  }, [peer, remoteEmailId, socket]);


const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { socket } = useSocket();
    const { peer, createOffer, createAnswer, setRemoteAns, sendStream, remoteStream } = usePeer();
    const { user } = useAuth();
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [localStream, setLocalStream] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const [showChat, setShowChat] = useState(false);

    socket.emit("end-call", { to: remoteEmailId });

<<<<<<< HEAD
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    if (isWaitingForApproval) {
        return <WaitingRoomMessage isWaiting={true} roomId={roomId} />;
    }

    return (
        <div className="h-screen bg-gray-900 flex flex-col relative overflow-hidden">
            <Toaster 
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#374151',
                        color: '#fff',
                        border: '1px solid #4B5563'
                    }
                }}
            />

            {/* Header */}
            <header className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700 z-30">
                <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">M</span>
                    </div>
                    <div className="text-white">
                        <span className="font-medium">Meet</span>
                        <span className="ml-2 text-gray-400 text-sm">Room: {roomId}</span>
                    </div>
                    {isHost && (
                        <div className="flex items-center space-x-1 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-medium">
                            <Crown size={12} />
                            Host
                        </div>
                    )}
                    {isCoHost && (
                        <div className="flex items-center space-x-1 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            <Shield size={12} />
                            Co-host
                        </div>
                    )}
                </div>
                
                <div className="flex items-center space-x-4">
                    <button
                        onClick={copyMeetingLink}
                        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <Link size={16} />
                        <span className="text-sm">Copy link</span>
                    </button>
                    
                    <span className="text-white text-sm flex items-center space-x-2">
                        <Users size={16} />
                        <span>{participants.length + 1} participant{participants.length !== 0 ? 's' : ''}</span>
                    </span>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex relative">
                {/* Video Area */}
                <div className={`flex-1 p-4 transition-all duration-300 ${
                    showChat ? 'pr-2' : showParticipants ? 'pr-2' : ''
                }`}>
                    <div className="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
                        {/* Local Video */}
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative bg-gray-800 rounded-lg overflow-hidden shadow-lg"
                        >
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                                style={{ display: isVideoOff ? 'none' : 'block' }}
                            />
                            {isVideoOff && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xl font-medium">
                                            {userName.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Video overlay */}
                            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                                <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm font-medium">
                                    {userName} (You)
                                </div>
                                <div className="flex items-center space-x-1">
                                    {isAudioMuted && (
                                        <div className="bg-red-600 text-white p-1 rounded flex items-center">
                                            <MicOff size={12} />
                                        </div>
                                    )}
                                    {isScreenSharing && (
                                        <div className="bg-green-600 text-white p-1 rounded flex items-center">
                                            <MonitorSpeaker size={12} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Remote Videos */}
                        <AnimatePresence>
                            {participants.map((participant, index) => (
                                <motion.div
                                    key={participant.socketId}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative bg-gray-800 rounded-lg overflow-hidden shadow-lg"
                                >
                                    <video
                                        ref={index === 0 ? remoteVideoRef : null}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                    
                                    {/* Participant overlay */}
                                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                                        <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm font-medium">
                                            {participant.name}
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            {participant.isAudioMuted && (
                                                <div className="bg-red-600 text-white p-1 rounded">
                                                    <MicOff size={12} />
                                                </div>
                                            )}
                                            {participant.role === 'host' && (
                                                <div className="bg-yellow-500 text-black p-1 rounded">
                                                    <Crown size={12} />
                                                </div>
                                            )}
                                            {participant.role === 'co-host' && (
                                                <div className="bg-blue-500 text-white p-1 rounded">
                                                    <Shield size={12} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        
                        {/* Empty state */}
                        {participants.length === 0 && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-center bg-gray-800 rounded-lg"
                            >
                                <div className="text-center text-gray-400">
                                    <div className="text-4xl mb-2">👋</div>
                                    <p>Waiting for others to join...</p>
                                    <p className="text-sm mt-2">Share the meeting link to invite participants</p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Chat Panel */}
                <AnimatePresence>
                    {showChat && (
                        <motion.div
                            initial={{ x: 320, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 320, opacity: 0 }}
                            className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col z-20"
                        >
                            <div className="p-4 border-b border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white font-medium flex items-center space-x-2">
                                        <MessageSquare size={18} />
                                        <span>In-call messages</span>
                                    </h3>
                                    <button
                                        onClick={() => setShowChat(false)}
                                        className="text-gray-400 hover:text-white p-1 rounded transition-colors"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                <AnimatePresence>
                                    {messages.map((msg, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`${msg.isOwn ? 'text-right' : 'text-left'}`}
                                        >
                                            <div className={`inline-block max-w-xs px-3 py-2 rounded-lg text-sm ${
                                                msg.isOwn 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'bg-gray-700 text-gray-200'
                                            }`}>
                                                {!msg.isOwn && (
                                                    <div className="font-medium text-xs mb-1 opacity-75">
                                                        {msg.from}
                                                    </div>
                                                )}
                                                <div>{msg.message}</div>
                                                <div className="text-xs opacity-75 mt-1">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <div ref={chatEndRef} />
                            </div>
                            
                            <div className="p-4 border-t border-gray-700">
                                <div className="flex space-x-2">
                                    <input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Send a message..."
                                        className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!newMessage.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Participants Panel */}
                <ParticipantsPanel
                    participants={participants.map(p => ({ ...p, socketId: p.socketId }))}
                    currentUser={{ socketId: socket?.id, name: userName }}
                    isHost={isHost}
                    isCoHost={isCoHost}
                    onMuteParticipant={muteParticipant}
                    onRemoveParticipant={removeParticipant}
                    onPromoteToCoHost={promoteToCoHost}
                    isOpen={showParticipants}
                    onClose={() => setShowParticipants(false)}
                />
            </div>

            {/* Waiting Room Panel */}
            <WaitingRoomPanel
                waitingParticipants={waitingParticipants}
                onApprove={(participant) => handleApproveParticipant({ ...participant, approved: true })}
                onDeny={(participant) => handleApproveParticipant({ ...participant, approved: false })}
                isHost={isHost}
            />

            {/* Meeting Controls */}
            <MeetingControls
                isAudioMuted={isAudioMuted}
                isVideoOff={isVideoOff}
                isScreenSharing={isScreenSharing}
                isRecording={isRecording}
                participantCount={participants.length + 1}
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
                onScreenShare={startScreenShare}
                onEndCall={leaveCall}
                onToggleChat={() => setShowChat(!showChat)}
                onToggleParticipants={() => setShowParticipants(!showParticipants)}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onOpenSettings={() => toast('Settings coming soon!')}
                isHost={isHost}
                isCoHost={isCoHost}
            />
=======
    peer.close && peer.close();
    setRemoteEmailId(null);
    setMyStream(null);
    setMessages([]);
    setInputMsg("");

    alert("Call Ended");
  };

  const handleReceiveEndCall = () => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setRemoteEmailId(null);
    alert("The other person ended the call.");
  };

  const handleSendMessage = () => {
    if (inputMsg.trim() === "") return;
    socket.emit("send-message", { message: inputMsg });
    setMessages((prev) => [...prev, { message: inputMsg, self: true }]);
    setInputMsg("");
  };

  const handleReceiveMessage = useCallback(({ message }) => {
    setMessages((prev) => [...prev, { message, self: false }]);
  }, []);

  const handleVideoSwap = () => {
    setIsMyVideoMain((prev) => !prev);
  };

  useEffect(() => {
    getUserMediaStream();
  }, [getUserMediaStream]);

  useEffect(() => {
    peer.addEventListener("negotiationneeded", handleNegotiationNeeded);
    return () =>
      peer.removeEventListener("negotiationneeded", handleNegotiationNeeded);
  }, [handleNegotiationNeeded]);

  useEffect(() => {
    socket.on("user-joined", handleNewUserJoined);
    socket.on("incomming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("receive-message", handleReceiveMessage);
    socket.on("receive-end-call", handleReceiveEndCall);

    return () => {
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incomming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("receive-message", handleReceiveMessage);
      socket.off("receive-end-call", handleReceiveEndCall);
    };
  }, [
    handleIncomingCall,
    handleCallAccepted,
    handleNewUserJoined,
    handleReceiveMessage,
    socket,
  ]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const mainVideoRef = isMyVideoMain ? localVideoRef : remoteVideoRef;
  const pipVideoRef = isMyVideoMain ? remoteVideoRef : localVideoRef;

  return (
    <div className="room-container">
      <header className="room-header">
        <div className="room-title">ChitChat💬</div>
        <div className="room-info">
          {/* <span>15:33</span> */}
          <span className="divider">|</span>
          {/* <span>4 participants</span> */}
>>>>>>> 3acab35b9e6419bb66c1c8c6b8a5a4a393f48272
        </div>
        <div className="room-settings">
          {/* <i className="settings-icon">⚙️</i> */}
        </div>
      </header>

      <div className="main-content">
        <div className="video-section">
          <video
            ref={mainVideoRef}
            autoPlay
            playsInline
            muted={isMyVideoMain}
            className="video-box"
          />
          <video
            ref={pipVideoRef}
            autoPlay
            playsInline
            muted={!isMyVideoMain}
            onClick={handleVideoSwap}
            className="video-box pip"
          />
        </div>

        {chatOpen && (
          <div className="chat-panel">
            <div className="chat-header">
              <span>Meeting Chat</span>
              <button onClick={() => setChatOpen(false)}>✖</button>
            </div>
            <div className="chat-body">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`chat-msg ${msg.self ? "self" : "other"}`}
                >
                  {msg.message}
                </div>
              ))}
              <div ref={chatEndRef}></div>
            </div>
            <div className="chat-input">
              <input
                type="text"
                placeholder="Type a message..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button onClick={handleSendMessage}>📤</button>
            </div>
          </div>
        )}
      </div>

      <div className="controls">
        <button
          className={`control-btn ${!micOn ? "off" : ""}`}
          onClick={toggleMic}
          title="Toggle Microphone"
        >
          {micOn ? "🎤" : "🔇"}
        </button>
        <button
          className={`control-btn ${!camOn ? "off" : ""}`}
          onClick={toggleCamera}
          title="Toggle Camera"
        >
          {camOn ? "📷" : "🚫"}
        </button>
        <button className="control-btn">🎥</button>
        <button
          className="control-btn"
          onClick={() => setChatOpen(!chatOpen)}
        >
          💬
        </button>
        <button className="control-btn end" onClick={endCall}>
          ⛔
        </button>
      </div>
    </div>
  );
};

export default RoomPage;
