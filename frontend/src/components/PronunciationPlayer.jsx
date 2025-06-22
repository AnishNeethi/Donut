import React, { useState, useRef } from 'react';
import './PronunciationPlayer.css';

const PronunciationPlayer = ({ ingredientName, healthRating }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);

  const getPronunciation = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/pronounce-ingredient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ingredient_name: ingredientName,
          health_rating: healthRating
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Set the audio source and play
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      
      setIsLoading(false);
      setIsPlaying(true);

    } catch (error) {
      console.error("Error getting pronunciation:", error);
      setIsLoading(false);
      // You might want to show a user-friendly error message here
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      getPronunciation();
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="pronunciation-player">
      <div className="ingredient-info">
        <span className="ingredient-name">{ingredientName}</span>
        <span className="health-rating">Health Rating: {healthRating}</span>
      </div>
      <button 
        className={`play-button ${isLoading ? 'loading' : ''} ${isPlaying ? 'playing' : ''}`} 
        onClick={handlePlayPause}
        disabled={isLoading}
      >
        <span className="play-icon">▶</span>
        <span className="pause-icon">❚❚</span>
        <span className="loading-spinner"></span>
      </button>
      <audio ref={audioRef} onEnded={handleAudioEnded} />
    </div>
  );
};

export default PronunciationPlayer; 