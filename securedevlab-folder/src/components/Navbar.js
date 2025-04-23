import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
          Security Lab
        </div>
        <div className="navbar-menu">
          <div className="navbar-start">
            <div className="navbar-item" onClick={() => navigate('/dashboard')}>
              Dashboard
            </div>
            <div className="navbar-item" onClick={() => navigate('/sql_injection')}>
              SQL Injection
            </div>
            <div className="navbar-item" onClick={() => navigate('/xss-lab')}>
              XSS Lab
            </div>
          </div>
          <div className="navbar-end">
            <div className="navbar-item">
              <span className="welcome-text">Welcome, {username || 'User'}</span>
            </div>
            <div className="navbar-item">
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 