import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CameraUpload from './CameraUpload';
import LoadingScreen from './LoadingScreen';
import HealthResults from './HealthResults';
import DonutScene from './DonutScene';
import AuthModal from './AuthModal';
import Sidebar from './Sidebar';
import HamburgerMenu from './HamburgerMenu';
import imageCompression from 'browser-image-compression';
import './Landing.css';
import { Link } from 'react-router-dom';

const Landing = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('landing'); // landing, upload, loading, results, donut-scene
  const [analysisData, setAnalysisData] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [titleVisible, setTitleVisible] = useState(true);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [buttonSlideOut, setButtonSlideOut] = useState(false);
  const [titleFadeOut, setTitleFadeOut] = useState(false);

  const API_BASE = 'https://donut-backend-o6ef.onrender.com';

  // Reset component state when navigating to home route
  useEffect(() => {
    if (location.pathname === '/') {
      resetToHomeState();
    }
  }, [location.pathname]);

  const resetToHomeState = () => {
    setCurrentView('landing');
    setTitleVisible(true);
    setAnalysisData(null);
    setSelectedFile(null);
    setMessage('');
    setButtonSlideOut(false);
    setTitleFadeOut(false);
    setLoading(false);
    setShowAuthModal(false);
    // Clear the file input to allow selecting the same file again
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCameraClick = () => {
    document.getElementById('fileInput').click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file && !loading) { // Prevent multiple uploads
      console.log('Selected file:', file);
      setSelectedFile(file);
      setButtonSlideOut(true);
      setTitleVisible(false); // Start title fade out
      
      // Wait for button animation to complete before starting upload
      setTimeout(() => {
        handleUploadStart();
      }, 500);
      
      // Use the same upload logic as AuthPage
      setLoading(true);
      setMessage('compressing image...');

      const options = {
        maxSizeMB: 0.07,
        maxWidthOrHeight: 512,
        useWebWorker: true,
        fileType: 'image/jpeg',
      };

      try {
        const compressedFile = await imageCompression(file, options);
        setMessage('analyzing your food...');

        const formData = new FormData();
        formData.append('file', compressedFile, file.name);

        const response = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setAnalysisData(data);
          handleUploadComplete(data);
        } else {
          setMessage(data.error || 'upload failed');
          handleUploadError(data.error || 'upload failed');
        }
      } catch (error) {
        console.error('Compression or Upload Error:', error);
        setMessage('an error occurred during compression or upload.');
        handleUploadError('an error occurred during compression or upload.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUploadStart = () => {
    setCurrentView('loading');
  };

  const handleUploadComplete = (data) => {
    setAnalysisData(data);
    setTitleFadeOut(true);
    setTimeout(() => {
      setCurrentView('donut-scene');
    }, 800); // Wait for fade out animation
  };

  const handleUploadError = (error) => {
    console.error('Upload error:', error);
    resetToHomeState();
  };

  const handleSaveData = () => {
    setShowAuthModal(true);
  };

  const handleViewDonutScene = () => {
    setTitleVisible(false);
    setTimeout(() => {
      setCurrentView('donut-scene');
    }, 500); // Wait for title animation
  };

  const handleBackToHome = () => {
    resetToHomeState();
  };

  const handleAnalyzeAnother = async (file) => {
    if (file && !loading) {
      console.log('Selected file:', file);
      setSelectedFile(file);
      setButtonSlideOut(true);
      setTitleVisible(false);
      
      // Wait for button animation to complete before starting upload
      setTimeout(() => {
        handleUploadStart();
      }, 500);
      
      setLoading(true);
      setMessage('compressing image...');

      const options = {
        maxSizeMB: 0.07,
        maxWidthOrHeight: 512,
        useWebWorker: true,
        fileType: 'image/jpeg',
      };

      try {
        const compressedFile = await imageCompression(file, options);
        setMessage('analyzing your food...');

        const formData = new FormData();
        formData.append('file', compressedFile, file.name);

        const response = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setAnalysisData(data);
          handleUploadComplete(data);
        } else {
          setMessage(data.error || 'upload failed');
          handleUploadError(data.error || 'upload failed');
        }
      } catch (error) {
        console.error('Compression or Upload Error:', error);
        setMessage('an error occurred during compression or upload.');
        handleUploadError('an error occurred during compression or upload.');
      } finally {
        setLoading(false);
      }
    }
  };

  const getSugarAmount = () => {
    if (!analysisData?.nutrition_data?.sugar) return 0;
    return parseInt(analysisData.nutrition_data.sugar) || 0;
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'upload':
        return (
          <CameraUpload
            onUploadStart={handleUploadStart}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />
        );
      
      case 'loading':
        return (
          <>
            {/* Main Content - transition title to loading message */}
            <div className="main-content">
              <h1 className={`app-title title-to-loading ${titleFadeOut ? 'fade-out' : ''}`}>
                {message || "analyzing your food..."}
              </h1>
            </div>
          </>
        );
      
      case 'results':
        return (
          <div className="results-container">
            <HealthResults
              analysisData={analysisData}
              onSaveData={handleSaveData}
              onBackToHome={handleBackToHome}
            />
            <div className="results-actions">
              <button className="action-btn" onClick={handleViewDonutScene}>
                view sugar visualization
              </button>
            </div>
          </div>
        );
      
      case 'donut-scene':
        return (
          <div className="donut-scene-fullscreen">
            {/* Donut falling section */}
            <div className="donut-falling-section">
              <DonutScene sugarCount={getSugarAmount()} />
              <div className="donut-overlay-info">
                <div className="sugar-info-floating">
                  <h3>sugar: {getSugarAmount()}g</h3>
                  <p>{Math.ceil(getSugarAmount() / 10)} donuts falling!</p>
                </div>
              </div>
              
              {/* Floating Action Panel */}
              <div className="floating-action-panel">
                <div className="action-panel-content">
                  <button 
                    className="panel-btn tertiary" 
                    onClick={() => {
                      const element = document.getElementById('detailed-results-section');
                      if (element) {
                        element.scrollIntoView({ 
                          behavior: 'smooth',
                          block: 'start'
                        });
                      }
                    }}
                  >
                    view detailed results
                  </button>
                </div>
              </div>
            </div>
            
            {/* Detailed results section below */}
            <div id="detailed-results-section" className="detailed-results-section">
              <div className="results-container">
                <HealthResults
                  analysisData={analysisData}
                  onSaveData={handleSaveData}
                  onBackToHome={handleBackToHome}
                />
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <>
            {/* Main Content */}
            <div className={`main-content ${!titleVisible ? 'title-fade-out' : ''}`}>
              <div className="title-container">
                <h1 className="app-title">donut</h1>
                <p className="app-subtitle">more than meets the label</p>
              </div>
            </div>

            {/* Camera Button */}
            <button className={`camera-button ${buttonSlideOut ? 'slide-out' : ''}`} onClick={handleCameraClick}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </button>
            <input
              type="file"
              id="fileInput"
              accept="image/*"
              onChange={(e) => handleAnalyzeAnother(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </>
        );
    }
  };

  return (
    <div className="landing-container">
      {/* Hidden file input */}
      <input 
        type="file" 
        id="fileInput" 
        accept="image/*" 
        style={{ display: 'none' }} 
        onChange={(e) => handleAnalyzeAnother(e.target.files[0])}
      />

      {/* Hamburger Menu Button */}
      <HamburgerMenu isOpen={isMenuOpen} onClick={toggleMenu} />

      {renderCurrentView()}

      {/* Sidebar */}
      <Sidebar 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        onHomeClick={resetToHomeState}
      />

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          analysisData={analysisData}
        />
      )}
    </div>
  );
};

export default Landing; 