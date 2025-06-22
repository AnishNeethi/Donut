import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from './components/Landing'
import HistoryPage from './components/HistoryPage'
import AuthPage from './components/AuthPage'
import ProfilePage from './components/ProfilePage'
import PronunciationPlayer from './components/PronunciationPlayer'
import './App.css'

// A temporary component for the test route
const PronunciationTestPage = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [email, setEmail] = useState('test@test.com'); // Default for convenience
  const [password, setPassword] = useState('password'); // Default for convenience
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        setMessage('Login successful!');
      } else {
        setMessage(data.detail || 'Login failed');
      }
    } catch (error) {
      setMessage('An error occurred during login.');
    }
  };

  if (!token) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#FFB6C1', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Login to Test Pronunciation</h1>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
          <button type="submit" style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: 'black', color: 'white', cursor: 'pointer' }}>Login</button>
        </form>
        {message && <p style={{ marginTop: '20px', color: message.includes('successful') ? 'green' : 'red' }}>{message}</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#FFB6C1', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Pronunciation Test</h1>
      <PronunciationPlayer ingredientName="Sodium Benzoate" healthRating={25} />
      <PronunciationPlayer ingredientName="Monosodium Glutamate" healthRating={45} />
      <PronunciationPlayer ingredientName="Aspartame" healthRating={15} />
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/test-pronunciation" element={<PronunciationTestPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
