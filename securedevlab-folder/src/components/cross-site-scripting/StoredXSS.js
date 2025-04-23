import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import './storedXSS.css';

const BACKEND_URL = 'https://securedevlab.onrender.com';
// const BACKEND_URL = 'http://localhost:5000'; // Change this to your backend URL

const StoredXSS = () => {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLabCompleted, setIsLabCompleted] = useState(false);
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const navigate = useNavigate();

  // Check if user is authenticated and initialize user data
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
            lab_name: 'stored',
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
          if (data.completed_labs.includes('stored_xss')) {
            setIsLabCompleted(true);
          }
        }
      } catch (error) {
        console.error('Error checking lab completion:', error);
      }
    };

    checkLabCompletion();

    const isFirstTime = !localStorage.getItem(`xssLabVisited_${userEmail}`);
    if (isFirstTime) {
      // Clear comments for new users
      clearUserComments(userEmail);
      localStorage.setItem(`xssLabVisited_${userEmail}`, 'true');
    }
    unlockLabStatus();
  }, [navigate]);

  // Reset lab completion status when component mounts
  useEffect(() => {
    localStorage.removeItem('storedXssLabCompleted');
    setIsLabCompleted(false);
    setShowCompletionPrompt(false);
  }, []);

  // Check if any comment contains an alert script
  useEffect(() => {
    const hasAlertScript = (text) => {
      return text.includes('<script>alert(') || 
             text.includes('<img src=x onerror=alert(') ||
             text.includes('"><script>alert(');
    };

    // Check if any comment contains an alert script
    const hasXssPayload = comments.some(comment => hasAlertScript(comment.content));
    
    if (hasXssPayload) {
      // Mark the lab as completed in the backend
      const userEmail = localStorage.getItem('userEmail');
      if (userEmail) {
        fetch(`${BACKEND_URL}/api/complete-lab`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_email: userEmail,
            category: 'stored_xss'
          }),
        }).catch(error => console.error('Error updating lab completion:', error));
      }
      
      setIsLabCompleted(true);
      // setShowCompletionPrompt(true);
    }
  }, [comments]);

  const clearUserComments = async (userEmail) => {
    if (!userEmail) {
      console.error('No user email available');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/xss/clear-comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_email: userEmail }),
      });

      if (!response.ok) {
        throw new Error('Failed to clear comments');
      }
    } catch (err) {
      console.error('Error clearing comments:', err);
      setError('Failed to clear comments. Please try refreshing the page.');
    }
  };
// Check if the current search query contains an alert script
const hasAlertScript = (query) => {
  return query.includes('<script>alert(') || 
         query.includes('<img src=x onerror=alert(') ||
         query.includes('"><script>alert(');
};
  const fetchComments = async () => {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
      setError('Please log in again to view comments.');
      navigate('/');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/xss/comments?user_email=${encodeURIComponent(userEmail)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      
      const data = await response.json();
      setComments(data.comments || []);
      const xssComment = comments.find(comment => hasAlertScript(comment.content));

      if (xssComment) {
        console.log('Comment with XSS payload:', xssComment);
        alert(`${xssComment.content}`);
        setShowCompletionPrompt(true);
        // Perform additional actions if needed
      }
    } catch (err) {
      setError('Failed to load comments. Please try again.');
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
      setError('Please log in again to submit comments.');
      navigate('/');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/xss/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: comment,
          user_email: userEmail,
          author: localStorage.getItem('username') || 'Anonymous'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit comment');
      }

      setComment('');
      
      if (showComments) {
        fetchComments();
      }
    } catch (err) {
      setError('Failed to submit comment. Please try again.');
      console.error('Submit error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewComments = () => {
    setShowComments(true);
    fetchComments();
  };

  const handleHideComments = () => {
    setShowComments(false);
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
            <h1>Lab: Stored XSS into HTML context with nothing encoded</h1>
            <p className="lab-description">
              This lab contains a stored cross-site scripting vulnerability in the comment functionality.
              To solve the lab, submit a comment that performs a cross-site scripting attack that calls the alert function.
            </p>
            {isLabCompleted && (
              <div className="lab-completed">
                <h2>🎉 Lab Completed! 🎉</h2>
                <p>You successfully exploited the stored XSS vulnerability!</p>
              </div>
            )}
          </div>

          {showCompletionPrompt && (
            <div className="completion-prompt">
              <div className="prompt-content">
                <h3>Congratulations! You've completed the Stored XSS lab!</h3>
                <p>Would you like to stay on this page or return to the XSS labs homepage?</p>
                <div className="prompt-buttons">
                  <button className="stay-button" onClick={handleStayOnPage}>Stay on Page</button>
                  <button className="leave-button" onClick={handleLeavePage}>Return to XSS Labs</button>
                </div>
              </div>
            </div>
          )}

          <div className="xss-content">
            <div className="comment-section">
              <h2>Leave a Comment</h2>
              <form onSubmit={handleSubmitComment}>
                <div className="comment-input-container">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write your comment here..."
                    className="comment-input"
                    rows="4"
                  />
                  <button type="submit" className="submit-button" disabled={isLoading || !comment.trim()}>
                    {isLoading ? 'Submitting...' : 'Submit Comment'}
                  </button>
                </div>
              </form>
              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="comments-section">
              <div className="comments-header">
                <h2>Comments</h2>
                {!showComments ? (
                  <button className="view-comments-button" onClick={handleViewComments}>
                    View Comments
                  </button>
                ) : (
                  <button className="hide-comments-button" onClick={handleHideComments}>
                    Hide Comments
                  </button>
                )}
              </div>

              {showComments && (
                <>
                  {isLoading ? (
                    <div className="loading">Loading comments...</div>
                  ) : comments.length > 0 ? (
                    <div className="comments-list">
                      {comments.map((comment, index) => (
                        <div key={index} className="comment-item">
                          <div className="comment-content" dangerouslySetInnerHTML={{ __html: comment.content }} />
                          <div className="comment-meta">
                            <span className="comment-author">{comment.author}</span>
                            <span className="comment-date">{new Date(comment.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">No comments yet. Be the first to comment!</div>
                  )}
                </>
              )}
            </div>

            {isLabCompleted && (
              <div className="solution-section">
                <h2>Solution</h2>
                <p>To solve this lab, you need to submit a comment that contains a script that will trigger an alert when the page loads.</p>
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

export default StoredXSS; 