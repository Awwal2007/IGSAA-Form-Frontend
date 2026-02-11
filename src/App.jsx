import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminLayout from './components/AdminLayout';
import Dashboard from './components/admin/Dashboard';
import CandidatesList from './components/admin/CandidatesList';
import CandidateDetail from './components/admin/CandidateDetail';
import UserManagement from './components/admin/UserManagement';
import NominationForm from './components/NominationForm';
import logo from './assets/logo.jpeg';
import './index.css';

function App() {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return {
      token,
      user: user ? JSON.parse(user) : null
    };
  });

  const ProtectedRoute = ({ children, requiredRole }) => {
    if (!auth.token || !auth.user) {
      return <Navigate to="/admin/login" />;
    }
    
    if (requiredRole && auth.user.role !== requiredRole) {
      return <Navigate to="/admin/dashboard" />;
    }
    
    return children;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth({ token: null, user: null });
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-gray-100/50">
            <header className="bg-igsaa-blue-dark text-white p-4">
              <div className="container mx-auto flex items-center gap-8 justify-center">
                <div>
                  <img className='h-20' src={logo} alt="Iwo Grammar school logo" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">IWO GRAMMAR SCHOOL ALUMNI ASSOCIATION</h1>
                  <p className="text-blue-100/90">Candidate Nomination Portal</p>
                </div>
              </div>
            </header>
            
            <main className="container mx-auto p-4">
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
                <h2 className="text-3xl font-bold text-center text-igsaa-blue-dark mb-2">
                  CANDIDATE NOMINATION FORM
                </h2>
                <div className="text-center">
                  <span className="inline-block px-4 py-1 bg-igsaa-blue text-white rounded-full font-semibold">
                    ELECTION YEAR: 2026
                  </span>
                </div>
              </div>
              
              <NominationForm />
            </main>
            
            <footer className="bg-gray-800 text-white p-4 mt-8">
              <div className="container mx-auto text-center">
                <p>© 2026 IWO GRAMMAR SCHOOL ALUMNI ASSOCIATION. All rights reserved.</p>
              </div>
            </footer>
          </div>
        } />
        
        <Route path="/admin/login" element={
          auth.token ? <Navigate to="/admin/dashboard" /> : <Login setAuth={setAuth} />
        } />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout user={auth.user} logout={logout} />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="candidates" element={<CandidatesList />} />
          <Route path="candidates/:id" element={<CandidateDetail />} />
          <Route path="users" element={
            <ProtectedRoute requiredRole="admin">
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="statistics" element={<Dashboard />} />
          <Route path="settings" element={
            <div className="admin-card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings</h2>
              <p className="text-gray-600">Settings page coming soon...</p>
            </div>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;