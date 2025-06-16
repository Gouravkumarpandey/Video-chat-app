import React, { useEffect } from 'react';
import { useSocket } from "../providers/Socket";
import {usePeer} from "../providers/Peer";

const RoomPage =() =>{
    const { socket } = useSocket ();
    const {peer, createOffer} = usePeer();

    const handleNewUserJoined = async(data) =>{
        const {emailId} = data 
        console.log('New user joined the room',emailId );
        const offer = await createOffer()

    }

    useEffect (() =>{
        socket.on('user-joined', handleNewUserJoined);
    }, [socket]);

    return (
        <div className='room-page-container'>
            <h1>Room Page</h1>
        </div>
    );
};

export default RoomPage;