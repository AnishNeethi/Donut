import React, { useState, useEffect } from 'react';

const AuthPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentView, setCurrentView] = useState('login'); // login, register, upload, history
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = 'https://donut-backend-o6ef.onrender.com';

  useEffect(() => {
    if (token) {
      setIsLoggedIn(true);
    }
  }, [token]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('Registration successful! Please login.');
        setCurrentView('login');
      } else {
        setMessage(data.detail || 'Registration failed');
      }
    } catch (error) {
      setMessage('Error during registration');
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setToken(data.access_token);
        localStorage.setItem('token', data.access_token);
        setIsLoggedIn(true);
        setMessage('Login successful!');
        setCurrentView('upload');
      } else {
        setMessage(data.detail || 'Login failed');
      }
    } catch (error) {
      setMessage('Error during login');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setCurrentView('login');
    setMessage('');
  };

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage('Please select a file');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAnalysisResult(JSON.stringify(data, null, 2));
        setMessage('Image analyzed successfully!');
      } else {
        setMessage(data.error || 'Upload failed');
      }
    } catch (error) {
      setMessage('Error during upload');
    }
    setLoading(false);
  };

  const handleGetHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setHistory(data);
        setMessage('History loaded successfully!');
      } else {
        setMessage(data.error || 'Failed to load history');
      }
    } catch (error) {
      setMessage('Error loading history');
    }
    setLoading(false);
  };

  if (!isLoggedIn) {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
        <h2>{currentView === 'login' ? 'Login' : 'Register'}</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={() => setCurrentView('login')}
            style={{ marginRight: '10px', padding: '5px 10px' }}
          >
            Login
          </button>
          <button 
            onClick={() => setCurrentView('register')}
            style={{ padding: '5px 10px' }}
          >
            Register
          </button>
        </div>

        <form onSubmit={currentView === 'login' ? handleLogin : handleRegister}>
          <div style={{ marginBottom: '10px' }}>
            <label>Email:</label><br />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '5px' }}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label>Password:</label><br />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '5px' }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '10px' }}
          >
            {loading ? 'Loading...' : (currentView === 'login' ? 'Login' : 'Register')}
          </button>
        </form>

        {message && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0' }}>
            {message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Image Analysis Dashboard</h2>
        <button onClick={handleLogout} style={{ padding: '5px 10px' }}>
          Logout
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setCurrentView('upload')}
          style={{ marginRight: '10px', padding: '5px 10px' }}
        >
          Upload Image
        </button>
        <button 
          onClick={() => {
            setCurrentView('history');
            handleGetHistory();
          }}
          style={{ padding: '5px 10px' }}
        >
          View History
        </button>
      </div>

      {currentView === 'upload' && (
        <div>
          <h3>Upload and Analyze Image</h3>
          <form onSubmit={handleUpload}>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ marginBottom: '10px' }}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || !selectedFile}
              style={{ padding: '10px' }}
            >
              {loading ? 'Analyzing...' : 'Upload and Analyze'}
            </button>
          </form>

          {analysisResult && (
            <div style={{ marginTop: '20px' }}>
              <h4>Analysis Result:</h4>
              <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
                {analysisResult}
              </pre>
            </div>
          )}
        </div>
      )}

      {currentView === 'history' && (
        <div>
          <h3>Analysis History</h3>
          {loading ? (
            <p>Loading history...</p>
          ) : (
            <div>
              {history.length === 0 ? (
                <p>No analysis history found.</p>
              ) : (
                history.map((item, index) => (
                  <div key={index} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
                    <h4>File: {item.filename}</h4>
                    <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
                      {JSON.stringify(item.analysis, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {message && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0' }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AuthPage; 