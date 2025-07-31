import validator from "validator"
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from "../models/doctorModel.js"
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js"
import userModel from "../models/userModel.js"

// API for adding doctor
const addDoctor = async (req, res) => {

  try {

    const { name, email, password, speciality, degree, experience, about, fees, address } = req.body
    const imageFile = req.file

    // checking for all data to add doctor
    if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
      return res.json({ success: false, message: 'Missing Details' })
    }

    // validating email format
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: 'Please enter a valid email' })
    }

    // validating strong password
    if (password.length < 8) {
      return res.json({ success: false, message: 'Please enter a strong password' })
    }

    // hashing doctor password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // upload image to cloudinary

    const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' })
    const imageUrl = imageUpload.secure_url

    const doctorData = {
      name, email, image: imageUrl, password: hashedPassword, speciality,
      degree, experience, about,  fees,
      address: JSON.parse(address),
      role: req.body.role || 'doctor',  
      date: Date.now(),
    }

    const newDoctor = new doctorModel(doctorData)
    await newDoctor.save()

    res.json({ success: true, message: 'Doctor Added' })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }

}

const loginDoctor = async (req, res) => {
  const { email, password } = req.body
  const doctor = await doctorModel.findOne({ email })
  if (!doctor) return res.json({ success: false, message: 'Doctor not found' })
  
  const isMatch = await bcrypt.compare(password, doctor.password)
  if (!isMatch) return res.json({ success: false, message: 'Invalid credentials' })
  
  const token = jwt.sign(
    {
      id: doctor._id,
      role: doctor.role, 
      email: doctor.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
  
  // dtoken return kar rahe hain doctor ke liye
  res.json({ success: true, dtoken: token, doctor })
}


// API for admin Login
const loginAdmin = async (req, res) => {
  try {

    const { email, password } = req.body

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET)
      res.json({ success: true, token })
    } else {
      res.json({ success: false, message: 'Invalid Credentials' })
    }

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {

  try {

    const doctors = await doctorModel.find({}).select('-password')
    res.json({ success: true, doctors })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }

}

// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
  try {
    const dToken = req.headers.dtoken;
    const aToken = req.headers.atoken;

    let filter = {};

    // If doctor is logged in
    if (dToken) {
      const decoded = jwt.verify(dToken, process.env.JWT_SECRET);
      filter.docId = decoded.id; // Only get this doctor's appointments
    }

  

    const appointments = await appointmentModel.find(filter);
    res.json({ success: true, appointments });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for appointment cancellation
const appointmentCancel = async (req, res) => {

  try {

    const { appointmentId } = req.body
    const appointmentData = await appointmentModel.findById(appointmentId)

    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

    // releasing doctor slot
    const { docId, slotDate, slotTime } = appointmentData
    const doctorData = await doctorModel.findById(docId)
    let slots_booked = doctorData.slots_booked

    slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

    await doctorModel.findByIdAndUpdate(docId, { slots_booked })

    res.json({ success: true, message: 'Appointment Cancelled' })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }

}

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {

  try {

    const doctors = await doctorModel.find({})
    const users = await userModel.find({})
    const appointments = await appointmentModel.find({})

    const dashData = {
      doctors: doctors.length,
      appointments: appointments.length,
      patients: users.length,
      lastestAppointments: appointments.reverse().slice(0, 5)
    }

    res.json({ success: true, dashData })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message})
  }

}
      
export { addDoctor, loginAdmin, allDoctors, appointmentsAdmin, appointmentCancel, adminDashboard , loginDoctor }