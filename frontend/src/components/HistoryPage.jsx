import React, { useState, useEffect } from 'react';
import DonutScene from './DonutScene';
import HistoryItem from './HistoryItem';
import Sidebar from './Sidebar';
import HamburgerMenu from './HamburgerMenu';
import './HistoryPage.css';

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('avoided'); // 'eaten' or 'avoided'
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const API_BASE = 'https://donut-backend-o6ef.onrender.com';

  useEffect(() => {
    if (token) {
      handleGetHistory();
    } else {
      setMessage('please login to view your history.');
    }
  }, [token]);

  const handleGetHistory = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE}/history?period=all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setHistory(data);
      } else {
        setMessage(data.error || 'failed to load history');
      }
    } catch (error) {
      setMessage('error loading history');
    }
    setLoading(false);
  };

  const filteredHistory = history.filter(item => {
    return filter === 'eaten' ? item.consumed === true : item.consumed === false;
  });

  const calculateTotalSugar = () => {
    return filteredHistory.reduce((total, item) => {
      return total + (parseInt(item.analysis?.nutrition_data?.sugar) || 0);
    }, 0);
  };

  const totalSugar = calculateTotalSugar();

  if (!token) {
    return (
      <div className="history-page">
        <div className="login-prompt">
          <h2>access denied</h2>
          <p>{message}</p>
          <p>please log in to see your analysis history.</p>
          {/* You might want to add a login button here */}
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      {/* Hamburger Menu Button */}
      <HamburgerMenu isOpen={isMenuOpen} onClick={() => setIsMenuOpen(!isMenuOpen)} />

      <div className="history-header">
        <h1>history</h1>
      </div>

      <div className="history-filters">
        <button
          className={`filter-btn ${filter === 'avoided' ? 'active' : ''}`}
          onClick={() => setFilter('avoided')}
        >
          avoided
        </button>
        <button
          className={`filter-btn ${filter === 'eaten' ? 'active' : ''}`}
          onClick={() => setFilter('eaten')}
        >
          eaten
        </button>
      </div>

      <div className="history-visualization">
        <div className="sugar-summary">
          <h2>total sugar {filter === 'eaten' ? 'consumed' : 'avoided'}: {totalSugar}g</h2>
          <p>that's equivalent to {Math.ceil(totalSugar / 10)} donuts!</p>
        </div>
        <DonutScene sugarCount={totalSugar} />
      </div>
      <div className="history-list-container">
        <h2 className="list-title">your {filter === 'eaten' ? 'eaten' : 'avoided'} items</h2>
        {loading && <p>loading history...</p>}
        {message && !loading && <p>{message}</p>}
        
        <div className="history-list">
          {!loading && filteredHistory.length === 0 && (
            <p className="no-history-message">no {filter} items found in your history.</p>
          )}

          {filteredHistory.map((item) => (
            <HistoryItem key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        onHomeClick={() => {}} // Empty function since this page doesn't need custom home handling
      />
    </div>
  );
};

export default HistoryPage; 