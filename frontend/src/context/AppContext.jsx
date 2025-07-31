import { createContext, useEffect, useState, useMemo, useCallback } from "react";
import { toast } from 'react-toastify'
import axios from 'axios'

export const AppContext = createContext();

const AppContextProvider = (props) => {

  const currencySymbol = '$'
  const backendUrl = import.meta.env.VITE_BACKEND_URL
  
  // Existing states
  const [directAppointment, setdirectAppointment] = useState(null);
  const [confirmAppointmentreq, setconfirmAppointmentreq] = useState({})
  const [doctors, setDoctors] = useState([])
  const [token, setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : false)
  const [userData, setUserData] = useState(false)
  
  // Booking slots states
  const [docSlots, setDocSlots] = useState([])
  const [slotIndex, setSlotIndex] = useState(0)
  const [slotTime, setSlotTime] = useState('')
  
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  // Existing AI booking function
  const bookAppointment = async (query) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/ai-booking',
        { query },
        {
          headers: {
            token: token
          }
        }
      );

      if (data.success) {
        console.log(data);
        setdirectAppointment(data.suggestions);
      } else {
        toast.error(data.message);
        throw new Error(data.message);
      }

    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
      throw error;
    }
  };

  // Confirm appointment function
  const confirmAppointment = async (appointmentData) => {
    try {
      const requestData = appointmentData.userId ? appointmentData : {
        userId: userData._id,
        doctorId: appointmentData._id,
        date: appointmentData.date,
        time: appointmentData.time,
      };

      const { data } = await axios.post(
        backendUrl + '/api/confirm-appointment',
        requestData,
        {
          headers: {
            token: token
          }
        }
      );

      if (data.success) {
        setconfirmAppointmentreq(data.suggestions);
        toast.success("Appointment confirmed successfully!");
      } else {
        toast.error(data.message);
      }

    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Memoize getAvailableSlots to prevent infinite loops
  const getAvailableSlots = useCallback(async (docInfo) => {
    console.log('Calculating available slots for:', docInfo._id)

    setDocSlots([])

    // getting current date
    let today = new Date()

    for (let i = 0; i < 7; i++) {
      // getting date with index
      let currentDate = new Date(today)
      currentDate.setDate(today.getDate() + i)

      // setting end time of the date with index
      let endTime = new Date()
      endTime.setDate(today.getDate() + i)
      endTime.setHours(21, 0, 0, 0)

      // setting hours
      if (today.getDate() === currentDate.getDate()) {
        currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10)
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0)
      } else {
        currentDate.setHours(10)
        currentDate.setMinutes(0)
      }

      let timeSlots = []

      while (currentDate < endTime) {
        let formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        let day = currentDate.getDate()
        let month = currentDate.getMonth() + 1
        let year = currentDate.getFullYear()

        const slotDate = day + '_' + month + '_' + year
        const slotTime = formattedTime

        const isSlotAvailable = docInfo.slots_booked[slotDate] && docInfo.slots_booked[slotDate].includes(slotTime) ? false : true

        if (isSlotAvailable) {
          // add slot to array
          timeSlots.push({ datetime: new Date(currentDate), time: formattedTime })
        }

        // Increment current time by 30 minutes
        currentDate.setMinutes(currentDate.getMinutes() + 30)
      }

      setDocSlots(prev => ([...prev, timeSlots]))
    }
  }, [])

  // Book appointment with manual slot selection
  const bookManualAppointment = useCallback(async (docId) => {
    if (!token) {
      toast.warn('Login to book appointment')
      return
    }

    try {
      const date = docSlots[slotIndex][0].datetime

      let day = date.getDate()
      let month = date.getMonth() + 1
      let year = date.getFullYear()

      const slotDate = day + '_' + month + '_' + year

      const { data } = await axios.post(backendUrl + '/api/user/book-appointment', { docId, slotDate, slotTime }, { headers: { token } })

      if (data.success) {
        toast.success(data.message)
        getDoctorsData()
        resetBookingState()
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }, [docSlots, slotIndex, slotTime, token, backendUrl])

  // Helper function to reset booking state
  const resetBookingState = useCallback(() => {
    setDocSlots([])
    setSlotIndex(0)
    setSlotTime('')
  }, [])

  const getDoctorsData = useCallback(async () => {
    try {
      console.log('Fetching doctors...')

      const { data } = await axios.get(backendUrl + '/api/doctor/list')
      console.log(data, "check data")
      if (data.success) {
        console.log('Setting doctors...')
        setDoctors(data.doctors)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }, [backendUrl])

  const loadUserProfileData = useCallback(async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/user/get-profile', { headers: { token } })
      if (data.success) {
        setUserData(data.userData)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }, [backendUrl, token])

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // Existing values
    doctors, 
    getDoctorsData,
    bookAppointment,
    confirmAppointment,
    directAppointment,
    confirmAppointmentreq,
    currencySymbol,
    token, 
    setToken,
    backendUrl,
    userData, 
    setUserData,
    loadUserProfileData,
    
    // Booking slots related values
    docSlots,
    setDocSlots,
    slotIndex,
    setSlotIndex,
    slotTime,
    setSlotTime,
    daysOfWeek,
    getAvailableSlots,
    bookManualAppointment,
    resetBookingState
  }), [
    doctors,
    getDoctorsData,
    directAppointment,
    confirmAppointmentreq,
    token,
    userData,
    loadUserProfileData,
    docSlots,
    slotIndex,
    slotTime,
    getAvailableSlots,
    bookManualAppointment,
    resetBookingState
  ])

  useEffect(() => {
    getDoctorsData()
  }, [getDoctorsData])

  useEffect(() => {
    if (token) {
      loadUserProfileData()
    } else {
      setUserData(false)
    }
  }, [token, loadUserProfileData])

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  )
}

export default AppContextProvider