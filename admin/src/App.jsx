import React, { useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AdminContext } from './context/AdminContext';

import Login from './pages/Login';
import Dashboard from './pages/Admin/Dashboard';
import AllAppointments from './pages/Admin/AllAppointments';
import AddDoctor from './pages/Admin/AddDoctor';
import DoctorsList from './pages/Admin/DoctorsList';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DoctorLogin from './pages/doctorLogin';
import DoctorDashboard from './pages/Admin/DoctorDashboard'; // create this component

const App = () => {
  const { aToken, dToken } = useContext(AdminContext);
  const location = useLocation();

  const isDoctorDashboard = location.pathname.startsWith('/doctor-dashboard');

  const isLoggedIn = aToken || dToken;

  return (
    <>
      <ToastContainer />

      {isLoggedIn && !isDoctorDashboard && <Navbar />}
      <div className={`flex items-start ${!isLoggedIn ? '' : 'bg-[#f8f9fd]'}`}>
        {isLoggedIn && !isDoctorDashboard && <Sidebar />}

        <div className="flex-1 w-full">
          <Routes>
            {/* Public Routes */}
            {!isLoggedIn && (
              <>
                <Route path="/login" element={<Login />} />
                <Route path="/doctor-login" element={<DoctorLogin />} />
                <Route path="*" element={<Navigate to="/login" />} />
              </>
            )}

            {/* Protected Routes */}
            {isLoggedIn && (
              <>
                {/* Admin Routes */}
                {aToken && (
                  <>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/admin-dashboard" element={<Dashboard />} />
                    <Route path="/all-appointments" element={<AllAppointments />} />
                    <Route path="/add-doctor" element={<AddDoctor />} />
                    <Route path="/doctor-list" element={<DoctorsList />} />
                  </>
                )}

                {/* Doctor Routes */}
                {dToken && (
                  <>
                    <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
                  </>
                )}

                {/* Redirects */}
                <Route path="/login" element={<Navigate to={aToken ? '/' : '/login'} />} />
                <Route path="/doctor-login" element={<Navigate to="/doctor-dashboard" />} />
                <Route path="*" element={<Navigate to={aToken ? '/' : '/doctor-dashboard'} />} />
              </>
            )}
          </Routes>
        </div>
      </div>
    </>
  );
};

export default App;
