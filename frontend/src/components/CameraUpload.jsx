import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import './CameraUpload.css';

const CameraUpload = ({ onUploadStart, onUploadComplete, onUploadError }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const API_BASE = 'http://127.0.0.1:8000';

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleCameraCapture = () => {
    // Trigger the hidden file input for camera
    document.getElementById('camera-input').click();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      onUploadError('Please select a file');
      return;
    }

    onUploadStart();

    const options = {
      maxSizeMB: 0.07,
      maxWidthOrHeight: 512,
      useWebWorker: true,
      fileType: 'image/jpeg',
    };

    try {
      const compressedFile = await imageCompression(selectedFile, options);

      const formData = new FormData();
      formData.append('file', compressedFile, selectedFile.name);

      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        onUploadComplete(data);
      } else {
        onUploadError(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload Error:', error);
      onUploadError('An error occurred during upload.');
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  return (
    <div className="camera-upload-container">
      {!selectedFile ? (
        <div className="upload-section">
          <input
            id="camera-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          <div className="upload-buttons">
            <button className="upload-btn camera-btn" onClick={handleCameraCapture}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
              Take Photo
            </button>
            
            <button className="upload-btn gallery-btn" onClick={() => document.getElementById('file-input').click()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21,15 16,10 5,21"></polyline>
              </svg>
              Choose from Gallery
            </button>
          </div>
        </div>
      ) : (
        <div className="preview-section">
          <div className="image-preview">
            <img src={previewUrl} alt="Selected food" />
          </div>
          
          <div className="preview-actions">
            <button className="action-btn analyze-btn" onClick={handleUpload}>
              Analyze Food
            </button>
            <button className="action-btn cancel-btn" onClick={clearSelection}>
              Choose Different Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraUpload; 