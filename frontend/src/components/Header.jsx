import React from 'react'
import { NavLink } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

const Header = () => {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <span className="app-brand">🌿 Task Tracker</span>
        <nav>
          <NavLink to="/projects" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Projects</NavLink>
          <NavLink to="/tasks" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Tasks</NavLink>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  )
}

export default Header