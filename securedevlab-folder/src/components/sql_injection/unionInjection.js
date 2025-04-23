import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ShopUnionLab from '../sql_injection_helper/ShopUnionLab';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '../Navbar';
import './unionInjection.css';

// const BACKEND_URL = "http://localhost:5000"; // Change this to your backend URL
const BACKEND_URL = "https://securedevlab.onrender.com"; // Uncomment this for production

const UnionInjectionLab = () => {
  const { labId, category } = useParams();
  const parsedLabId = parseInt(labId);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const categoryFromParam = category;
  const navigate = useNavigate();
  const [labDetails, setLabDetails] = useState({});
  const [categoryName, setCategoryName] = useState(categoryFromParam);
  const [result, setResult] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

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
            lab_name: 'sql_injection',
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
    const fetchLabDetails = async () => {
      const res = await fetch(`${BACKEND_URL}/api/lab/${parsedLabId}`);
      const data = await res.json();
      setLabDetails(data);
      console.log('Lab details:', data);
    };
    fetchLabDetails();
    unlockLabStatus();
  }, [parsedLabId]);

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
          lab_id: parsedLabId,
          category: 'sql_injection'
        }),
      });

      if (response.ok) {
        toast.success(`✅ ${labDetails.title} successfully completed!`);
        setShowSuccessModal(true);
      } else {
        console.error('Failed to mark lab as completed');
      }
    } catch (error) {
      console.error('Error marking lab as completed:', error);
    }
  };

  const runInjection = async () => {
    try {
      setSelectedCategory(categoryName);
      console.log('Running injection with category:', categoryName);
      const encodedPayload = encodeURIComponent(categoryName);
      const res = await fetch(`${BACKEND_URL}/lab/union-test?category=${encodedPayload}`);
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
        setProducts(data.result);
        setError(null);

        if(data.result.length > 0 && labDetails.solution==categoryName){
          if(labId==5){
            if(data.result[0].name == 'iPhone'){
              markLabAsCompleted();
            }
          }

          else{
            markLabAsCompleted();
          }
        }
        else{
          // toast.info("Incorrect code! Try again.");
        }
      } else {
        setResult([]);
        setProducts([]);
        toast.info("Incorrect code! Try again.");
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setResult([]);
      setProducts([]);
      setError(err.message);
    }
  };

  const fetchProducts = async (categoryName) => {
    try {
      const res = await fetch(`${BACKEND_URL}/lab/union-test?category=${encodeURIComponent(categoryName)}`);
      const data = await res.json();

      if (data.success) {
        setProducts(data.result);
        setError(null);
      } else {
        setProducts([]);
        setError(data.error || 'Error fetching products');
      }
    } catch (err) {
      setProducts([]);
      setError(err.message);
    }
  };

  useEffect(() => {
    if (categoryName) {
      runInjection();
    }
    fetchProducts(selectedCategory);
  }, [categoryName]);

  return (
    <div className="page-layout">
      <Navbar />
      <main className="main-content">
        <div className="union-container">
          <div className="union-header">
            <h1>{labDetails.title}</h1>
            <p className="lab-description">{labDetails.description}</p>
          </div>

          <div className="union-content">
            <ShopUnionLab labDetails={labDetails} />
            
            <div className="lab-section">
              <h2>SQL Injection Playground</h2>
              <div className="input-section">
                <input
                  type="text"
                  className="injection-input"
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  placeholder="Try: ' UNION SELECT NULL, NULL --"
                />
                <button 
                  className="run-button"
                  onClick={runInjection}
                >
                  Run Injection
                </button>
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              {result && (
                <div className="result-section">
                  <h3>Query Result:</h3>
                  <pre className="result-display">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <ToastContainer />

      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h5>✅ {labDetails.title} Completed!</h5>
              <button className="close-button" onClick={() => setShowSuccessModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Do you want to return to the SQL Injection homepage?</p>
            </div>
            <div className="modal-footer">
              <button className="stay-button" onClick={() => setShowSuccessModal(false)}>
                Stay Here
              </button>
              <button className="leave-button" onClick={() => navigate('/sql_injection')}>
                Go Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnionInjectionLab;
