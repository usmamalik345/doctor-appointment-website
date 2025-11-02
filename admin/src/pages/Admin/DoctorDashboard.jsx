  import React, { useContext, useEffect } from 'react';
  import { AdminContext } from '../../context/AdminContext.jsx';
  import { useNavigate } from 'react-router-dom';
  import { io } from 'socket.io-client';
  import { toast } from 'react-toastify';

  const DoctorDashboard = () => {
    const navigate = useNavigate();
    const { dToken, setDToken, getAllAppointments, appointments, setAppointments, doctorId } = useContext(AdminContext);

    const logOut = () => {
      if (dToken) {
        localStorage.removeItem('dtoken');
        setDToken('');
        navigate('/doctor-login');
      }
    };

    useEffect(() => {
      if (!doctorId) return;
    
      getAllAppointments();
    
      const socket = io('http://localhost:5000');
    
      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        socket.emit('registerDoctor', doctorId);
      });
    
      socket.on('newAppointment', (data) => {
        toast.success(data.message);
        setAppointments(prev => [data.appointment, ...prev]);
      });
    
      return () => socket.disconnect();
    }, [doctorId]);
    
    

    return (
      <div className="p-6">
        <button onClick={logOut}>LogOut</button>
        <h1 className="text-3xl font-bold text-center text-primary mb-4">Doctor Dashboard</h1>
        <p className="text-center text-gray-600 mb-6">Welcome, Doctor! Here are your appointments:</p>

        {appointments.length === 0 ? (
          <p className="text-center text-sm text-gray-400">No appointments found.</p>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment._id}
                className="border rounded p-4 shadow-sm bg-white"
              >
                <p><strong>Patient:</strong> {appointment.userData?.name}</p>
                <p><strong>Date:</strong> {appointment.slotDate}</p>
                <p><strong>Time:</strong> {appointment.slotTime}</p>
                <p><strong>Status:</strong> {appointment.cancelled ? 'Cancelled' : appointment.isCompleted ? 'Completed' : 'Upcoming'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  export default DoctorDashboard;
