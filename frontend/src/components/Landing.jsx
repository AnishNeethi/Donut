import React, { useState } from 'react';
import './Landing.css';

const Landing = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="landing-container">
      {/* Hamburger Menu Button */}
      <button className="hamburger-menu" onClick={toggleMenu}>
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
      </button>

      {/* Main Content */}
      <div className="main-content">
        <h1 className="app-title">donut</h1>
      </div>

      {/* Camera Button */}
      <button className="camera-button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
          <circle cx="12" cy="13" r="4"></circle>
        </svg>
      </button>

      {/* Slide-in Menu */}
      <div className={`slide-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="menu-content">
          <nav className="menu-nav">
            <ul>
              <li><a href="#home">home</a></li>
              <li><a href="#user">user</a></li>
              <li><a href="#settings">settings</a></li>
              <li><a href="#history">history</a></li>
              <li><a href="#feature1">feature 1</a></li>
              <li><a href="#feature2">feature 2</a></li>
              <li><a href="#feature3">feature 3</a></li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Overlay */}
      {isMenuOpen && <div className="menu-overlay" onClick={toggleMenu}></div>}
    </div>
  );
};

export default Landing; 