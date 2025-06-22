import React, { useState } from 'react';
import CameraUpload from './CameraUpload';
import LoadingScreen from './LoadingScreen';
import HealthResults from './HealthResults';
import DonutScene from './DonutScene';
import AuthModal from './AuthModal';
import './Landing.css';
import { Link } from 'react-router-dom';

const Landing = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('landing'); // landing, upload, loading, results, donut-scene
  const [analysisData, setAnalysisData] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [titleVisible, setTitleVisible] = useState(true);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCameraClick = () => {
    setCurrentView('upload');
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
    setCurrentView('upload');
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
        return <LoadingScreen message="Analyzing your food..." />;
      
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
      {/* Hamburger Menu Button */}
      <button className={`hamburger-menu ${isMenuOpen ? 'menu-open' : ''}`} onClick={toggleMenu}>
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
      </button>

      {renderCurrentView()}

      {/* Slide-in Menu */}
      <div className={`slide-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="menu-content">
          <nav className="menu-nav">
            <ul>
              <li><Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link></li>
              <li><Link to="/history" onClick={() => setIsMenuOpen(false)}>History</Link></li>
              <li><a href="#user">User</a></li>
              <li><a href="#settings">Settings</a></li>
              <li><a href="#feature1">Feature 1</a></li>
              <li><a href="#feature2">Feature 2</a></li>
              <li><a href="#feature3">Feature 3</a></li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Overlay */}
      {isMenuOpen && <div className="menu-overlay" onClick={toggleMenu}></div>}

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