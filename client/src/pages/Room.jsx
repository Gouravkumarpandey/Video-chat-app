import React, { useEffect, useCallback, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from 'react-hot-toast';
import { useSocket } from "../providers/Socket";
import { usePeer } from "../providers/Peer";
import MeetingControls from "../components/MeetingControls";
import ParticipantsPanel from "../components/ParticipantsPanel";
import { WaitingRoomPanel, WaitingRoomMessage } from "../components/WaitingRoom";
import { 
    MicOff, 
    MonitorSpeaker, 
    MessageSquare, 
    Send,
    Users,
    Crown,
    Shield,
    Link
} from "lucide-react";

const RoomPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { socket } = useSocket();
    const { peer, createOffer, createAnswer, setRemoteAns, sendStream, remoteStream } = usePeer();

    // Core states
    const [myStream, setMyStream] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [waitingParticipants, setWaitingParticipants] = useState([]);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('participant');
    const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);

    // UI states
    const [showChat, setShowChat] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    // Refs
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const chatEndRef = useRef(null);

    // Computed values
    const isHost = userRole === 'host';
    const isCoHost = userRole === 'co-host';

    const getUserMediaStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: !isVideoOff, 
                audio: !isAudioMuted 
            });
            setMyStream(stream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            return stream;
        } catch (error) {
            console.error("Error accessing media devices:", error);
            toast.error("Failed to access camera/microphone");
        }
    }, [isAudioMuted, isVideoOff]);

    // Enhanced socket event handlers
    const handleJoinedRoom = useCallback(({ roomId, role, isHost: hostStatus, meeting: meetingData, chatHistory }) => {
        setUserRole(role);
        setMessages(chatHistory || []);
        toast.success('Successfully joined the meeting');
        
        if (hostStatus) {
            toast.success('You are the meeting host');
        }
    }, []);

    const handleWaitingForApproval = useCallback(({ roomId, name }) => {
        setIsWaitingForApproval(true);
        toast('Waiting for host approval...', { icon: '⏳' });
    }, []);

    const handleApproveParticipant = useCallback(({ socketId, waitingId, approved }) => {
        socket.emit("approve-participant", { waitingId, approved });
        setWaitingParticipants(prev => prev.filter(p => p.waitingId !== waitingId));
        
        if (approved) {
            toast.success('Participant admitted');
        } else {
            toast('Participant denied entry');
        }
    }, [socket]);

    const handleParticipantWaiting = useCallback(({ name, socketId, waitingId }) => {
        setWaitingParticipants(prev => [...prev, { name, socketId, waitingId }]);
        toast(`${name} is waiting to join`, { 
            icon: '👋',
            action: {
                label: 'Admit',
                onClick: () => handleApproveParticipant({ socketId, waitingId, approved: true })
            }
        });
    }, [handleApproveParticipant]);

    const handleNewUserJoined = useCallback(async ({ name, socketId, role }) => {
        console.log("👤 New user joined:", name);
        setParticipants(prev => [...prev, { 
            name, 
            socketId, 
            role,
            isAudioMuted: false,
            isVideoOff: false,
            isConnected: true,
            isSpeaking: false
        }]);
        
        const offer = await createOffer();
        socket.emit("call-user", { socketId, offer });
        
        toast(`${name} joined the meeting`, { icon: '👋' });
    }, [createOffer, socket]);

    const handleIncomingCall = useCallback(async ({ from, offer, fromName }) => {
        console.log("📞 Incoming call from:", fromName);
        const answer = await createAnswer(offer);
        socket.emit("call-accepted", { socketId: from, ans: answer });
        
        setParticipants(prev => {
            if (!prev.find(p => p.socketId === from)) {
                return [...prev, { 
                    name: fromName, 
                    socketId: from, 
                    role: 'participant',
                    isAudioMuted: false,
                    isVideoOff: false,
                    isConnected: true,
                    isSpeaking: false
                }];
            }
            return prev;
        });
    }, [createAnswer, socket]);

    const handleCallAccepted = useCallback(async ({ ans }) => {
        console.log("✅ Call accepted");
        await setRemoteAns(ans);
    }, [setRemoteAns]);

    const handleUserLeft = useCallback(({ socketId, name }) => {
        console.log("👋 User left:", name);
        setParticipants(prev => prev.filter(p => p.socketId !== socketId));
        toast(`${name} left the meeting`, { icon: '👋' });
    }, []);

    const handleMessageReceived = useCallback(({ message, from, timestamp }) => {
        setMessages(prev => [...prev, { message, from, timestamp, isOwn: false }]);
        if (!showChat) {
            toast(`New message from ${from}`, { 
                icon: '💬',
                action: {
                    label: 'Show',
                    onClick: () => setShowChat(true)
                }
            });
        }
    }, [showChat]);

    const handleForceMute = useCallback(({ by }) => {
        setIsAudioMuted(true);
        if (myStream) {
            const audioTrack = myStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = false;
            }
        }
        toast.error(`You were muted by ${by}`);
    }, [myStream]);

    const handleRemovedFromMeeting = useCallback(({ by }) => {
        toast.error(`You were removed from the meeting by ${by}`);
        setTimeout(() => {
            navigate('/');
        }, 2000);
    }, [navigate]);

    const handleRoleUpdated = useCallback(({ role }) => {
        setUserRole(role);
        toast.success(`You are now a ${role}`);
    }, []);

    // Control handlers
    const toggleAudio = () => {
        if (myStream) {
            const audioTrack = myStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioMuted(!audioTrack.enabled);
                
                // Notify other participants about audio state change
                if (socket) {
                    socket.emit("audio-toggle", { 
                        roomId, 
                        isAudioMuted: !audioTrack.enabled 
                    });
                }
            }
        }
    };

    const toggleVideo = () => {
        if (myStream) {
            const videoTrack = myStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
                
                // Notify other participants about video state change
                if (socket) {
                    socket.emit("video-toggle", { 
                        roomId, 
                        isVideoOff: !videoTrack.enabled 
                    });
                }
            }
        }
    };

    const startScreenShare = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
                video: true, 
                audio: true 
            });
            
            const videoTrack = screenStream.getVideoTracks()[0];
            const sender = peer.getSenders().find(s => 
                s.track && s.track.kind === 'video'
            );
            
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

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

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
        </div>
    );
};

export default RoomPage;
