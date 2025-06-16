import { Routes, Route} from "react-router-dom";
import "./App.css";
import { SocketProvider } from "./providers/Socket";

import Homepage from "./pages/Home";
import RoomPage from "./pages/Room";


function App() {
  return (
    <div className="App">
      <SocketProvider>
      <Routes>
          <Route path="/" element={<Homepage />} /> 
          <Route path="/room/:roomId" element={<RoomPage/>}  /> 
      </Routes>
      </SocketProvider>

    </div>
  );
}

export default App;
