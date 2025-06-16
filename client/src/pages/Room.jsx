import React, { useEffect } from 'react';
import {} from "../providers/Socket";
import { useSocket } from "../providers/Socket";

const RoomPage =() =>{
    const { socket } = useSocket ();

    const handleNewUserJoined =(data) =>{
        const {emailId} = data 
        console.log('New user joined the room',emailId );


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