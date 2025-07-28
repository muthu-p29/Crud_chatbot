import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Chatbot from './components/chatbot.jsx';
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
