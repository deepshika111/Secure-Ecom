import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import './sqlHome.css';

// const BACKEND_URL = 'http://localhost:5000'; // Change this to your backend URL
const BACKEND_URL = 'https://securedevlab.onrender.com'; // Uncomment this for production

const SQLInjectionHomepage = () => {
  const [labs, setLabs] = useState([]);
  const [completedLabs, setCompletedLabs] = useState([]);
  const [lockedData, setLockedData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {

    const fetchLabStatus = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
          console.error('No user email found');
          return;
        }
    
        // Make a GET request with query parameters
        const response = await fetch(`${BACKEND_URL}/api/lab-status?email=${encodeURIComponent(userEmail)}&lab_name=sql_injection`);
    
        if (response.ok) {
          const data = await response.json();
          console.log('Lab Status:', data);
          if (data.locked === 0) {
            console.log(`Lab '${data.lab_name}' is unlocked.`);
            setLockedData(false); // Lab is unlocked
          } else {
            console.log(`Lab '${data.lab_name}' is locked.`);
            setLockedData(true); // Lab is locked
          }
        } else {
          const errorData = await response.json();
          console.error('Error fetching lab status:', errorData.error);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    const fetchData = async () => {
      try {





        // Fetch labs
        const labsRes = await fetch(`${BACKEND_URL}/api/labs`);
      
        const labsData = await labsRes.json();
        setLabs(labsData);

        // Fetch completed labs
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
          const completedRes = await fetch(`${BACKEND_URL}/api/lab-completion/${encodeURIComponent(userEmail)}`, {
            credentials: 'include',
          });
          const completedData = await completedRes.json();
          const sqlCompletedLabs = completedData.completed_labs
            .filter((labType) => labType.startsWith('sql_injection_'))
            .map((labType) => {
              const labId = labType.split('_')[2];
              return { id: labId };
            });
          setCompletedLabs(sqlCompletedLabs);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    fetchLabStatus();
  }, []);

  const isLabCompleted = (labId) => {
    return completedLabs.some((lab) => lab.id === labId.toString());
  };

  return (
    <div className="page-layout">
      <Navbar />
      <main className="main-content">
        <div className="sql-container">
          <div className="sql-header">
            <h1>SQL Injection Practice Labs</h1>
            <p className="lab-description">
              Master SQL injection techniques through hands-on practice. Learn how attackers can manipulate database queries
              and how to prevent these vulnerabilities in your applications.
            </p>
          </div>

          <div className="sql-grid">
            {labs.map((lab) => (
              <div
                key={lab.id}
                className="sql-card"
                onClick={() => {
                  if (!lockedData) {
                    if ([2, 3, 4, 5].includes(lab.id)) {
                      navigate(`/lab/${lab.id}/:category`);
                    } else {
                      navigate(`/lab/${lab.id}`);
                    }
                  } else if (lab.id === 1) {
                    navigate(`/lab/${lab.id}`);
                  }
                  else {
                    alert('This lab is locked. Please do the payment.');
                    window.location.href = 'https://buy.stripe.com/test_4gw9AYfemfXl2hq145';
                  }
                }}
              >
                <div className="sql-card-image">
                  <img
                    src={`https://content.pentest-tools.com/assets/content/sql-injection-attacks/common-sql-injection-attacks.webp`}
                    alt={lab.title}
                  />
                  {isLabCompleted(lab.id) && (
                    <div className="completion-badge">✓ Completed</div>
                  )}
                </div>
                <div className="sql-card-content">
                  <h3>{lab.title}</h3>
                  <p>{lab.subtitle}</p>
                  <button
                    className={`start-button ${isLabCompleted(lab.id) ? 'completed' : ''}`}
                  >
                    {isLabCompleted(lab.id) ? 'Completed' : 'Start Lab'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SQLInjectionHomepage;