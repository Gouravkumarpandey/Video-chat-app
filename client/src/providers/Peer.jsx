import React, { useMemo, useEffect, useState, useCallback } from "react";

const PeerContext = React.createContext(null);
export const usePeer = () => React.useContext(PeerContext);

export const PeerProvider = (props) => {
    const [remoteStream, setRemoteStream] = useState(null);
    const [hasSentStream, setHasSentStream] = useState(false);

    const peer = useMemo(() => new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:global.stun.twilio.com:3478"
                ]
            }
        ]
    }), []);

    const createOffer = async () => {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        return offer;
    };

    const createAnswer = async (offer) => {
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        return answer;
    };

    const setRemoteAns = async (ans) => {
        await peer.setRemoteDescription(new RTCSessionDescription(ans));
    };

    const sendStream = async (stream) => {
        if (hasSentStream) return;
        console.log("📤 Sending stream to peer");
        stream.getTracks().forEach(track => peer.addTrack(track, stream));
        setHasSentStream(true);
    };

    const handleTrackEvent = useCallback((event) => {
        console.log("🎥 Receiving remote stream");
        setRemoteStream(event.streams[0]);
    }, []);

    useEffect(() => {
        peer.addEventListener("track", handleTrackEvent);
        return () => peer.removeEventListener("track", handleTrackEvent);
    }, [handleTrackEvent, peer]);

    return (
        <PeerContext.Provider value={{
            peer, createOffer, createAnswer, setRemoteAns, sendStream, remoteStream
        }}>
            {props.children}
        </PeerContext.Provider>
    );
};
