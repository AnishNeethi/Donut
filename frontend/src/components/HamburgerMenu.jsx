import React from 'react';
import './HamburgerMenu.css';

const HamburgerMenu = ({ isOpen, toggleMenu }) => {
  return (
    <button className={`hamburger-menu ${isOpen ? 'menu-open' : ''}`} onClick={toggleMenu}>
      <div className="hamburger-line"></div>
      <div className="hamburger-line"></div>
      <div className="hamburger-line"></div>
    </button>
  );
};

export default HamburgerMenu; 