import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CreatePoll from './pages/CreatePoll'
import PollDetail from './pages/PollDetail'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1>Voters</h1>
          <p>Create and vote on polls</p>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreatePoll />} />
            <Route path="/poll/:id" element={<PollDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

