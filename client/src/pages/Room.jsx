import React, { useEffect, useCallback, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useSocket } from "../providers/Socket";
import { usePeer } from "../providers/Peer";
import { useAuth } from "../contexts/AuthContext";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MessageSquare,
  PhoneOff,
  Send,
  Users,
} from "lucide-react";

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { peer, createOffer, createAnswer, setRemoteAns, sendStream, remoteStream } = usePeer();
  const { user } = useAuth();

  // States
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [localStream, setLocalStream] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [userName, setUserName] = useState(user?.name || "Anonymous");

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatEndRef = useRef(null);

  // Get user media
  const getUserMediaStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast.error("Failed to access camera/microphone");
    }
  }, []);

  // Socket Handlers
  const handleNewUserJoined = useCallback(
    async ({ name, socketId }) => {
      console.log("👤 New user joined:", name);
      setParticipants((prev) => [...prev, { name, socketId }]);
      toast(`${name} joined the meeting`, { icon: "👋" });

      const offer = await createOffer();
      socket.emit("call-user", { socketId, offer });
    },
    [createOffer, socket]
  );

  const handleIncomingCall = useCallback(
    async ({ from, offer, fromName }) => {
      console.log("📞 Incoming call from:", fromName);
      const answer = await createAnswer(offer);
      socket.emit("call-accepted", { socketId: from, ans: answer });
    },
    [createAnswer, socket]
  );

  const handleCallAccepted = useCallback(
    async ({ ans }) => {
      await setRemoteAns(ans);
    },
    [setRemoteAns]
  );

  const handleUserLeft = useCallback(({ socketId, name }) => {
    console.log("👋 User left:", name);
    setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
    toast(`${name} left the meeting`);
  }, []);

  const handleMessageReceived = useCallback(({ message, from, timestamp }) => {
    setMessages((prev) => [...prev, { message, from, timestamp, isOwn: false }]);
  }, []);

  // Join room on mount
  useEffect(() => {
    const name = user?.name || "Anonymous";
    setUserName(name);
    getUserMediaStream().then((stream) => {
      if (stream) sendStream(stream);
    });

    if (socket && roomId && name) {
      socket.emit("join-room", { name, roomId });
    }

    socket.on("user-joined", handleNewUserJoined);
    socket.on("incomming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("user-left", handleUserLeft);
    socket.on("chat-message", handleMessageReceived);

    return () => {
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incomming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("user-left", handleUserLeft);
      socket.off("chat-message", handleMessageReceived);
    };
  }, [socket, handleNewUserJoined, handleIncomingCall, handleCallAccepted, handleUserLeft, handleMessageReceived, getUserMediaStream, sendStream, roomId, user]);

  // Remote stream update
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Handlers
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const sendMessage = () => {
    if (inputMessage.trim()) {
      const message = {
        message: inputMessage.trim(),
        from: userName,
        timestamp: new Date().toISOString(),
      };
      socket.emit("chat-message", { roomId, ...message });
      setMessages((prev) => [...prev, { ...message, isOwn: true }]);
      setInputMessage("");
    }
  };

  const leave = () => {
    if (localStream) localStream.getTracks().forEach((track) => track.stop());
    socket.emit("leave-room", { roomId });
    navigate("/home");
  };

  // JSX
  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      <Toaster position="top-right" />
      <header className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="text-white">Room: {roomId}</div>
        <div className="text-white flex items-center">
          <Users size={16} className="mr-1" /> {participants.length + 1} participants
        </div>
      </header>

      <div className="flex-1 flex">
        <div className="flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {/* Local Video */}
            <div className="bg-gray-800 rounded overflow-hidden relative">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                {userName} (You)
              </div>
            </div>

            {/* Remote Video */}
            <div className="bg-gray-800 rounded overflow-hidden relative">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              {participants.length > 0 && (
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  {participants[0]?.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700 text-white font-medium">Chat</div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, index) => (
                <div key={index} className={msg.isOwn ? "text-right" : "text-left"}>
                  <div
                    className={`inline-block max-w-xs px-3 py-2 rounded-lg text-sm ${
                      msg.isOwn ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200"
                    }`}
                  >
                    {!msg.isOwn && <div className="font-medium text-xs opacity-75 mb-1">{msg.from}</div>}
                    <div>{msg.message}</div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-gray-700 flex space-x-2">
              <input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded"
                placeholder="Type a message..."
              />
              <button onClick={sendMessage} className="bg-blue-600 px-3 py-2 rounded text-white">
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="bg-gray-800 p-3 flex items-center justify-center space-x-4">
        <button onClick={toggleAudio} className="p-3 rounded bg-gray-700 text-white">
          {isAudioEnabled ? <Mic /> : <MicOff />}
        </button>
        <button onClick={toggleVideo} className="p-3 rounded bg-gray-700 text-white">
          {isVideoEnabled ? <Video /> : <VideoOff />}
        </button>
        <button onClick={() => setShowChat((s) => !s)} className="p-3 rounded bg-gray-700 text-white">
          <MessageSquare />
        </button>
        <button onClick={leave} className="p-3 rounded bg-red-600 text-white">
          <PhoneOff />
        </button>
      </div>
    </div>
  );
};

export default Room;
