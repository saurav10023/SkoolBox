import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../src/Home/Home";
import UniformDetail from "../src/Home/UniformDetails";
import BagDetail from "./Home/BagDetails";

function App() {
  return (
    <BrowserRouter>

      <Routes>
        
        <Route path="/" element={<Home/>} />
        <Route path="/uniform/:id" element={<UniformDetail />} />
        <Route path="/bag/:id" element={<BagDetail />} />
        

      </Routes>

    </BrowserRouter>
  );
}

export default App;