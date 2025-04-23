import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const LoginTester = ({ solution, onSuccess, title, labId }) => {
  // console.log(solution)
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginResult, setLoginResult] = useState(null);
  const navigate = useNavigate(); 
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const markLabAsCompleted = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        console.error('No user email found');
        return;
      }

      const response = await fetch('https://securedevlab.onrender.com/api/complete-lab', {
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

      if (!response.ok) {
        throw new Error('Failed to mark lab as completed');
      }

      console.log('Lab marked as completed successfully');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error marking lab as completed:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch('https://securedevlab.onrender.com/lab1/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      setLoginResult(data);
      // console.log(data)
      const resultText = data.message;
      console.log(resultText)
      if (resultText.trim() === solution?.trim()) {
        toast.success("✅ Lab Completed Successfully!");
        setShowSuccessModal(true);
        // Mark the lab as completed in the backend
        await markLabAsCompleted();
      }
    } catch (err) {
      setLoginResult({ success: false, error: err.message });
    }
  };

  return (
    <>
    {/* {showSuccessModal && (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  }}>
    <div style={{
      background: 'white',
      padding: '2rem',
      borderRadius: '8px',
      width: '300px',
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    }}>
      <h3>✅ {title} Completed!</h3>
      <p>Do you want to return to the SQL Injection homepage?</p>
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-around' }}>
        <button onClick={() => navigate('/sql_injection')} style={{ padding: '0.5rem 1rem' }}>
          Go Home
        </button>
        <button onClick={() => setShowSuccessModal(false)} style={{ padding: '0.5rem 1rem' }}>
          Stay Here
        </button>
      </div>
    </div>
  </div>
)} */}

    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Login Tester (SQLi Demo)</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    placeholder="Enter username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="text"
                    className="form-control"
                    id="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100 mb-3">
                  Login
                </button>
              </form>
            </div>
          </div>

          {loginResult && (
            <div className="card mt-4">
              <div className="card-body">
                <h5 className="card-title">Login Result</h5>
                <pre className="bg-light p-3 rounded">
                  {JSON.stringify(loginResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default LoginTester;
