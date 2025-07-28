import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Chatbot from '../components/Chatbot.jsx'; // ✅ Correct path and case
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Chatbot />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
