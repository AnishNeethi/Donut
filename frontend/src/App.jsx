import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from './components/Landing'
import HistoryPage from './components/HistoryPage'
import AuthPage from './components/AuthPage'
import PronunciationPlayer from './components/PronunciationPlayer'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/test-pronunciation" element={
            <div style={{ padding: '20px', backgroundColor: '#FFB6C1', minHeight: '100vh' }}>
              <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Pronunciation Test</h1>
              <PronunciationPlayer ingredientName="Sodium Benzoate" healthRating={25} />
              <PronunciationPlayer ingredientName="Monosodium Glutamate" healthRating={45} />
              <PronunciationPlayer ingredientName="Aspartame" healthRating={15} />
            </div>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App
