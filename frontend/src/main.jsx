import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ProjectsPage from './pages/ProjectsPage'
import TasksPage from './pages/TasksPage'
import Header from './components/Header'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <Router>
      <Header />
      <Routes>
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/" element={<ProjectsPage />} />
      </Routes>
    </Router>
  </React.StrictMode>
)
