import React, { useState } from 'react';
import './LoginRegisterModal.css';

const LoginRegisterModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_BASE = 'https://donut-backend-o6ef.onrender.com';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const requestBody = { email: formData.email, password: formData.password };
      console.log('Sending registration request:', { email: formData.email, password: '***' });
      
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('Registration response status:', response.status);
      
      const data = await response.json();
      console.log('Registration response data:', data);
      
      if (response.ok) {
        setMessage('Registration successful! Please login.');
        setActiveTab('login');
        setFormData({ email: '', password: '' });
      } else {
        // Handle different types of error responses
        let errorMessage = 'Registration failed';
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map(err => err.msg || err.message || JSON.stringify(err)).join(', ');
          } else if (typeof data.detail === 'object') {
            errorMessage = JSON.stringify(data.detail);
          }
        }
        setMessage(`${errorMessage} (${response.status})`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage(`Error during registration: ${error.message}`);
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store token and user info
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('username', formData.email); // Using email as username for now
        
        setMessage('Login successful!');
        
        // Call the success callback if provided
        if (onLoginSuccess) {
          onLoginSuccess(data.access_token, formData.email);
        }
        
        // Close modal after a short delay
        setTimeout(() => {
          onClose();
          setFormData({ email: '', password: '' });
          setMessage('');
        }, 1000);
      } else {
        // Handle different types of error responses
        let errorMessage = 'Login failed';
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map(err => err.msg || err.message || JSON.stringify(err)).join(', ');
          } else if (typeof data.detail === 'object') {
            errorMessage = JSON.stringify(data.detail);
          }
        }
        setMessage(`${errorMessage} (${response.status})`);
      }
    } catch (error) {
      setMessage(`Error during login: ${error.message}`);
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    if (activeTab === 'login') {
      handleLogin(e);
    } else {
      handleRegister(e);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFormData({
      email: '',
      password: ''
    });
    setMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
        
        <div className="modal-header">
          <div className="tab-buttons">
            <button 
              className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => handleTabChange('login')}
            >
              Login
            </button>
            <button 
              className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => handleTabChange('register')}
            >
              Register
            </button>
          </div>
        </div>

        <div className="modal-body">
          {message && (
            <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
          
          {activeTab === 'login' ? (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <input
                  type="email"
                  id="login-email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <input
                  type="password"
                  id="login-password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
              
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-group">
                <label htmlFor="register-email">Email</label>
                <input
                  type="email"
                  id="register-email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="register-password">Password</label>
                <input
                  type="password"
                  id="register-password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
              
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginRegisterModal; 