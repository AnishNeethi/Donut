import React, { useState, useEffect } from 'react';
import imageCompression from 'browser-image-compression';

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
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [isIngredientPopupOpen, setIsIngredientPopupOpen] = useState(false);
  const [ingredientData, setIngredientData] = useState(null);
  const [ingredientLoading, setIngredientLoading] = useState(false);
  const [ingredientError, setIngredientError] = useState(null);

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
    setMessage('Compressing image...');

    const options = {
      maxSizeMB: 0.07, // Aim for ~70KB
      maxWidthOrHeight: 512, // Resize to a max of 512px
      useWebWorker: true,
      fileType: 'image/jpeg',
    };

    try {
      const compressedFile = await imageCompression(selectedFile, options);
      setMessage('Uploading compressed image...');

      const formData = new FormData();
      // Important: use the compressed file and give it a name
      formData.append('file', compressedFile, compressedFile.name);

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
      console.error('Compression or Upload Error:', error);
      setMessage('An error occurred during compression or upload.');
    } finally {
      setLoading(false);
    }
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
              {renderAnalysisResult(analysisResult)}
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
            maxHeight: '80vh',
            overflow: 'auto',
            border: '2px solid #333',
            position: 'relative',
          }}>
            {/* Close button */}
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

            {ingredientLoading && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>Analyzing ingredient...</p>
              </div>
            )}

            {ingredientError && (
              <div style={{ 
                backgroundColor: '#ff4444', 
                color: '#ffffff', 
                padding: '10px', 
                borderRadius: '5px',
                marginBottom: '15px'
              }}>
                {ingredientError}
              </div>
            )}

            {ingredientData && (
              <div>
                {/* Pronunciation */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#4ecdc4', marginBottom: '5px' }}>Pronunciation</h3>
                  <p style={{ fontSize: '18px', fontStyle: 'italic' }}>
                    {ingredientData.pronunciation}
                  </p>
                </div>

                {/* Common Products */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#4ecdc4', marginBottom: '10px' }}>Common Products</h3>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {ingredientData.common_products.map((product, index) => (
                      <li key={index} style={{ marginBottom: '5px' }}>{product}</li>
                    ))}
                  </ul>
                </div>

                {/* Health Consensus */}
                <div>
                  <h3 style={{ color: '#4ecdc4', marginBottom: '10px' }}>Health Consensus</h3>
                  <div style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '5px' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>Safety:</strong> 
                      <span style={{ 
                        color: ingredientData.health_consensus.safety === 'safe' ? '#4caf50' : 
                               ingredientData.health_consensus.safety === 'unsafe' ? '#f44336' : '#ff9800',
                        marginLeft: '10px'
                      }}>
                        {ingredientData.health_consensus.safety}
                      </span>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>Healthiness:</strong> 
                      <span style={{ 
                        color: ingredientData.health_consensus.healthiness === 'healthy' ? '#4caf50' : 
                               ingredientData.health_consensus.healthiness === 'unhealthy' ? '#f44336' : '#ff9800',
                        marginLeft: '10px'
                      }}>
                        {ingredientData.health_consensus.healthiness}
                      </span>
                    </div>
                    {ingredientData.health_consensus.notes && (
                      <div style={{ marginBottom: '10px' }}>
                        <strong>Notes:</strong> {ingredientData.health_consensus.notes}
                      </div>
                    )}
                    <div>
                      <strong>Recommendation:</strong> {ingredientData.health_consensus.recommendation}
                    </div>
                  </div>
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