import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from './components/Landing'
import HistoryPage from './components/HistoryPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
