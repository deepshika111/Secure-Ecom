import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import './reflectedXSS.css';

const BACKEND_URL = 'https://securedevlab.onrender.com';
// const BACKEND_URL = 'http://localhost:5000'; // Change this to your backend URL


const ReflectedXSS = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLabCompleted, setIsLabCompleted] = useState(false);
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false);
  const navigate = useNavigate();

  // Check if user is authenticated
  useEffect(() => {
    const unlockLabStatus = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
          console.error('No user email found');
          return;
        }
  
        const response = await fetch(`${BACKEND_URL}/api/unlock-lab-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_email: userEmail,
            lab_name: 'reflected',
          }),
        });
  
        if (response.ok) {
          console.log('Lab unlocked successfully');
        } else {
          console.error('Failed to unlock the lab');
        }

      } catch (error) {
        console.error('Error unlocking lab status:', error);
      }
    };
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const userEmail = localStorage.getItem('userEmail');

    if (!isAuthenticated || !userEmail) {
      navigate('/');
      return;
    }

    const checkLabCompletion = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/lab-completion/${encodeURIComponent(userEmail)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.completed_labs.includes('reflected_xss')) {
            setIsLabCompleted(true);
          }
        }
      } catch (error) {
        console.error('Error checking lab completion:', error);
      }
    };

    checkLabCompletion();
    unlockLabStatus();
  }, [navigate]);

  // Reset lab completion status when component mounts
  useEffect(() => {
    setShowCompletionPrompt(false);
  }, []);

  // Check if the current search query contains an alert script
  const hasAlertScript = (query) => {
    return query.includes('<script>alert(') || 
           query.includes('<img src=x onerror=alert(') ||
           query.includes('"><script>alert(');
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Vulnerable endpoint that reflects the search query without encoding
      const response = await fetch(`${BACKEND_URL}/xss/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setSearchResults(data.results || []);

      // Check if the search query contains a script with alert
      if (hasAlertScript(searchQuery)) {
        // Mark the lab as completed in the backend
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
          await fetch(`${BACKEND_URL}/api/complete-lab`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_email: userEmail,
              category: 'reflected_xss'
            }),
          });
        }
        alert(searchQuery);
        
        // Mark the lab as completed
        setIsLabCompleted(true);
        setShowCompletionPrompt(true);
      } else {
        // If the query doesn't contain an alert script, mark as not completed
        setIsLabCompleted(false);
        setShowCompletionPrompt(false);
      }
    } catch (err) {
      setError('Failed to perform search. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStayOnPage = () => {
    setShowCompletionPrompt(false);
  };

  const handleLeavePage = () => {
    navigate('/xss-lab');
  };

  return (
    <div className="page-layout">
      <Navbar />
      <main className="main-content">
        <div className="xss-container">
          <div className="xss-header">
            <h1>Lab: Reflected XSS into HTML context with nothing encoded</h1>
            <p className="lab-description">
              This lab contains a simple reflected cross-site scripting vulnerability in the search functionality.
              To solve the lab, perform a cross-site scripting attack that calls the alert function.
            </p>
            {isLabCompleted && (
              <div className="lab-completed">
                <h2>🎉 Lab Completed! 🎉</h2>
                <p>You successfully exploited the XSS vulnerability!</p>
              </div>
            )}
          </div>

          {showCompletionPrompt && (
            <div className="completion-prompt">
              <div className="prompt-content">
                <h3>Congratulations! You've completed the XSS lab!</h3>
                <p>Would you like to stay on this page or return to the dashboard?</p>
                <div className="prompt-buttons">
                  <button className="stay-button" onClick={handleStayOnPage}>Stay on Page</button>
                  <button className="leave-button" onClick={handleLeavePage}>Return to Dashboard</button>
                </div>
              </div>
            </div>
          )}

          <div className="xss-content">
            <div className="search-section">
              <h2>Product Search</h2>
              <form onSubmit={handleSearch}>
                <div className="search-input-container">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products..."
                    className="search-input"
                  />
                  <button type="submit" className="search-button" disabled={isLoading}>
                    {isLoading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </form>
              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="results-section">
              <h2>Search Results</h2>
              {isLoading ? (
                <div className="loading">Loading results...</div>
              ) : searchResults.length > 0 ? (
                <div className="results-list">
                  {searchResults.map((result, index) => (
                    <div key={index} className="result-item">
                      <h3>{result.title}</h3>
                      <p>{result.description}</p>
                      <div className="result-price">${result.price}</div>
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="no-results">No results found for "{searchQuery}"</div>
              ) : (
                <div className="empty-state">Enter a search term to find products</div>
              )}
            </div>

            {isLabCompleted && (
              <div className="solution-section">
                <h2>Solution</h2>
                <p>To solve this lab, you need to craft a payload that will trigger an alert when the search results are displayed.</p>
                <div className="solution-hint">
                  <p>Hint: Try using HTML tags that can execute JavaScript, such as:</p>
                  <code>{'<script>alert(1)</script>'}</code>
                  <p>or</p>
                  <code>{'<img src=x onerror=alert(1)>'}</code>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReflectedXSS; 