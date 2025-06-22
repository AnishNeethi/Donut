import React, { useState } from 'react';
import './AuthModal.css';

const AuthModal = ({ onClose, analysisData }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_BASE = 'http://127.0.0.1:8000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const endpoint = isLogin ? '/login' : '/register';
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (isLogin) {
          // Save token and save analysis data
          localStorage.setItem('token', data.access_token);
          await saveAnalysisData(data.access_token);
        } else {
          setMessage('registration successful! please login to save your data.');
          setIsLogin(true);
        }
      } else {
        setMessage(data.detail || `${isLogin ? 'login' : 'registration'} failed`);
      }
    } catch (error) {
      setMessage(`Error during ${isLogin ? 'login' : 'registration'}`);
    }
    setLoading(false);
  };

  const saveAnalysisData = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/save-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: 'food-analysis.jpg',
          analysis: analysisData,
          consumed: true, // Default to consumed
        }),
      });

      if (response.ok) {
        setMessage('analysis saved successfully!');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setMessage('failed to save analysis data');
      }
    } catch (error) {
      setMessage('error saving analysis data');
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <div className="auth-modal-header">
          <h2>{isLogin ? 'login' : 'sign up'}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="auth-modal-content">
          <p className="auth-prompt">
            {isLogin 
              ? 'login to save your food analysis to your health profile' 
              : 'create an account to track your nutrition over time'
            }
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">email:</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="enter your email"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">password:</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="enter your password"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="auth-submit-btn"
            >
              {loading ? 'processing...' : (isLogin ? 'login & save' : 'sign up')}
            </button>
          </form>

          <div className="auth-switch">
            <p>
              {isLogin ? "don't have an account? " : "already have an account? "}
              <button 
                type="button"
                className="switch-btn"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'sign up' : 'login'}
              </button>
            </p>
          </div>

          {message && (
            <div className={`auth-message ${message.includes('successful') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;