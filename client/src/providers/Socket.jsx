import React, { useMemo } from "react";
import { io } from "socket.io-client";

const SocketContext = React.createContext(null);

export const useSocket = () => {
  return React.useContext(SocketContext);
};

<<<<<<< HEAD
export const SocketProvider = (props) =>{
    const socket = useMemo( ( )=>  io("http://localhost:8000"),  []);
    return(
        <SocketContext.Provider value={{socket}}  >
            {props.children}
        </SocketContext.Provider>
=======
export const SocketProvider = (props) => {
  const socket = useMemo(() => io("https://video-chat-app-bcyv.onrender.com", {
    transports: ["websocket"],
    reconnection: true,
    autoConnect: true,
  }), []);
>>>>>>> 3acab35b9e6419bb66c1c8c6b8a5a4a393f48272

  return (
    <SocketContext.Provider value={{ socket }}>
      {props.children}
    </SocketContext.Provider>
  );
};
