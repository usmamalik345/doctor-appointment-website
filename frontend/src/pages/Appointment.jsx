import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets_frontend/assets'
import RelatedDoctor from '../components/RelatedDoctor'

const Appointment = () => {
  const { docId } = useParams()
  const navigate = useNavigate()
  
  const { 
    doctors, 
    currencySymbol,
    docSlots,
    slotIndex,
    setSlotIndex,
    slotTime,
    setSlotTime,
    daysOfWeek,
    getAvailableSlots,
    bookManualAppointment,
    resetBookingState,
    token
  } = useContext(AppContext)

  const [docInfo, setDocInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleBookAppointment = async () => {
    if (!token) {
      navigate('/login')
      return
    }

    if (!slotTime) {
      alert('Please select a time slot')
      return
    }

    setIsLoading(true)
    try {
      await bookManualAppointment(docId)
      navigate('/my-appointments')
    } catch (error) {
      console.error('Booking error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load doctor info when doctors array is ready or docId changes
  useEffect(() => {
    if (doctors.length > 0 && docId) {
      const foundDoc = doctors.find(doc => doc._id === docId)
      setDocInfo(foundDoc)
      setImageError(false) // Reset image error when doctor changes
    }
  }, [doctors.length, docId]) // Only depend on length, not entire array

  // Get available slots when doctor info is loaded
  useEffect(() => {
    if (docInfo) {
      getAvailableSlots(docInfo)
    }
  }, [docInfo?.name]) // Only depend on doctor name, not entire object

  // Cleanup booking state when docId changes
  useEffect(() => {
    return () => {
      resetBookingState()
    }
  }, [docId])

  // Show loading state while doctor info is being fetched
  if (!docInfo && doctors.length > 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctor information...</p>
        </div>
      </div>
    )
  }

  // Show error state if doctor not found
  if (doctors.length > 0 && !docInfo) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Doctor Not Found</h2>
          <p className="text-gray-600 mb-6">The doctor you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => navigate('/doctors')}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Browse All Doctors
          </button>
        </div>
      </div>
    )
  }

  return docInfo && (
    <div className="container mx-auto px-4 py-8">
      {/* Doctor Details */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        <div className="flex-shrink-0">
          <img 
            className='bg-primary w-full sm:max-w-72 rounded-lg object-cover aspect-square' 
            src={imageError ? 'https://via.placeholder.com/288x288?text=Doctor' : docInfo.image} 
            alt={docInfo.name}
            onError={() => {
              if (!imageError) {
                setImageError(true)
              }
            }}
          />
        </div>

        <div className="flex-1 border border-gray-400 rounded-lg p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <h1 className="text-2xl font-semibold text-gray-900">{docInfo.name}</h1>
            <img className='w-5 h-5' src={assets.verified_icon} alt="Verified" />
          </div>

          <div className="flex items-center gap-2 text-sm mb-4 text-gray-600">
            <p>{docInfo.degree} - {docInfo.speciality}</p>
            <span className='py-1 px-3 border border-gray-300 text-xs rounded-full bg-gray-50'>
              {docInfo.experience}
            </span>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-medium text-gray-900">About</h3>
              <img src={assets.info_icon} alt="Info" className="w-4 h-4" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed max-w-[700px]">
              {docInfo.about}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium">Appointment fee:</span>
            <span className='text-gray-800 font-bold text-lg'>
              {currencySymbol}{docInfo.fees}
            </span>
          </div>
        </div>
      </div>

      {/* Booking Slots */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Book Your Appointment</h2>

        {/* Date Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Select Date</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {docSlots.length > 0 && docSlots.map((item, index) => (
              <div 
                key={index}
                onClick={() => {
                  setSlotIndex(index)
                  setSlotTime('')
                }}
                className={`text-center py-4 px-4 min-w-16 rounded-lg cursor-pointer transition-all duration-200 flex-shrink-0 ${
                  slotIndex === index 
                    ? 'bg-primary text-white shadow-md' 
                    : 'border border-gray-300 hover:border-primary hover:bg-primary/5'
                }`}
              >
                <p className="text-xs font-medium">
                  {item[0] && daysOfWeek[item[0].datetime.getDay()]}
                </p>
                <p className="text-lg font-semibold mt-1">
                  {item[0] && item[0].datetime.getDate()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Time Selection */}
        {docSlots.length > 0 && docSlots[slotIndex] && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Select Time ({docSlots[slotIndex].length} slots available)
            </h3>
            <div className='flex flex-wrap gap-3 max-h-48 overflow-y-auto'>
              {docSlots[slotIndex].map((item, index) => (
                <button
                  key={index}
                  onClick={() => setSlotTime(item.time)}
                  className={`text-sm px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    item.time === slotTime 
                      ? 'bg-primary text-white shadow-md' 
                      : 'text-gray-600 border border-gray-300 hover:border-primary hover:bg-primary/5'
                  }`}
                >
                  {item.time}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Appointment Summary */}
        {slotTime && docSlots[slotIndex] && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-800 mb-2">Appointment Summary</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Doctor:</span> {docInfo.name}</p>
              <p><span className="font-medium">Date:</span> {docSlots[slotIndex][0]?.datetime.toDateString()}</p>
              <p><span className="font-medium">Time:</span> {slotTime}</p>
              <p><span className="font-medium">Fee:</span> {currencySymbol}{docInfo.fees}</p>
            </div>
          </div>
        )}

        {/* Book Appointment Button */}
        <button 
          onClick={handleBookAppointment}
          disabled={!slotTime || isLoading}
          className="bg-primary hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium px-8 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Booking...
            </>
          ) : (
            'Book Appointment'
          )}
        </button>

        {!slotTime && (
          <p className="text-sm text-gray-500 mt-2">
            Please select a date and time to book your appointment
          </p>
        )}
      </div>

      {/* Related Doctors */}
      <div className="mt-12">
        <RelatedDoctor docId={docId} speciality={docInfo.speciality} />
      </div>
    </div>
  )
}

export default Appointment