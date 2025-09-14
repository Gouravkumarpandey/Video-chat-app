import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../providers/Socket";
<<<<<<< HEAD
import { useAuth } from "../contexts/AuthContext";
import { 
    Video, 
    VideoOff, 
    Mic, 
    MicOff, 
    Settings, 
    Calendar,
    Clock,
    Users,
    Plus,
    ArrowRight,
    Monitor,
    Smartphone,
    Shield,
    Globe,
    LogOut,
    User
} from "lucide-react";
=======
import "./Home.css";
>>>>>>> 3acab35b9e6419bb66c1c8c6b8a5a4a393f48272

const Home = () => {
    const { socket } = useSocket();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState(user?.name || '');
    const [roomId, setRoomId] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleRoomJoined = useCallback(({ roomId }) => {
        setIsJoining(false);
        navigate(`/room/${roomId}`);
    }, [navigate]);

    useEffect(() => {
        // Set the user's name from auth context
        if (user?.name) {
            setName(user.name);
        }
    }, [user]);

    useEffect(() => {
        // Close user menu when clicking outside
        const handleClickOutside = (event) => {
            if (showUserMenu && !event.target.closest('.user-menu')) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showUserMenu]);

    useEffect(() => {
        if (!socket) return;
        socket.on("joined-room", handleRoomJoined);
        return () => {
            socket.off("joined-room", handleRoomJoined);
        };
    }, [socket, handleRoomJoined]);

    const handleJoinRoom = () => {
<<<<<<< HEAD
        if (!name.trim() || !roomId.trim()) return;
        setIsJoining(true);
        localStorage.setItem('userName', name.trim());
        socket.emit("join-room", { name: name.trim(), roomId: roomId.trim() });
    };

    const handleStartMeeting = () => {
        if (!name.trim()) return;
        const newRoomId = Math.random().toString(36).substring(2, 15);
        setRoomId(newRoomId);
        localStorage.setItem('userName', name.trim());
        setTimeout(() => {
            if (!isJoining) {
                setIsJoining(true);
                socket.emit("join-room", { name: name.trim(), roomId: newRoomId });
            }
        }, 100);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getCurrentTime = () => {
        return new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const getCurrentDate = () => {
        return new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <Video className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">VideoMeet</h1>
                                    <p className="text-xs text-gray-500">Professional Video Conferencing</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-6">
                            <div className="hidden md:block text-right">
                                <div className="text-sm font-semibold text-gray-900">{getCurrentTime()}</div>
                                <div className="text-xs text-gray-500">{getCurrentDate()}</div>
                            </div>
                            
                            {/* User Menu */}
                            <div className="relative user-menu">
                                <button 
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <div className="text-sm font-medium text-gray-900">{user?.name || 'User'}</div>
                                        <div className="text-xs text-gray-500">{user?.email}</div>
                                    </div>
                                </button>
                                
                                {/* User Dropdown */}
                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{user?.name || 'User'}</div>
                                                    <div className="text-sm text-gray-500">{user?.email}</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="py-1">
                                            <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-700">Profile Settings</span>
                                            </button>
                                            <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3">
                                                <Settings className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-700">Preferences</span>
                                            </button>
                                            <div className="border-t border-gray-100 my-1"></div>
                                            <button 
                                                onClick={handleLogout}
                                                className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center space-x-3 text-red-600"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span>Sign Out</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Premium video meetings.
                            <span className="block text-blue-600">Now free for everyone.</span>
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Connect, collaborate, and celebrate from anywhere with Google Meet-style video conferencing
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        
                        {/* Video Preview Section */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                                {/* Video Preview Area */}
                                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 aspect-video">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="w-28 h-28 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                                <span className="text-4xl font-bold text-white">
                                                    {name.charAt(0).toUpperCase() || 'Y'}
                                                </span>
                                            </div>
                                            <p className="text-white text-xl font-semibold mb-2">
                                                {name || 'Your Name'}
                                            </p>
                                            <p className="text-gray-300 text-sm">
                                                Camera is {isVideoEnabled ? 'on' : 'off'} • Mic is {isAudioEnabled ? 'on' : 'off'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Video Controls Overlay */}
                                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                                        <div className="flex items-center space-x-4">
                                            <button
                                                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                                                className={`p-4 rounded-full transition-all transform hover:scale-105 ${
                                                    isAudioEnabled 
                                                        ? 'bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white' 
                                                        : 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                                                }`}
                                            >
                                                {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                                            </button>
                                            
                                            <button
                                                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                                                className={`p-4 rounded-full transition-all transform hover:scale-105 ${
                                                    isVideoEnabled 
                                                        ? 'bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white' 
                                                        : 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                                                }`}
                                            >
                                                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Meeting Controls */}
                                <div className="p-8">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                                Enter your name to get started
                                            </label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Your full name"
                                                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Meeting Options */}
                        <div className="space-y-6">
                            
                            {/* New Meeting Card */}
                            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                                <div className="text-center mb-8">
                                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                        <Plus className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Start a new meeting</h3>
                                    <p className="text-gray-600">Create an instant meeting room</p>
                                </div>
                                
                                <button
                                    onClick={handleStartMeeting}
                                    disabled={!name.trim() || isJoining}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg transform hover:scale-105"
                                >
                                    {isJoining ? (
                                        <>
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                            <span>Starting meeting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Video className="w-6 h-6" />
                                            <span>New Meeting</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Join Meeting Card */}
                            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                                <div className="text-center mb-8">
                                    <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                        <Users className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Join a meeting</h3>
                                    <p className="text-gray-600">Enter a meeting ID to join</p>
                                </div>
                                
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={roomId}
                                        onChange={(e) => setRoomId(e.target.value)}
                                        placeholder="Meeting ID or link"
                                        className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                                    />
                                    
                                    <button
                                        onClick={handleJoinRoom}
                                        disabled={!name.trim() || !roomId.trim() || isJoining}
                                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg transform hover:scale-105"
                                    >
                                        {isJoining ? (
                                            <>
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                                <span>Joining...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Users className="w-6 h-6" />
                                                <span>Join Meeting</span>
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">Everything you need for productive meetings</h3>
                        <p className="text-lg text-gray-600">Professional-grade features built for teams of all sizes</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center group">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                                <Monitor className="w-8 h-8 text-blue-600" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Screen Sharing</h4>
                            <p className="text-gray-600 text-sm">Share your screen with crystal clear quality</p>
                        </div>
                        
                        <div className="text-center group">
                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                                <Users className="w-8 h-8 text-green-600" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Up to 100 participants</h4>
                            <p className="text-gray-600 text-sm">Host large meetings with ease</p>
                        </div>
                        
                        <div className="text-center group">
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                                <Shield className="w-8 h-8 text-purple-600" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Secure & Private</h4>
                            <p className="text-gray-600 text-sm">End-to-end encryption for all meetings</p>
                        </div>
                        
                        <div className="text-center group">
                            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                                <Globe className="w-8 h-8 text-orange-600" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Global Access</h4>
                            <p className="text-gray-600 text-sm">Join from anywhere in the world</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-50 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center space-x-4 mb-4 md:mb-0">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                <Video className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-semibold text-gray-900">VideoMeet</span>
                        </div>
                        
                        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-8 text-sm text-gray-600">
                            <button className="hover:text-blue-600 transition-colors">Privacy Policy</button>
                            <button className="hover:text-blue-600 transition-colors">Terms of Service</button>
                            <button className="hover:text-blue-600 transition-colors">Support</button>
                            <span className="text-gray-400">© 2025 VideoMeet</span>
                        </div>
                    </div>
                </div>
            </footer>
=======
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
>>>>>>> 3acab35b9e6419bb66c1c8c6b8a5a4a393f48272
        </div>
    );
};

export default Home;
