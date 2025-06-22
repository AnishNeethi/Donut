import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ message = "Analyzing your food..." }) => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-donut">
          <div className="donut-spinner">
            <div className="donut-hole"></div>
          </div>
        </div>
        
        <h2 className="loading-title">donut</h2>
        
        <div className="loading-message">
          <p>{message}</p>
        </div>
        
        <div className="loading-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 