import React, { useState, useEffect } from 'react';
import './ProfilePage.css';
import Sidebar from './Sidebar';
import HamburgerMenu from './HamburgerMenu';
import LoginRegisterModal from './LoginRegisterModal';

const ProfilePage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    
    if (token && storedUsername) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
    }
  }, []);

  const handleLogout = () => {
    // For now, this button does nothing as requested
    console.log('Logout button clicked');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleLoginSuccess = (token, email) => {
    setIsAuthenticated(true);
    setUsername(email);
    setShowLoginModal(false);
  };

  return (
    <div className="profile-page">
      <HamburgerMenu isOpen={isMenuOpen} onClick={toggleMenu} />
      <Sidebar 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        onHomeClick={() => {}} // Empty function since this page doesn't need custom home handling
      />
      
      <div className="profile-content">
        {isAuthenticated ? (
          <div className="authenticated-content">
            <h2>profile</h2>
            <div className="user-info">
              <p className="username">welcome, {username}!</p>
              <button className="logout-button" onClick={handleLogout}>
                logout
              </button>
            </div>
          </div>
        ) : (
          <div className="login-prompt">
            <h2>profile</h2>
            <p>you need to log in to view your profile.</p>
            <button className="login-button" onClick={handleLoginClick}>
              login
            </button>
          </div>
        )}
      </div>

      <LoginRegisterModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default ProfilePage; 