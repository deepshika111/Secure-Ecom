import React, { useState, useEffect } from 'react';
import LoginTester from '../sql_injection_helper/login';
import { useParams } from 'react-router-dom';
import Navbar from '../Navbar';
import './playground.css';
import { useNavigate } from 'react-router-dom';

// const BACKEND_URL = "http://localhost:5000"; // Change this to your backend URL
const BACKEND_URL = "https://securedevlab.onrender.com"; // Uncomment this for production

const SQLPlayground = () => {
  const navigate = useNavigate();
  const { labId } = useParams();
  const [labDetails, setLabDetails] = useState({});
  const [query, setQuery] = useState("SELECT * FROM users;");
  const [queryResult, setQueryResult] = useState(null);
  const [labCompleted, setLabCompleted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const fetchLabDetails = async () => {
      const res = await fetch(`${BACKEND_URL}/api/lab/${labId}`);
      const data = await res.json();
      setLabDetails(data);
    };

    fetchLabDetails();
  }, [labId]);

  const markLabAsCompleted = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        console.error('No user email found');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/complete-lab`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          user_email: userEmail,
          lab_id: labId,
          category: 'sql_injection'
        }),
      });

      if (response.ok) {
        setLabCompleted(true);
        setShowSuccessModal(true);
      } else {
        console.error('Failed to mark lab as completed');
      }
    } catch (error) {
      console.error('Error marking lab as completed:', error);
    }
  };

  const runQuery = async () => {
    try {
      const res = await fetch('https://securedevlab.onrender.com/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      setQueryResult(data);
    } catch (err) {
      setQueryResult({ success: false, error: err.message });
    }
  };

  const handleLabCompletion = () => {
    markLabAsCompleted();
  };

  return (
    <div className="page-layout">
      <Navbar />
      <main className="main-content">
        <div className="playground-container">
          <div className="playground-header">
            {/* <h1>{labDetails.title}</h1> */}
            {/* <p className="lab-description">{labDetails.description}</p> */}
          </div>

          <div className="playground-content">
            <div className="lab-section">
              <h2>Lab Details</h2>
              <div className="lab-info">
                <h3>{labDetails.title}</h3>
                <h4>{labDetails.subtitle}</h4>
                <p>{labDetails.description}</p>
              </div>
            </div>

            <div className="lab-section">
              <h2>Login Tester</h2>
              <LoginTester
                title={labDetails.title}
                solution={labDetails.solution}
                onSuccess={handleLabCompletion}
              />
            </div>
          </div>
        </div>
      </main>

      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h5>✅ Lab Completed!</h5>
              <button className="close-button" onClick={() => setShowSuccessModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Congratulations! You have successfully completed this lab.</p>
            </div>
            <div className="modal-footer">
              <button className="stay-button" onClick={() => setShowSuccessModal(false)}>
                Stay Here
              </button>
              <button className="leave-button" onClick={() => navigate('/sql_injection')}>
                Return to Labs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SQLPlayground;
