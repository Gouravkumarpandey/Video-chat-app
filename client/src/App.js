import { Routes, Route} from "react-router-dom";
import "./App.css";
import { SocketProvider } from "./providers/Socket";
import Homepage from "./pages/Home";



function App() {
  return (
    <div className="App">
      <SocketProvider>
      <Routes>
          <Route path="/" element={<Homepage />} /> 
      </Routes>
      </SocketProvider>

    </div>
  );
}

export default App;
