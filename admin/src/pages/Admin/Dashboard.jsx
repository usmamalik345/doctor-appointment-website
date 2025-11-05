import React, { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { assets } from '../../assets/assets_admin/assets'
import { AppContext } from '../../context/AppContext'

const Dashboard = () => {
  const { aToken, cancelAppoitment, dashData, getDashData } = useContext(AdminContext)
  const { slotDateFormat } = useContext(AppContext)

  useEffect(() => {
    if (aToken) {
      getDashData()
    }
  }, [aToken, getDashData])

  // Guard against dashData being null/undefined
  if (!dashData) {
    return <div className="m-5 text-center">Loading dashboard...</div>
  }

  return (
    <div className='m-5'>
      {/* Stats Cards */}
      <div className='flex flex-wrap gap-3'>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.doctor_icon} alt="Doctors" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.doctors ?? 0}</p>
            <p className='text-gray-400'>Doctors</p>
          </div>
        </div>

        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.appointments_icon} alt="Appointments" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.appointments ?? 0}</p>
            <p className='text-gray-400'>Appointments</p>
          </div>
        </div>

        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.patients_icon} alt="Patients" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.patients ?? 0}</p>
            <p className='text-gray-400'>Patients</p>
          </div>
        </div>
      </div>

      {/* Latest Bookings */}
      <div className='bg-white mt-10'>
        <div className='flex items-center gap-2.5 px-4 py-4 rounded-t border'>
          <img src={assets.list_icon} alt="List" />
          <p className='font-semibold'>Latest Bookings</p>
        </div>

        <div className='pt-4 border border-t-0'>
          {(dashData.lastestAppointments || []).map((item, index) => (
            <div
              className='flex items-center px-6 py-3 gap-3 hover:bg-gray-100'
              key={item._id || index} // use _id if available
            >
              {/* Safe Image with Fallback */}
              <img
                className='rounded-full w-10'
                src={item?.docData?.image || 'https://via.placeholder.com/40?text=Dr'}
                alt={item?.docData?.name || 'Doctor'}
                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40?text=Dr')}
              />

              <div className='flex-1 text-sm'>
                <p className='text-gray-800 font-medium'>
                  {item?.docData?.name || 'Unknown Doctor'}
                </p>
                <p className='text-gray-600'>{slotDateFormat(item.slotDate)}</p>
              </div>

              {item.cancelled ? (
                <p className='text-red-400 text-xs font-medium'>Cancelled</p>
              ) : (
                <img
                  onClick={() => cancelAppoitment(item._id)}
                  className='w-10 cursor-pointer'
                  src={assets.cancel_icon}
                  alt="Cancel"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard