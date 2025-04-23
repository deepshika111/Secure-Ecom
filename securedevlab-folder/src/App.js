import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SQLPlayground from './components/sql_injection/playground';
import ShopUnionLab from './components/sql_injection_helper/ShopUnionLab';
import UnionInjectionLab from './components/sql_injection/unionInjection';
import SQLInjectionHomepage from './components/sql_injection/homepage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SecurityLabDashboard from './components/dashboard';
import Login from './components/login';
import Signup from './components/signup';
import ReflectedXSS from './components/cross-site-scripting/ReflectedXSS';
import StoredXSS from './components/cross-site-scripting/StoredXSS';
import DOMXSS from './components/cross-site-scripting/DOMXSS';
import XSSHomepage from './components/cross-site-scripting/homepage';

// Simple authentication check
const isAuthenticated = () => {
  return localStorage.getItem('isAuthenticated') === 'true';
};

// Protected Route component
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" />;
  }
  return children;
};

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={
            // <ProtectedRoute>
              <SecurityLabDashboard />}/>
            {/* </ProtectedRoute> */}
          
          <Route path="/sql_injection" element={
           
              <SQLInjectionHomepage />
            
          } />
          <Route path="/lab/:labId" element={
            // <ProtectedRoute>
              <SQLPlayground />
            // </ProtectedRoute>
          } />
          <Route path="/lab/:labId/:category" element={
            // <ProtectedRoute>
              <UnionInjectionLab />
            // </ProtectedRoute>
          } />
          {/* Optional: fallback for manual entry */}
          <Route path="/lab/union-test" element={
            // <ProtectedRoute>
              <UnionInjectionLab />
            // </ProtectedRoute>
          } />
          {/* XSS Lab Routes */}
          <Route path="/xss-lab" element={
            // <ProtectedRoute>
              <XSSHomepage />
            // </ProtectedRoute>
          } 
            />
          <Route path="/xss-lab/reflected" element={
            // <ProtectedRoute>
              <ReflectedXSS />
              // </ProtectedRoute>
            } />
          <Route path="/xss-lab/stored" element={
            // <ProtectedRoute>
              <StoredXSS />}/>
              {/* </ProtectedRoute> */}
            
            
          <Route path="/xss-lab/dom" element={<DOMXSS />} />
        </Routes>
      </Router>
      <ToastContainer />
    </div>
  );
}

export default App;
