import React from 'react';
import './HamburgerMenu.css';

const HamburgerMenu = ({ isOpen, onClick }) => {
  return (
    <button className={`hamburger-menu ${isOpen ? 'menu-open' : ''}`} onClick={onClick}>
      <div className="hamburger-line"></div>
      <div className="hamburger-line"></div>
      <div className="hamburger-line"></div>
    </button>
  );
};

export default HamburgerMenu; 