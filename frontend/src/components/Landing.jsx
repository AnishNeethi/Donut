import React, { useState } from 'react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('landing'); // landing, upload, loading, results, donut-scene
  const [analysisData, setAnalysisData] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [titleVisible, setTitleVisible] = useState(true);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_BASE = 'https://donut-backend-o6ef.onrender.com';

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCameraClick = () => {
    document.getElementById('fileInput').click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('Selected file:', file);
      setSelectedFile(file);
      handleUploadStart();
      
      // Use the same upload logic as AuthPage
      setLoading(true);
      setMessage('Compressing image...');

      const options = {
        maxSizeMB: 0.07,
        maxWidthOrHeight: 512,
        useWebWorker: true,
        fileType: 'image/jpeg',
      };

      try {
        const compressedFile = await imageCompression(file, options);
        setMessage('Uploading compressed image...');

        const formData = new FormData();
        formData.append('file', compressedFile, file.name);

        const response = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setAnalysisData(data);
          setMessage('Analysis complete!');
          handleUploadComplete(data);
        } else {
          setMessage(data.error || 'Upload failed');
          handleUploadError(data.error || 'Upload failed');
        }
      } catch (error) {
        console.error('Compression or Upload Error:', error);
        setMessage('An error occurred during compression or upload.');
        handleUploadError('An error occurred during compression or upload.');
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
    setCurrentView('results');
  };

  const handleUploadError = (error) => {
    console.error('Upload error:', error);
    setCurrentView('landing'); // Go back to landing on error
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
    setCurrentView('landing');
    setTitleVisible(true);
    setAnalysisData(null);
    setSelectedFile(null);
    setMessage('');
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
        return <LoadingScreen message={message || "Analyzing your food..."} />;
      
      case 'results':
        return (
          <div className="results-container">
            <HealthResults
              analysisData={analysisData}
              onSaveData={handleSaveData}
            />
            <div className="results-actions">
              <button className="action-btn" onClick={handleViewDonutScene}>
                View Sugar Visualization
              </button>
              <button className="action-btn secondary" onClick={handleBackToHome}>
                Analyze Another Food
              </button>
            </div>
          </div>
        );
      
      case 'donut-scene':
        return (
          <div className="donut-scene-container">
            <div className="scene-header">
              <button className="back-btn" onClick={handleBackToHome}>
                ← Back to Home
              </button>
              <div className="sugar-info">
                <h3>Sugar Visualization: {getSugarAmount()}g</h3>
                <p>{Math.ceil(getSugarAmount() / 5)} donuts falling!</p>
              </div>
            </div>
            <DonutScene sugarCount={getSugarAmount()} />
            <HealthResults
              analysisData={analysisData}
              onSaveData={handleSaveData}
            />
          </div>
        );
      
      default:
        return (
          <>
            {/* Main Content */}
            <div className={`main-content ${!titleVisible ? 'title-exit' : ''}`}>
              <h1 className="app-title">donut</h1>
            </div>

            {/* Camera Button */}
            <button className="camera-button" onClick={handleCameraClick}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </button>
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
        onChange={handleFileSelect}
      />

      {/* Hamburger Menu Button */}
      <HamburgerMenu isOpen={isMenuOpen} onClick={toggleMenu} />

      {renderCurrentView()}

      {/* Sidebar */}
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

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