# Donut - AI Food Analysis Tool

[doughmain.photo](https://doughmain.photo)

## Overview
Donut analyzes food images to provide detailed ingredient and nutritional information, using AI and 3D visualization. Upload a photo to get instant analysis of ingredients, nutrition facts, and detailed information about each component.

## Features

### Food Analysis
- Image upload/capture functionality
- Ingredient and nutrition analysis
- 3D visualization of processing status
- Nutritional content breakdown

### Ingredient Information
- Detailed ingredient analysis including:
  - Pronunciation
  - Purpose
  - Common uses
  - Origin
  - Safety information
  - Health data
  - Intake guidelines

### User Features
- Account system for saving analyses
- Food categorization (eaten/avoided)
- History tracking
- Analysis archive

### Technical Features
- Responsive design
- Real-time processing
- Mobile optimization
- Cross-platform compatibility

## Tech Stack

### Frontend
- React.js
- Three.js
- Vite
- Modern CSS

### Backend
- Python Flask
- MongoDB
- Google Gemini AI
- JWT Authentication

### Infrastructure
- Netlify (Frontend)
- Render (Backend)
- GoDaddy DNS
- GitHub CI/CD

## Development Setup

### Requirements
- Node.js (v18+)
- Python (3.9+)
- MongoDB account
- Google Cloud account

### Local Setup

1. Repository:
```bash
git clone https://github.com/yourusername/Donut.git
cd Donut
```

2. Frontend:
```bash
cd frontend
npm install
npm run dev
```

3. Backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

4. Google Cloud Voice API Setup (Crucial for Pronunciation Feature):

This is a one-time setup to authenticate your local machine with Google Cloud.

- **Create a Google Cloud Project:**
  - Go to the [Google Cloud Console](https://console.cloud.google.com/).
  - Create a **"New project"** and note the **Project ID** it assigns you.
- **Enable Required APIs:**
  - In your new project, enable the **Cloud Text-to-Speech API** and the **Cloud Resource Manager API**.
- **Install the Google Cloud CLI:**
  - Follow the official instructions to install the `gcloud` CLI for your OS: [Google Cloud SDK Installation](https://cloud.google.com/sdk/docs/install)
- **Log in with `gcloud`:**
  - This command will open a browser to log you into your Google account.
  ```bash
  gcloud auth application-default login
  ```
- **Set Your Quota Project:**
  - This tells `gcloud` which project to use for API billing and quotas. **Replace `YOUR_PROJECT_ID_HERE` with your actual Project ID.**
  ```bash
  gcloud auth application-default set-quota-project YOUR_PROJECT_ID_HERE
  ```

5. Environment Variables:

Create a `.env` file in the `backend` directory with the following keys:
```
MONGODB_URI=your_mongodb_uri
GOOGLE_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
GOOGLE_CLOUD_PROJECT=your_project_id_here
```

## Usage

1. Analysis
   - Visit doughmain.photo
   - Upload/take photo
   - View analysis results

2. Ingredients
   - Select ingredients for details
   - View safety and usage data

3. History
   - Create account
   - Save analyses
   - Access history in profile

## Contributing
Submit pull requests for major changes. Open an issue first to discuss proposed changes.

## License
MIT License

## Project Status
Developed for SpurHacks 2025. Active development.
