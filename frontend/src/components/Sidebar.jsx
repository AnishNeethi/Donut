import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, menuItems = [], onHomeClick }) => {
  const [overlayVisible, setOverlayVisible] = useState(false);
  const navigate = useNavigate();

  // Default menu items if none provided
  const defaultMenuItems = [
    { path: '/', label: 'home', isHome: true },
    { path: '/history', label: 'history' },
  ];

  const items = menuItems.length > 0 ? menuItems : defaultMenuItems;

  const handleMenuClick = () => {
    setOverlayVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    // Call the custom home handler if provided (for Landing page)
    if (onHomeClick) {
      onHomeClick();
    }
    // Also navigate to home route (for other pages)
    navigate('/');
    handleMenuClick();
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
            <ul className="main-menu">
              {items.map((item, index) => (
                <li key={index}>
                  {item.isHome ? (
                    <a href={item.path} onClick={handleHomeClick}>
                      {item.label}
                    </a>
                  ) : item.external ? (
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
            
            {/* Profile section at bottom */}
            <div className="profile-section">
              <Link to="/profile" onClick={handleMenuClick} className="profile-link">
                Profile
              </Link>
            </div>
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