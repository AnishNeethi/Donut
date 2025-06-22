import React, { useState, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import Sidebar from './Sidebar';
import HamburgerMenu from './HamburgerMenu';

const AuthPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentView, setCurrentView] = useState('login'); // login, register, upload, history
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null); // Will hold the result temporarily
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [isIngredientPopupOpen, setIsIngredientPopupOpen] = useState(false);
  const [ingredientData, setIngredientData] = useState(null);
  const [ingredientLoading, setIngredientLoading] = useState(false);
  const [ingredientError, setIngredientError] = useState(null);
  const [timePeriod, setTimePeriod] = useState('7d'); // New state for time filter
  const [stats, setStats] = useState({ consumed: { calories: 0, sugar: 0 }, saved: { calories: 0, sugar: 0 } }); // New state for stats
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const API_BASE = 'https://donut-backend-o6ef.onrender.com';

  useEffect(() => {
    if (token) {
      setIsLoggedIn(true);
    }
  }, [token]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(''); // Clear previous messages
    try {
      const requestBody = { email, password };
      console.log('Sending registration request:', { email, password: '***' });
      
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
        setCurrentView('login');
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

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setCurrentView('login');
    setMessage('');
    setAnalysisResult(null);
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
    setMessage('Compressing image...');

    const options = {
      maxSizeMB: 0.07,
      maxWidthOrHeight: 512,
      useWebWorker: true,
      fileType: 'image/jpeg',
    };

    try {
      const compressedFile = await imageCompression(selectedFile, options);
      setMessage('Uploading compressed image...');

      const formData = new FormData();
      formData.append('file', compressedFile, selectedFile.name); // Use original name

      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAnalysisResult(data); // Store result object, not string
        setMessage('Analysis complete. How would you like to log this?');
      } else {
        setMessage(data.error || 'Upload failed');
        setAnalysisResult(null);
      }
    } catch (error) {
      console.error('Compression or Upload Error:', error);
      setMessage('An error occurred during compression or upload.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToHistory = async (consumed) => {
    if (!analysisResult || !selectedFile) return;
    
    setLoading(true);
    setMessage('Saving to history...');

    try {
        const response = await fetch(`${API_BASE}/save-analysis`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                filename: selectedFile.name,
                analysis: analysisResult,
                consumed: consumed,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            setMessage('Successfully saved to history!');
        } else {
            setMessage(data.detail || 'Failed to save to history.');
        }
    } catch (error) {
        setMessage('An error occurred while saving.');
    } finally {
        setLoading(false);
        setAnalysisResult(null); // Reset after saving
        setSelectedFile(null);
    }
  };

  const handleDontSave = () => {
    setAnalysisResult(null);
    setSelectedFile(null);
    setMessage('Analysis discarded.');
  }

  const handleGetHistory = async (period = '7d') => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/history?period=${period}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setHistory(data);
        calculateStats(data); // Calculate stats after fetching
        setMessage('History loaded successfully!');
      } else {
        setMessage(data.error || 'Failed to load history');
      }
    } catch (error) {
      setMessage('Error loading history');
    }
    setLoading(false);
  };

  const calculateStats = (historyData) => {
    const newStats = {
        consumed: { calories: 0, sugar: 0 },
        saved: { calories: 0, sugar: 0 }
    };

    historyData.forEach(item => {
        const calories = parseInt(item.analysis?.nutrition_data?.calories) || 0;
        const sugar = parseInt(item.analysis?.nutrition_data?.sugar) || 0;

        if (item.consumed) {
            newStats.consumed.calories += calories;
            newStats.consumed.sugar += sugar;
        } else if (item.consumed === false) {
            newStats.saved.calories += calories;
            newStats.saved.sugar += sugar;
        }
    });

    setStats(newStats);
  };
  
  useEffect(() => {
    if (isLoggedIn && currentView === 'history') {
        handleGetHistory(timePeriod);
    }
  }, [isLoggedIn, currentView, timePeriod]);

  const handleIngredientClick = (ingredient) => {
    setSelectedIngredient(ingredient);
    setIsIngredientPopupOpen(true);
    fetchIngredientData(ingredient);
  };

  const closeIngredientPopup = () => {
    setIsIngredientPopupOpen(false);
    setSelectedIngredient(null);
    setIngredientData(null);
    setIngredientError(null);
  };

  const fetchIngredientData = async (ingredient) => {
    setIngredientLoading(true);
    setIngredientError(null);
    
    try {
      const response = await fetch(`${API_BASE}/analyze-ingredient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ingredient_name: ingredient }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIngredientData(data);
      } else {
        setIngredientError(data.detail || 'Failed to analyze ingredient');
      }
    } catch (error) {
      setIngredientError('Error analyzing ingredient');
    }
    
    setIngredientLoading(false);
  };

  const renderAnalysisResult = (result) => {
    if (typeof result === 'string') {
      try {
        result = JSON.parse(result);
      } catch (e) {
        return <pre style={{ backgroundColor: '#000000', color: '#ffffff', border: '1px solid #ffffff', padding: '10px', overflow: 'auto' }}>
          {result}
        </pre>;
      }
    }

    return (
      <div style={{ backgroundColor: '#000000', color: '#ffffff', border: '1px solid #ffffff', padding: '15px', borderRadius: '5px' }}>
        <h4 style={{ color: '#ff6b6b', marginTop: 0 }}>Food: {result.food_name}</h4>
        
        <div style={{ marginBottom: '20px' }}>
          <h5 style={{ color: '#4ecdc4' }}>Nutrition Data:</h5>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {result.nutrition_data && Object.entries(result.nutrition_data).map(([key, value]) => (
              <div key={key} style={{ backgroundColor: '#1a1a1a', padding: '8px', borderRadius: '3px' }}>
                <strong>{key.replace(/_/g, ' ').toUpperCase()}:</strong> {value}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h5 style={{ color: '#4ecdc4' }}>Ingredients:</h5>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {result.ingredients && result.ingredients.map((ingredient, index) => (
              <button
                key={index}
                onClick={() => handleIngredientClick(ingredient)}
                style={{
                  backgroundColor: '#2a2a2a',
                  color: '#ffffff',
                  border: '1px solid #4ecdc4',
                  padding: '5px 10px',
                  borderRadius: '15px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#4ecdc4';
                  e.target.style.color = '#000000';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#2a2a2a';
                  e.target.style.color = '#ffffff';
                }}
              >
                {ingredient}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
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
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#000000' }}>
            {message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Hamburger Menu Button */}
      <HamburgerMenu isOpen={isMenuOpen} onClick={() => setIsMenuOpen(!isMenuOpen)} />

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
            handleGetHistory(timePeriod);
          }}
          style={{ padding: '5px 10px' }}
        >
          View History
        </button>
      </div>

      {currentView === 'upload' && (
        <div>
          <h3>Upload and Analyze Image</h3>
          
          {!analysisResult ? (
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
          ) : (
            <div style={{ marginTop: '20px' }}>
              {renderAnalysisResult(analysisResult)}
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button onClick={() => handleSaveToHistory(true)} disabled={loading} style={{ padding: '10px', backgroundColor: '#28a745' }}>Eaten</button>
                <button onClick={() => handleSaveToHistory(false)} disabled={loading} style={{ padding: '10px', backgroundColor: '#ffc107' }}>Not Eaten</button>
                <button onClick={handleDontSave} disabled={loading} style={{ padding: '10px', backgroundColor: '#6c757d' }}>Don't Add to History</button>
              </div>
            </div>
          )}
        </div>
      )}

      {currentView === 'history' && (
        <div>
          <h3>Analysis History</h3>
          
          <div style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
            <button onClick={() => setTimePeriod('7d')} disabled={loading} style={{ padding: '8px 12px', backgroundColor: timePeriod === '7d' ? '#007bff' : '#6c757d' }}>Last 7 Days</button>
            <button onClick={() => setTimePeriod('1m')} disabled={loading} style={{ padding: '8px 12px', backgroundColor: timePeriod === '1m' ? '#007bff' : '#6c757d' }}>Last Month</button>
            <button onClick={() => setTimePeriod('1y')} disabled={loading} style={{ padding: '8px 12px', backgroundColor: timePeriod === '1y' ? '#007bff' : '#6c757d' }}>Last Year</button>
            <button onClick={() => setTimePeriod('all')} disabled={loading} style={{ padding: '8px 12px', backgroundColor: timePeriod === 'all' ? '#007bff' : '#6c757d' }}>All Time</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            <div style={{ padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
                <h4 style={{ color: '#28a745', marginTop: 0 }}>Consumed</h4>
                <p>Calories: {stats.consumed.calories} kcal</p>
                <p>Sugar: {stats.consumed.sugar} g</p>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
                <h4 style={{ color: '#ffc107', marginTop: 0 }}>Saved</h4>
                <p>Calories: {stats.saved.calories} kcal</p>
                <p>Sugar: {stats.saved.sugar} g</p>
            </div>
          </div>

          {loading ? (
            <p>Loading history...</p>
          ) : (
            <div>
              {history.length === 0 ? (
                <p>No analysis history found.</p>
              ) : (
                history.map((item, index) => (
                  <div key={index} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{marginBottom: '5px'}}>File: {item.filename}</h4>
                        <small>{new Date(item.timestamp).toLocaleString()}</small>
                      </div>
                      <span style={{
                        padding: '5px 10px',
                        borderRadius: '15px',
                        color: 'white',
                        backgroundColor: item.consumed ? '#28a745' : (item.consumed === false ? '#ffc107' : '#6c757d')
                      }}>
                        {item.consumed ? 'Eaten' : (item.consumed === false ? 'Not Eaten' : 'N/A')}
                      </span>
                    </div>
                    {renderAnalysisResult(JSON.stringify(item.analysis, null, 2))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {message && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#000000' }}>
          {message}
        </div>
      )}

      {/* Sidebar */}
      <Sidebar 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        onHomeClick={() => {}} // Empty function since this page doesn't need custom home handling
      />

      {/* Ingredient Popup */}
      {isIngredientPopupOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            color: '#ffffff',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '2px solid #333',
            position: 'relative',
            boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
          }}>
            <button
              onClick={closeIngredientPopup}
              style={{
                position: 'absolute',
                top: '10px',
                right: '15px',
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '5px',
              }}
            >
              ×
            </button>

            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#ff6b6b' }}>
              {selectedIngredient}
            </h2>

            {ingredientLoading && <p>Analyzing ingredient...</p>}

            {ingredientError && <p style={{ color: '#ff4444' }}>Error: {ingredientError}</p>}

            {ingredientData && (
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <h3 style={{ color: '#4ecdc4', marginBottom: '5px' }}>Pronunciation</h3>
                  <p style={{ margin: 0, fontSize: '18px', fontStyle: 'italic' }}>
                    {ingredientData.pronunciation}
                  </p>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <h3 style={{ color: '#4ecdc4', marginBottom: '5px' }}>Purpose</h3>
                  <p style={{ margin: 0 }}>{ingredientData.purpose}</p>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <h3 style={{ color: '#4ecdc4', marginBottom: '5px' }}>Commonly Found In</h3>
                  <p style={{ margin: 0 }}>{ingredientData.commonly_found_in}</p>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <h3 style={{ color: '#4ecdc4', marginBottom: '5px' }}>Origin</h3>
                  <p style={{ margin: 0 }}>{ingredientData.natural_or_synthetic}</p>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <h3 style={{ color: '#4ecdc4', marginBottom: '5px' }}>Safety Status</h3>
                  <p style={{ margin: 0 }}>{ingredientData.safety_status}</p>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <h3 style={{ color: '#4ecdc4', marginBottom: '5px' }}>Health Concerns</h3>
                  <p style={{ margin: 0 }}>{ingredientData.health_concerns}</p>
                </div>

                <div>
                  <h3 style={{ color: '#4ecdc4', marginBottom: '5px' }}>Recommended Intake</h3>
                  <p style={{ margin: 0 }}>{ingredientData.recommended_intake}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage; 