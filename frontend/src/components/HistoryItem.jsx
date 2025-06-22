import React, { useState } from 'react';
import './HistoryItem.css';

const HistoryItem = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!item.analysis) {
    return null; // Don't render if analysis is missing
  }

  const { food_name, nutrition_data, ingredients } = item.analysis;
  const consumed_date = new Date(item.timestamp).toLocaleDateString();

  return (
    <div className={`history-item ${isExpanded ? 'expanded' : ''}`} onClick={() => setIsExpanded(!isExpanded)}>
      <div className="item-summary">
        <div className="summary-info">
          <h3 className="summary-title">{food_name || 'Unknown Food'}</h3>
          <p className="summary-date">Analyzed on: {consumed_date}</p>
        </div>
        <div className="summary-details">
          <div className="detail-item">
            <span>Calories</span>
            <strong>{nutrition_data?.calories || 'N/A'}</strong>
          </div>
          <div className="detail-item">
            <span>Sugar</span>
            <strong>{nutrition_data?.sugar || 'N/A'}g</strong>
          </div>
        </div>
        <button className="expand-btn">
          {isExpanded ? 'Show Less' : 'Show More'}
        </button>
      </div>

      {isExpanded && (
        <div className="item-details">
          <h4>Nutrition Facts</h4>
          <div className="nutrition-details-grid">
            {nutrition_data && Object.entries(nutrition_data).map(([key, value]) => (
              <div key={key} className="nutrition-detail-item">
                <span>{key.replace(/_/g, ' ')}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <h4>Ingredients</h4>
          <div className="ingredients-list">
            {ingredients && ingredients.length > 0 ? (
              ingredients.map((ingredient, index) => (
                <span key={index} className="ingredient-tag">{ingredient}</span>
              ))
            ) : (
              <p>No ingredients listed.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryItem; 