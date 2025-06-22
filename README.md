# Donut - Food Ingredient Analyzer

Donut is a full-stack application designed to help users understand the ingredients in their food. Snap a picture, and Donut provides a nutritional analysis, ingredient breakdown, and even helps you pronounce complex ingredients with a high-quality, natural-sounding voice.

## Features

- **Image-Based Food Analysis**: Upload a photo of a food item to get detailed nutritional information.
- **Ingredient Insights**: Get a breakdown of ingredients, their purpose, and health considerations.
- **Voice Pronunciation**: Hear the correct pronunciation of complex ingredients, with a concerned tone for less healthy items.
- **User Accounts & History**: Sign up and log in to save your analysis history over time.
- **Dynamic Donut Visualization**: See a 3D donut visualization that reacts to the sugar content of the analyzed food.

---

## Project Setup for Collaborators

This guide will walk you through setting up the Donut project for local development.

### 1. Prerequisites

- **Node.js & npm**: Required for the frontend. We recommend using `nvm` (Node Version Manager) to manage Node.js versions.
- **Python**: Required for the backend.
- **Google Cloud SDK**: Required for authentication for the Text-to-Speech API.

### 2. Backend Setup

The backend is a Python FastAPI server.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate
    ```
    *On Windows, use `venv\\Scripts\\activate`*

3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

### 3. Google Cloud Voice API Setup (Crucial for Pronunciation Feature)

This is a one-time setup to authenticate your local machine with Google Cloud.

1.  **Create a Google Cloud Project:**
    - Go to the [Google Cloud Console](https://console.cloud.google.com/).
    - Click "Select a project" or the project dropdown and create a **"New project"**.
    - Give it a name (e.g., `[YourName]-Donut-Voices`) and note the **Project ID** it assigns you.

2.  **Enable Required APIs:**
    - Make sure your new project is selected.
    - Enable the **Cloud Text-to-Speech API**: [Click here to enable](https://console.cloud.google.com/apis/library/texttospeech.googleapis.com)
    - Enable the **Cloud Resource Manager API**: [Click here to enable](https://console.cloud.google.com/apis/library/cloudresourcemanager.googleapis.com)

3.  **Install the Google Cloud CLI:**
    - Follow the official instructions to install the `gcloud` CLI for your operating system: [Google Cloud SDK Installation](https://cloud.google.com/sdk/docs/install)

4.  **Log in with `gcloud`:**
    - This command will open a browser window for you to log in to your Google account.
    ```bash
    gcloud auth application-default login
    ```

5.  **Set Your Quota Project:**
    - This tells `gcloud` which project to use for API billing and quotas. **Replace `YOUR_PROJECT_ID_HERE` with your actual Project ID.**
    ```bash
    gcloud auth application-default set-quota-project YOUR_PROJECT_ID_HERE
    ```

### 4. Environment Variables

The backend requires API keys and your Google Cloud Project ID.

1.  **Create a `.env` file** in the `backend` directory by copying the example file:
    ```bash
    cp .env.example .env
    ```

2.  **Edit the `.env` file** and add your credentials:
    - `GEMINI_API_KEY`: Your API key for Google Gemini.
    - `GOOGLE_CLOUD_PROJECT`: The Project ID you created in the Google Cloud setup.

### 5. Frontend Setup

The frontend is a React application built with Vite.

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```

### 6. Running the Application

You need to run both the backend and frontend servers simultaneously in two separate terminals.

-   **To run the backend:**
    ```bash
    cd backend
    source venv/bin/activate
    python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```

-   **To run the frontend:**
    ```bash
    cd frontend
    npm run dev
    ```

The application should now be running and accessible, typically at `http://localhost:5173`.