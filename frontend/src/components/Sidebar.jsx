import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, menuItems = [] }) => {
  const [overlayVisible, setOverlayVisible] = useState(false);

  // Default menu items if none provided
  const defaultMenuItems = [
    { path: '/', label: 'home' },
    { path: '/history', label: 'history' },
    { path: '/auth', label: 'dashboard' },
    { path: '#user', label: 'user', external: true },
    { path: '#settings', label: 'settings', external: true },
    { path: '#feature1', label: 'feature 1', external: true },
    { path: '#feature2', label: 'feature 2', external: true },
    { path: '#feature3', label: 'feature 3', external: true },
  ];

  const items = menuItems.length > 0 ? menuItems : defaultMenuItems;

  const handleMenuClick = () => {
    setOverlayVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleOverlayClick = () => {
    setOverlayVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Show overlay when menu opens
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => setOverlayVisible(true), 10);
    } else {
      setOverlayVisible(false);
    }
  }, [isOpen]);

  return (
    <>
      {/* Slide-in Menu */}
      <div className={`slide-menu ${isOpen ? 'open' : ''}`}>
        <div className="menu-content">
          <nav className="menu-nav">
            <ul>
              {items.map((item, index) => (
                <li key={index}>
                  {item.external ? (
                    <a href={item.path} onClick={handleMenuClick}>
                      {item.label}
                    </a>
                  ) : (
                    <Link to={item.path} onClick={handleMenuClick}>
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className={`menu-overlay ${overlayVisible ? 'visible' : ''}`} 
          onClick={handleOverlayClick}
        ></div>
      )}
    </>
  );
};

export default Sidebar; 