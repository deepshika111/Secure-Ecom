import React, { useState } from 'react';
import LoginTester from '../sql_injection_helper/login';
import Navbar from '../Navbar';

const SQLInjection = () => {
  const [labCompleted, setLabCompleted] = useState(false);

  const handleLabCompleted = () => {
    setLabCompleted(true);
  };

  return (
    <div className="page-layout">
      <Navbar />
      <main className="main-content">
        <div className="sql-content">
          <div className="login-section">
            <h2>SQL Injection Lab</h2>
            <LoginTester 
              solution="Login successful! Welcome admin"
              onSuccess={handleLabCompleted}
              title="SQL Injection"
              labId="sql_injection_1"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default SQLInjection; 