import axios from 'axios'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import userModel from '../models/userModel.js'

const SPECIALTY_MAP = {
  'back pain': 'Orthopedic',
  'skin': 'Dermatologist',
  'heart': 'Cardiologist',
  'lungs': 'Pulmonologist',
  'children': 'Pediatrician',
  'general': 'General physician',
  'physician': 'General physician',
}

export function formatTimeTo12Hour(timeString) {
  const [hour, minute] = timeString.split(':').map(Number);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

export const aiBookAppointment = async (req, res) => {
  try {
    const { query } = req.body
    const userId = req.body.userId || req.user?.id

    if (!query || !userId) {
      return res.status(400).json({ success: false, message: 'Query or user ID is missing' })
    }

    const prompt = `
You are a JSON-only parser. Extract the following from the sentence:
- "symptom"
- "recommendedSpecialties": an array of up to 3 doctor specialties
- "doctorName"
- "date" (YYYY-MM-DD)
- "time" (24-hour format like "16:00")

Sentence: "${query}"

Example Output:
{
  "symptom": "back pain",
  "recommendedSpecialties": ["Orthopedic", "Physiotherapist"],
  "doctorName": "",
  "date": "2025-07-25",
  "time": "06:55"
}`.trim()

    const input = `<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n${prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`

    const aiResponse = await axios.post(
      'https://api.deepinfra.com/v1/inference/meta-llama/Meta-Llama-3-8B-Instruct',
      { input, stop: ['<|eot_id|>'] },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const raw = aiResponse.data?.results?.[0]?.generated_text
    if (!raw) return res.status(500).json({ success: false, message: 'Empty response from AI' })

    let parsed
    try {
      const jsonMatch = raw.match(/{[^}]*}/s)
      if (!jsonMatch) throw new Error('Invalid JSON')
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      return res.status(500).json({ success: false, message: 'Invalid JSON format from AI' })
    }

    const { symptom, recommendedSpecialties = [], doctorName = '', date, time } = parsed
    if (!date || !time) return res.status(400).json({ success: false, message: 'Date or time missing' })

    let matchedDoctors = []

    if (doctorName) {
      const doctorByName = await doctorModel.findOne({
        name: new RegExp(`^${doctorName}$`, 'i'),
        available: true
      }).select('-password')

      if (doctorByName) {
        const booked = await appointmentModel.findOne({
          docId: doctorByName._id, slotDate: date, slotTime: time, cancelled: false
        })
        if (!booked) matchedDoctors.push(doctorByName)
      }
    }

    if (matchedDoctors.length === 0 && recommendedSpecialties.length > 0) {
      for (let specialty of recommendedSpecialties) {
        const doctors = await doctorModel.find({
          speciality: new RegExp(`^${specialty}$`, 'i'),
          available: true
        }).select('-password')

        for (let doc of doctors) {
          const booked = await appointmentModel.findOne({
            docId: doc._id, slotDate: date, slotTime: time, cancelled: false
          })
          if (!booked) matchedDoctors.push(doc)
        }

        if (matchedDoctors.length > 0) break
      }
    }

    if (matchedDoctors.length === 0 && symptom) {
      const fallback = SPECIALTY_MAP[symptom.toLowerCase()]
      if (fallback) {
        const doctors = await doctorModel.find({
          speciality: new RegExp(`^${fallback}$`, 'i'),
          available: true
        }).select('-password')

        for (let doc of doctors) {
          const booked = await appointmentModel.findOne({
            docId: doc._id, slotDate: date, slotTime: time, cancelled: false
          })
          if (!booked) matchedDoctors.push(doc)
        }
      }
    }

    if (matchedDoctors.length === 0) {
      return res.status(404).json({ success: false, message: 'No available doctor found for the given condition and time' })
    }

    if (matchedDoctors.length === 1) {
      const doctor = matchedDoctors[0]
      const userData = await userModel.findById(userId).select('-password')
      if (!userData) return res.status(404).json({ success: false, message: 'User not found' })

      const appointment = await appointmentModel.create({
        userId,
        docId: doctor._id,
        slotDate: date,
        slotTime: time,
        userData,
        docData: doctor,
        amount: doctor.fees || 0,
        date: Date.now()
      })

      return res.status(200).json({
        success: true,
        message: `Appointment booked with ${doctor.name} (${doctor.speciality}) on ${date} at ${time}`,
        data: appointment
      })
    }

    return res.status(200).json({
      success: true,
      message: `We found ${matchedDoctors.length} available doctors. Please select one to confirm booking.`,
      suggestions: matchedDoctors.map(doc => ({
        _id: doc._id,
        name: doc.name,
        specialty: doc.speciality,
        experience: doc.experience,
        fees: doc.fees,
        image: doc.image,
        date,       
        time: formatTimeTo12Hour(time)
 
      }))
    })

  } catch (error) {
    console.error('AI appointment error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong while booking the appointment' })
  }
}

export const confirmAppointment = async (req, res) => {
  try {
    const { userId, docId, date, time } = req.body;

    if (!userId || !docId || !date || !time) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const doctor = await doctorModel.findById(docId).select('-password');
    if (!doctor || !doctor.available) {
      return res.status(404).json({ success: false, message: 'Doctor not found or unavailable' });
    }

    const userData = await userModel.findById(userId).select('-password');
    if (!userData) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const existing = await appointmentModel.findOne({
      docId,
      slotDate: date,
      slotTime: time,
      cancelled: false
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Time slot already booked' });
    }

    const appointment = await appointmentModel.create({
      userId,
      docId,
      slotDate: date,
      slotTime: time,
      userData,
      docData: doctor,
      amount: doctor.fees || 0,
      date: Date.now()
    });

    return res.status(200).json({
      success: true,
      message: `Appointment confirmed with ${doctor.name} on ${date} at ${formatTimeTo12Hour(time)}`,
      data: appointment
    });

  } catch (err) {
    console.error('Confirm appointment error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

