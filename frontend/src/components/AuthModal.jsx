import React, { useState } from 'react';
import './AuthModal.css';

const AuthModal = ({ onClose, analysisData }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_BASE = 'https://donut-backend-o6ef.onrender.com';

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
          setMessage('Registration successful! Please login to save your data.');
          setIsLogin(true);
        }
      } else {
        setMessage(data.detail || `${isLogin ? 'Login' : 'Registration'} failed`);
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
        setMessage('Analysis saved successfully!');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setMessage('Failed to save analysis data');
      }
    } catch (error) {
      setMessage('Error saving analysis data');
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <div className="auth-modal-header">
          <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="auth-modal-content">
          <p className="auth-prompt">
            {isLogin 
              ? 'Login to save your food analysis to your health profile' 
              : 'Create an account to track your nutrition over time'
            }
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="auth-submit-btn"
            >
              {loading ? 'Processing...' : (isLogin ? 'Login & Save' : 'Sign Up')}
            </button>
          </form>

          <div className="auth-switch">
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                className="switch-btn"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Sign Up' : 'Login'}
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