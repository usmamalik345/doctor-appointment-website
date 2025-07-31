import express from 'express'
import authUser from '../middlewares/authUser.js'
import {aiBookAppointment, confirmAppointment} from '../controllers/aiController.js'

const aiRouter = express.Router()

aiRouter.post('/ai-booking', authUser, aiBookAppointment)
aiRouter.post('/confirm-appointment', confirmAppointment);


export default aiRouter
