import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Navbar';
import './xssHome.css';

// const BACKEND_URL = 'http://localhost:5000'; // Change to your backend URL
const BACKEND_URL = 'https://securedevlab.onrender.com'; // Uncomment this for production

const XSSHomepage = () => {
  const [completedLabs, setCompletedLabs] = useState({
    reflected: false,
    stored: false,
    dom: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refelect, setReflect] = useState(null);
  const [stored, setStored] = useState(null);

  useEffect(() => {
    const fetchLabStatus = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
          console.error('No user email found');
          return;
        }

        const reflectedRes = await fetch(`${BACKEND_URL}/api/lab-status?email=${encodeURIComponent(userEmail)}&lab_name=reflected`);
       
        if (reflectedRes.ok) {
          const data = await reflectedRes.json();
          console.log(data);
          setReflect(data.locked !== 0);
        }

        const storedRes = await fetch(`${BACKEND_URL}/api/lab-status?email=${encodeURIComponent(userEmail)}&lab_name=stored`);

        if (storedRes.ok) {
          const data = await storedRes.json();
          console.log(data);
          setStored(data.locked !== 0);
        }
      } catch (error) {
        console.error('Error fetching lab lock status:', error);
      }
    };

    const fetchLabCompletion = async () => {
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) return;

      try {
        setIsLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/lab-completion/${encodeURIComponent(userEmail)}`);
        if (response.ok) {
          const data = await response.json();
          const completed = {
            reflected: data.completed_labs.includes('reflected_xss'),
            stored: data.completed_labs.includes('stored_xss'),
            dom: data.completed_labs.includes('dom_xss')
          };
          setCompletedLabs(completed);
        } else {
          setError('Failed to fetch lab completion status');
        }
      } catch (error) {
        console.error('Error fetching lab completion status:', error);
        setError('Error connecting to the server');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLabCompletion();
    fetchLabStatus();
  }, []);

  const labCards = [
    {
      id: 'reflected',
      title: 'Reflected XSS',
      description: 'Practice exploiting reflected XSS vulnerabilities in a search function.',
      path: '/xss-lab/reflected',
      image: 'https://miro.medium.com/v2/resize:fit:1400/0*aV4mhFiskCdVHSsU'
    },
    {
      id: 'stored',
      title: 'Stored XSS',
      description: 'Learn about stored XSS attacks through a vulnerable comment system.',
      path: '/xss-lab/stored',
      image: 'https://i.ytimg.com/vi/ABwS2MIxFPQ/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBfAmy5CtdLdsOaCFu1aasNEqEuVw'
    }
  ];

  const stripeLinks = {
    
    reflected: 'https://buy.stripe.com/test_4gwg1yenH7Hf3O8145',
    stored: 'https://buy.stripe.com/test_7sIbLifrL9PndoI7su'
    
  };

  if (isLoading) {
    return (
      <div className="page-layout">
        <Navbar />
        <main className="main-content">
          <div className="xss-home-container">
            <div className="loading-spinner">Loading labs...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-layout">
        <Navbar />
        <main className="main-content">
          <div className="xss-home-container">
            <div className="error-message">{error}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-layout">
      <Navbar />
      <main className="main-content">
        <div className="xss-home-container">
          <h1>Cross-Site Scripting (XSS) Labs</h1>
          <p className="intro-text">
            Welcome to the XSS Security Labs. Here you can practice identifying and exploiting different types of XSS vulnerabilities.
            Each lab focuses on a specific type of XSS attack, helping you understand the underlying principles and security implications.
          </p>

          <div className="labs-grid">
            {labCards.map((lab) => {
              const isLocked = (lab.id === 'reflected' && refelect) || (lab.id === 'stored' && stored);

              return (
                <div key={lab.id} className="lab-card">
                  <div className="lab-image">
                    <img src={lab.image} alt={lab.title} />
                  </div>
                  <h2>{lab.title}</h2>
                  <p>{lab.description}</p>

                  {isLocked ? (
                    <>
                      {/* <div className="locked-message">This lab is locked. Please do the payment.</div> */}
                      <a
                        href={stripeLinks[lab.id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`lab-link ${completedLabs[lab.id] ? 'completed' : ''}`}
                      >
                        {completedLabs[lab.id] ? 'Completed' : 'Unlock Lab'}
                      </a>
                    </>
                  ) : (
                    <Link
                      to={lab.path}
                      className={`lab-link ${completedLabs[lab.id] ? 'completed' : ''}`}
                    >
                      {completedLabs[lab.id] ? 'Completed' : 'Start Lab'}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default XSSHomepage;
