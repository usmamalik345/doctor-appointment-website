import jwt from 'jsonwebtoken'
import doctorModel from '../models/doctorModel.js'

// Unified authentication middleware - admin ya doctor dono ko allow karta hai
const authAdminOrDoctor = async (req, res, next) => {
  try {
    const { atoken, dtoken } = req.headers
    
    // Admin authentication check
    if (atoken) {
      const token_decode = jwt.verify(atoken, process.env.JWT_SECRET)
      if (token_decode === process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
        req.user = { role: 'admin', type: 'admin' }
        return next()
      }
    }
    
    // Doctor authentication check
    if (dtoken) {
      const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET)
      const doctor = await doctorModel.findById(token_decode.id)
      if (doctor) {
        req.user = { 
          role: 'doctor', 
          type: 'doctor',
          id: doctor._id,
          email: doctor.email,
          doctorData: doctor
        }
        return next()
      }
    }
    
    return res.json({ success: false, message: 'Not Authorized Login Again' })
    
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: 'Authentication failed' })
  }
}

// Admin only middleware
const authAdmin = async (req, res, next) => {
  try {
    const { atoken } = req.headers
    if (!atoken) {
      return res.json({ success: false, message: 'Admin access required' })
    }
    const token_decode = jwt.verify(atoken, process.env.JWT_SECRET)
    if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
      return res.json({ success: false, message: 'Admin access required'})
    }
    req.user = { role: 'admin', type: 'admin' }
    next()
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Doctor only middleware
const authDoctorOnly = async (req, res, next) => {
  try {
    const { dtoken } = req.headers
    if (!dtoken) {
      return res.json({ success: false, message: 'Doctor access required' })
    }
    const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET)
    const doctor = await doctorModel.findById(token_decode.id)
    if (!doctor) {
      return res.json({ success: false, message: 'Doctor not found' })
    }
    req.user = { 
      role: 'doctor', 
      type: 'doctor',
      id: doctor._id,
      email: doctor.email,
      doctorData: doctor
    }
    next()
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { authAdminOrDoctor, authAdmin, authDoctorOnly }