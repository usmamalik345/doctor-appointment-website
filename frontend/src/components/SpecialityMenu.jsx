import React, { useContext, useState, useEffect } from 'react';
import { specialityData } from '../assets/assets_frontend/assets';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const SpecialityMenu = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { 
    directAppointment, 
    bookAppointment, 
    confirmAppointment, 
    confirmAppointmentreq,
    userData,
    token 
  } = useContext(AppContext);

const bookDirectAppointment = async () => {
  if (!name.trim()) return alert('Please enter a sentence');

  if (!token) {
    alert('Please login to book an appointment');
    navigate('/login');
    return;
  }

  setIsLoading(true);
  console.log('Booking appointment with:', name);

  try {
    await bookAppointment(name);
  } catch (error) {
    console.error('Error booking appointment:', error);
    alert('Booking failed. Redirecting to doctor list.');
    navigate('/doctors');
  } finally {
    setIsLoading(false);
  }
};



  useEffect(() => {
    console.log("User ID:", userData?._id);
    console.log("Direct appointment data:", directAppointment);

    if (!directAppointment || !userData) return;

    if (Array.isArray(directAppointment)) {
      setSuggestions(directAppointment);
    } else {
      setSuggestions([directAppointment]);
    }
  }, [directAppointment, userData]);

  useEffect(() => {
    if (confirmAppointmentreq) {
      console.log("Appointment confirmed:", confirmAppointmentreq);
    }
  }, [confirmAppointmentreq]);

  const handleConfirmAppointment = async (doc) => {
    if (!userData?._id) {
      alert('Please login to confirm appointment');
      navigate('/login');
      return;
    }

    try {
      await confirmAppointment({
        userId: userData._id,
        doctorId: doc._id || doc.docId, 
        date: doc.date,
        time: doc.time,
      });

      setSuggestions([]);
      setName('');
      
      navigate('/my-appointments');
    } catch (error) {
      console.error('Error confirming appointment:', error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setName(value);
    
    if (!value.trim()) {
      setSuggestions([]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      bookDirectAppointment();
    }
  };

  return (
    <div className='flex flex-col items-center gap-4 py-16 text-gray-800' id='speciality'>
      <h1 className='text-3xl font-medium'>Find by Speciality</h1>
      <p className='sm:w-1/3 text-center text-sm'>
        Simply browse through our extensive list of trusted doctors, <br /> 
        schedule your appointment hassle-free.
      </p>

      {/* AI Booking Input Section */}
      <div className='flex flex-col items-center gap-2'>
        <div className='flex gap-2'>
          <input
            type="text"
            value={name}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder='e.g. I want to see a skin doctor tomorrow at 5pm'
            className="border border-gray-300 px-4 py-2 rounded-lg w-[300px] sm:w-[400px] focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading}
          />
          <button
            onClick={bookDirectAppointment}
            disabled={isLoading || !name.trim()}
            className="bg-purple-700 hover:bg-purple-800 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors duration-200"
          >
            {isLoading ? 'Searching...' : 'Book'}
          </button>
        </div>
        
        {/* Helper text */}
        <p className='text-xs text-gray-500 text-center'>
          Try: "I need a cardiologist next Monday" or "Book dermatologist appointment tomorrow 3pm"
        </p>
      </div>

      {/* AI Suggestions Section */}
      {suggestions.length > 0 && (
        <div className='pt-8 w-full max-w-4xl'>
          <h2 className="text-lg font-semibold text-center mb-4">Available Appointments:</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {suggestions.map((doc, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <img 
                    src={doc.image} 
                    alt={doc.name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/48/48'; // Fallback image
                    }}
                  />
                  <div>
                    <h3 className="font-bold text-gray-800">{doc.name}</h3>
                    <p className="text-sm text-gray-600">{doc.speciality}</p>
                  </div>
                </div>
                
                <div className="space-y-1 mb-3">
                  <p className="text-sm"><span className="font-medium">Date:</span> {doc.date}</p>
                  <p className="text-sm"><span className="font-medium">Time:</span> {doc.time}</p>
                  {doc.fees && (
                    <p className="text-sm"><span className="font-medium">Fee:</span> ${doc.fees}</p>
                  )}
                </div>
                
                <button
                  onClick={() => handleConfirmAppointment(doc)}
                  className="w-full mt-2 px-3 py-2 text-sm bg-purple-700 hover:bg-purple-800 text-white rounded-lg transition-colors duration-200"
                >
                  Confirm Appointment
                </button>
              </div>
            ))}
          </div>
          
          {/* Clear suggestions button */}
          <div className="text-center mt-4">
            <button
              onClick={() => setSuggestions([])}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear suggestions
            </button>
          </div>
        </div>
      )}

      {/* Static Speciality Cards */}
      <div className='flex sm:justify-center gap-4 pt-10 w-full overflow-scroll'>
        {specialityData.map((item, index) => (
          <Link
            onClick={() => scrollTo(0, 0)}
            className='flex flex-col items-center text-xs cursor-pointer flex-shrink-0 hover:translate-y-[-10px] transition-all duration-500'
            key={index}
            to={`/doctors/${item.speciality}`}
          >
            <img className='w-16 sm:w-24 mb-2' src={item.image} alt={item.speciality} />
            <p>{item.speciality}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SpecialityMenu;