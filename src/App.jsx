import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';


import Chatbot from './components/Chatbot.jsx';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
         <Route path="/" element={<Chatbot/>} />
      
      </Routes>
    </BrowserRouter>
  );
}

export default App;
