import React, { useState } from 'react';
import './HealthResults.css';

const HealthResults = ({ analysisData, onSaveData }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  if (!analysisData) return null;

  const nutritionData = analysisData.nutrition_data || {};
  const ingredients = analysisData.ingredients || [];
  const foodName = analysisData.food_name || 'Unknown Food';

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
              <div key={index} className="ingredient-item">
                {ingredient}
              </div>
            ))}
          </div>
        );
      
      default:
        return null;
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
        <p className="save-prompt">want to save this analysis to your health history?</p>
        <button className="save-btn" onClick={onSaveData}>
          save to profile
        </button>
      </div>
    </div>
  );
};

export default HealthResults; 