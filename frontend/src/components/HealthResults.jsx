import React, { useState } from 'react';
import './HealthResults.css';

const HealthResults = ({ analysisData, onSaveData, onBackToHome }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [isIngredientPopupOpen, setIsIngredientPopupOpen] = useState(false);
  const [ingredientData, setIngredientData] = useState(null);
  const [ingredientLoading, setIngredientLoading] = useState(false);
  const [ingredientError, setIngredientError] = useState(null);
  const isLoggedIn = localStorage.getItem('token') !== null;

  const API_BASE = 'https://donut-backend-o6ef.onrender.com';

  if (!analysisData) return null;

  const nutritionData = analysisData.nutrition_data || {};
  const ingredients = analysisData.ingredients || [];
  const foodName = analysisData.food_name || 'Unknown Food';

  const handleIngredientClick = (ingredient) => {
    setSelectedIngredient(ingredient);
    setIsIngredientPopupOpen(true);
    fetchIngredientData(ingredient);
  };

  const closeIngredientPopup = () => {
    setIsIngredientPopupOpen(false);
    setSelectedIngredient(null);
    setIngredientData(null);
    setIngredientError(null);
  };

  const fetchIngredientData = async (ingredient) => {
    setIngredientLoading(true);
    setIngredientError(null);
    
    try {
      const response = await fetch(`${API_BASE}/analyze-ingredient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ ingredient_name: ingredient }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIngredientData(data);
      } else {
        setIngredientError(data.detail || 'Failed to analyze ingredient');
      }
    } catch (error) {
      setIngredientError('Error analyzing ingredient');
    }
    
    setIngredientLoading(false);
  };

  // Calculate health rating based on nutrition data
  const calculateHealthRating = () => {
    const sugar = parseInt(nutritionData.sugar) || 0;
    const calories = parseInt(nutritionData.calories) || 0;
    const protein = parseInt(nutritionData.protein) || 0;
    const fiber = parseInt(nutritionData.fiber) || 0;

    let score = 100;
    
    // Deduct points for high sugar and calories
    if (sugar > 20) score -= 30;
    else if (sugar > 10) score -= 15;
    
    if (calories > 300) score -= 20;
    else if (calories > 150) score -= 10;
    
    // Add points for protein and fiber
    if (protein > 10) score += 10;
    if (fiber > 5) score += 10;

    return Math.max(0, Math.min(100, score));
  };

  const getHealthConcerns = () => {
    const concerns = [];
    const sugar = parseInt(nutritionData.sugar) || 0;
    const calories = parseInt(nutritionData.calories) || 0;
    const sodium = parseInt(nutritionData.sodium) || 0;
    const fat = parseInt(nutritionData.total_fat) || 0;

    if (sugar > 15) concerns.push('high sugar content');
    if (calories > 250) concerns.push('high calorie count');
    if (sodium > 500) concerns.push('high sodium');
    if (fat > 15) concerns.push('high fat content');
    
    return concerns.length > 0 ? concerns : ['no major health concerns'];
  };

  const healthRating = calculateHealthRating();
  const healthConcerns = getHealthConcerns();

  const categories = [
    {
      id: 'nutrition',
      title: 'nutrition facts',
      icon: '🍎',
      data: nutritionData
    },
    {
      id: 'health-rating',
      title: 'health rating',
      icon: '⭐',
      data: { rating: healthRating, description: healthRating > 70 ? 'good' : healthRating > 40 ? 'moderate' : 'poor' }
    },
    {
      id: 'health-concerns',
      title: 'health concerns',
      icon: '⚠️',
      data: healthConcerns
    },
    {
      id: 'ingredients',
      title: 'ingredients',
      icon: '🧪',
      data: ingredients
    }
  ];

  const renderCategoryContent = (category) => {
    switch (category.id) {
      case 'nutrition':
        return (
          <div className="nutrition-grid">
            {Object.entries(category.data).map(([key, value]) => (
              <div key={key} className="nutrition-item">
                <span className="nutrition-label">{key.replace(/_/g, ' ').toUpperCase()}</span>
                <span className="nutrition-value">{value}</span>
              </div>
            ))}
          </div>
        );
      
      case 'health-rating':
        return (
          <div className="health-rating">
            <div className="rating-circle">
              <span className="rating-number">{category.data.rating}</span>
              <span className="rating-max">/100</span>
            </div>
            <p className="rating-description">{category.data.description}</p>
          </div>
        );
      
      case 'health-concerns':
        return (
          <div className="concerns-list">
            {category.data.map((concern, index) => (
              <div key={index} className="concern-item">
                {concern}
              </div>
            ))}
          </div>
        );
      
      case 'ingredients':
        return (
          <div className="ingredients-list">
            {category.data.map((ingredient, index) => (
              <div 
                key={index} 
                className="ingredient-item"
                onClick={() => handleIngredientClick(ingredient)}
              >
                {ingredient}
              </div>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  const handleSave = async (consumed) => {
    if (!isLoggedIn) {
      onSaveData(); // This will trigger the auth modal
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/save-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          filename: 'food-analysis.jpg',
          analysis: analysisData,
          consumed: consumed
        }),
      });

      if (response.ok) {
        // After successful save, go back to home
        onBackToHome();
      } else {
        console.error('Failed to save analysis');
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
    }
  };

  return (
    <div className="health-results">
      <div className="food-title">
        <h2>{foodName}</h2>
      </div>

      <div className="health-categories">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-title">{category.title}</span>
          </button>
        ))}
      </div>

      {selectedCategory && (
        <div className="category-details">
          <div className="details-content">
            {renderCategoryContent(categories.find(cat => cat.id === selectedCategory))}
          </div>
        </div>
      )}

      <div className="save-section">
        {isLoggedIn ? (
          <>
            <p className="save-prompt">what would you like to do with this analysis?</p>
            <div className="save-buttons">
              <button className="save-btn eaten" onClick={() => handleSave(true)}>
                save to eaten
              </button>
              <button className="save-btn avoided" onClick={() => handleSave(false)}>
                save to avoided
              </button>
              <button className="save-btn dont-save" onClick={onBackToHome}>
                don't save to history
              </button>
            </div>
          </>
        ) : (
          <div className="save-buttons">
            <button className="save-btn" onClick={() => onSaveData()}>
              Login to Save History
            </button>
          </div>
        )}
      </div>

      {/* Ingredient Popup */}
      {isIngredientPopupOpen && (
        <div className="ingredient-popup-overlay" onClick={closeIngredientPopup}>
          <div className="ingredient-popup" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={closeIngredientPopup}>×</button>
            <h3>{selectedIngredient}</h3>
            
            {ingredientLoading && (
              <div className="loading-message">analyzing ingredient...</div>
            )}
            
            {ingredientError && (
              <div className="error-message">{ingredientError}</div>
            )}
            
            {ingredientData && (
              <div className="ingredient-details">
                <div className="detail-section">
                  <h4>pronunciation</h4>
                  <p>{ingredientData.pronunciation}</p>
                </div>
                
                <div className="detail-section">
                  <h4>purpose</h4>
                  <p>{ingredientData.purpose}</p>
                </div>

                <div className="detail-section">
                  <h4>commonly found in</h4>
                  <p>{ingredientData.commonly_found_in}</p>
                </div>

                <div className="detail-section">
                  <h4>origin</h4>
                  <p>{ingredientData.natural_or_synthetic}</p>
                </div>

                <div className="detail-section">
                  <h4>safety status</h4>
                  <p>{ingredientData.safety_status}</p>
                </div>
                
                <div className="detail-section">
                  <h4>health concerns</h4>
                  <p>{ingredientData.health_concerns}</p>
                </div>

                <div className="detail-section">
                  <h4>recommended intake</h4>
                  <p>{ingredientData.recommended_intake}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthResults; 