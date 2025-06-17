import React, { useEffect, useCallback, useState, useRef } from "react";
import { useSocket } from "../providers/Socket";
import { usePeer } from "../providers/Peer";

const RoomPage = () => {
    const { socket } = useSocket();
    const { peer, createOffer, createAnswer, setRemoteAns, sendStream, remoteStream } = usePeer();

    const [myStream, setMyStream] = useState(null);
    const [remoteEmailId, setRemoteEmailId] = useState(null);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const getUserMediaStream = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setMyStream(stream);
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }
    }, []);

    const handleNewUserJoined = useCallback(async ({ emailId }) => {
        console.log("👤 New user joined:", emailId);
        const offer = await createOffer();
        socket.emit("call-user", { emailId, offer });
        setRemoteEmailId(emailId);
    }, [createOffer, socket]);

    const handleIncomingCall = useCallback(async ({ from, offer }) => {
        console.log("📞 Incoming call from:", from);
        const answer = await createAnswer(offer);
        socket.emit("call-accepted", { emailId: from, ans: answer });
        setRemoteEmailId(from);
    }, [createAnswer, socket]);

    const handleCallAccepted = useCallback(async ({ ans }) => {
        console.log("✅ Call accepted");
        await setRemoteAns(ans);
    }, [setRemoteAns]);

    const handleNegotiationNeeded = useCallback(async () => {
        if (!remoteEmailId) return;
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("call-user", { emailId: remoteEmailId, offer });
    }, [peer, remoteEmailId, socket]);

    useEffect(() => {
        getUserMediaStream();
    }, [getUserMediaStream]);

    useEffect(() => {
        peer.addEventListener("negotiationneeded", handleNegotiationNeeded);
        return () => peer.removeEventListener("negotiationneeded", handleNegotiationNeeded);
    }, [handleNegotiationNeeded]);

    useEffect(() => {
        socket.on("user-joined", handleNewUserJoined);
        socket.on("incomming-call", handleIncomingCall);
        socket.on("call-accepted", handleCallAccepted);

        return () => {
            socket.off("user-joined", handleNewUserJoined);
            socket.off("incomming-call", handleIncomingCall);
            socket.off("call-accepted", handleCallAccepted);
        };
    }, [handleIncomingCall, handleCallAccepted, handleNewUserJoined, socket]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    return (
        <div className="room-page-container">
            <h1>Room Page</h1>
            <h4>You are connected to: {remoteEmailId || "Waiting..."}</h4>
            <button onClick={() => sendStream(myStream)}>Share My Video</button>

            <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
                <div>
                    <h5>📹 My Video</h5>
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: "400px", height: "300px", border: "2px solid black" }}
                    />
                </div>
                <div>
                    <h5>🎥 Remote Video</h5>
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        style={{ width: "400px", height: "300px", border: "2px solid black" }}
                    />
                </div>
            </div>
        </div>
    );
};

export default RoomPage;
