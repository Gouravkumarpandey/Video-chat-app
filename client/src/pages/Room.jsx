import React, { useEffect, useCallback } from "react";
import { useSocket } from "../providers/Socket";
import {usePeer} from "../providers/Peer";

const RoomPage =() =>{
    const { socket } = useSocket ();
    const {peer, createOffer, createAnswere, setRemoteAns} = usePeer();

    const handleNewUserJoined =useCallback (async(data) =>{
        const {emailId} = data 
        console.log('New user joined the room',emailId );
        const offer = await createOffer();
        socket.emit('call-user',{ emailId, offer});
},
[createOffer, socket]
);

    const handleIncommingCall = useCallback (async(data) =>{
        const {from, offer} = data
        console.log("Incomming Call from", from, offer);
        const ans = await createAnswere(offer);
        socket.emit("call-accepted",{ emailId: from, ans})
    },
    [createAnswere, socket]
);

 const handleCallAccepted = useCallback(async(data) =>{
    const {ans} = data
    console.log("Call got Accepted", ans);
    await setRemoteAns(ans)
 },[setRemoteAns]);

    useEffect (() =>{
        socket.on("user-joined", handleNewUserJoined);
        socket.on('incomming-call', handleIncommingCall);
        socket.on("call-accepted",handleCallAccepted );

        return () =>{
            socket.off("user-joined",handleNewUserJoined);
            socket.off("incomming-call", handleIncommingCall);
            socket.off("call-accepted", handleCallAccepted);
        };

    }, [handleIncommingCall, handleNewUserJoined,socket]);

    return (
        <div className='room-page-container'>
            <h1>Room Page</h1>
        </div>
    );
};

export default RoomPage;