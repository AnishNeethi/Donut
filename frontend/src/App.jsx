import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import DonutDemo from './components/DonutDemo'
import AuthPage from './components/AuthPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <nav style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
          <Link to="/" style={{ marginRight: '20px', textDecoration: 'none', color: '#333' }}>
            Home (Donut Demo)
          </Link>
          <Link to="/auth" style={{ textDecoration: 'none', color: '#333' }}>
            Image Analysis
          </Link>
        </nav>

        <Routes>
          <Route path="/" element={<DonutDemo />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
