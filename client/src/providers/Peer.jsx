import React, {useMemo} from "react";

const PeerContext = React.createContext(null);

export const PeerProvider = (props) =>{
    const peer = useMemo(
        () =>
        new RTCPeerConnection({
            iceServers:[
                {
                    urls:[
                        "stun:stun.l.google.com:19302",
                        "stun:global.stun.twilio.com:3478",
                    ],
                },
            ],
       }),
   []
 );

return (
    <PeerContext.Provider value ={{ }}>{props.children}</PeerContext.Provider>
    );
};

