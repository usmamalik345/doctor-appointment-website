import React, { useContext, useState } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'
import { AdminContext } from '../context/AdminContext'
import { useNavigate } from 'react-router-dom';

const DoctorLogin = () => {
  const navigate = useNavigate();
    
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Get setDToken from context instead of using local state
  const { backendUrl, setDToken } = useContext(AdminContext)

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      const { data } = await axios.post(backendUrl + '/api/admin/login-doctors', {
        email,
        password,
      });
  
      if (data.success) {
        localStorage.setItem('dToken', data.dtoken);
        localStorage.setItem('doctorId', data.doctor._id); // ✅ save doctorId
        setDToken(data.dtoken);
        setDoctorId(data.doctor._id); // ✅ update context
        navigate('/doctor-dashboard');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Doctor login failed');
    }
  };
  

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5e5e5e] text-sm shadow-lg'>
        <p className='text-2xl font-semibold m-auto'>
          <span className='text-primary'>Doctor</span> Login
        </p>

        <div className='w-full'>
          <p>Email</p>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            className='border border-[#dadada] rounded w-full p-2 mt-1'
            type='email'
            required
          />
        </div>

        <div className='w-full'>
          <p>Password</p>
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            className='border border-[#dadada] rounded w-full p-2 mt-1'
            type='password'
            required
          />
        </div>

        <button className='bg-primary text-white w-full py-2 rounded-md text-base'>
          Login
        </button>
        <p>Admin Login? <span className='text-primary underline cursor-pointer text-xs' onClick={() => navigate('/login')}>Click Here</span></p>
      </div>
    </form>
  )
}

export default DoctorLogin