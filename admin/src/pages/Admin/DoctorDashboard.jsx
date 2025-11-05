import React, { useContext, useEffect } from 'react';
import { AdminContext } from '../../context/AdminContext.jsx';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const {
    dToken,
    setDToken,
    getAllAppointments,
    appointments,
    setAppointments,
    doctorId
  } = useContext(AdminContext);

  const logOut = () => {
    if (dToken) {
      localStorage.removeItem('dtoken');
      setDToken('');
      navigate('/doctor-login');
    }
  };

  useEffect(() => {
    if (!doctorId) return;

    // Fetch all appointments from backend
    getAllAppointments();

    // Connect to backend Socket.IO
    const socket = io(import.meta.env.VITE_BACKEND_URL.replace(/^http/, 'ws'));

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('registerDoctor', doctorId);
    });

    socket.on('newAppointment', (data) => {
      toast.success(data?.message || 'New appointment received');
      if (data?.appointment) {
        setAppointments(prev => [data.appointment, ...prev]);
      }
    });

    return () => socket.disconnect();
  }, [doctorId]);

  return (
    <div className="p-6">
      <button
        onClick={logOut}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        LogOut
      </button>

      <h1 className="text-3xl font-bold text-center text-primary mb-4">
        Doctor Dashboard
      </h1>
      <p className="text-center text-gray-600 mb-6">
        Welcome, Doctor! Here are your appointments:
      </p>

      {(!appointments || appointments.length === 0) ? (
        <p className="text-center text-sm text-gray-400">
          No appointments found.
        </p>
      ) : (
        <div className="space-y-4">
          {appointments
            .filter(a => a) // remove undefined items
            .map((appointment) => (
              <div
                key={appointment._id || Math.random()} // fallback key
                className="border rounded p-4 shadow-sm bg-white"
              >
                <p>
                  <strong>Patient:</strong> {appointment.userData?.name || 'Unknown'}
                </p>
                <p>
                  <strong>Date:</strong> {appointment.slotDate || 'N/A'}
                </p>
                <p>
                  <strong>Time:</strong> {appointment.slotTime || 'N/A'}
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  {appointment.cancelled
                    ? 'Cancelled'
                    : appointment.isCompleted
                    ? 'Completed'
                    : 'Upcoming'}
                </p>

                {/* Patient Image */}
                {appointment.userData?.image ? (
                  <img
                    src={appointment.userData.image}
                    alt={appointment.userData?.name || 'Patient'}
                    className="w-20 h-20 rounded-full mt-2"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-full mt-2 flex items-center justify-center text-gray-500 text-xs">
                    No Image
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
