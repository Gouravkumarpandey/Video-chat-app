import React, { useEffect, useCallback, useState, useRef } from "react";
import { useSocket } from "../providers/Socket";
import { usePeer } from "../providers/Peer";
import "./RoomPage.css";

const RoomPage = () => {
  const { socket } = useSocket();
  const {
    peer,
    createOffer,
    createAnswer,
    setRemoteAns,
    sendStream,
    remoteStream,
  } = usePeer();

  const [myStream, setMyStream] = useState(null);
  const [remoteEmailId, setRemoteEmailId] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [isMyVideoMain, setIsMyVideoMain] = useState(true);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatEndRef = useRef(null);

  const getUserMediaStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setMyStream(stream);
    sendStream(stream);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  }, [sendStream]);

  const handleNewUserJoined = useCallback(
    async ({ emailId }) => {
      const offer = await createOffer();
      socket.emit("call-user", { emailId, offer });
      setRemoteEmailId(emailId);
    },
    [createOffer, socket]
  );

  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      const answer = await createAnswer(offer);
      socket.emit("call-accepted", { emailId: from, ans: answer });
      setRemoteEmailId(from);
    },
    [createAnswer, socket]
  );

  const handleCallAccepted = useCallback(
    async ({ ans }) => {
      await setRemoteAns(ans);
    },
    [setRemoteAns]
  );

  const handleNegotiationNeeded = useCallback(async () => {
    if (!remoteEmailId) return;
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit("call-user", { emailId: remoteEmailId, offer });
  }, [peer, remoteEmailId, socket]);

  const toggleMic = () => {
    if (!myStream) return;
    myStream.getAudioTracks().forEach((track) => {
      track.enabled = !micOn;
    });
    setMicOn((prev) => !prev);
  };

  const toggleCamera = () => {
    if (!myStream) return;
    myStream.getVideoTracks().forEach((track) => {
      track.enabled = !camOn;
    });
    setCamOn((prev) => !prev);
  };

  const endCall = () => {
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    socket.emit("end-call", { to: remoteEmailId });

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
