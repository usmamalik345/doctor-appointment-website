// cron/reminderCron.js
import cron from 'node-cron'
import { sendEmail } from '../utils/sendEmail.js'
import appointmentModel from '../models/appointmentModel.js'
import userModel from '../models/userModel.js'

// Run every minute
cron.schedule('*/15 * * * *', async () => {
  try {
    const now = Date.now()
    
    // Send reminders for appointments in the next 1 hour
    const oneHourFromNow = now + 60 * 60 * 1000
    
    // Also send reminders for appointments that started up to 15 minutes ago
    // (in case the cron missed them)
    const fifteenMinutesAgo = now - 15 * 60 * 1000

    console.log('=== REMINDER CRON RUNNING ===')
    console.log('Current time:', new Date(now).toLocaleString())
    console.log('Looking for appointments between:', new Date(fifteenMinutesAgo).toLocaleString(), 'and', new Date(oneHourFromNow).toLocaleString())

    const upcomingAppointments = await appointmentModel.find({
      cancelled: false,
      isCompleted: false,
      reminderSent: { $ne: true }, // Prevent duplicate reminders
      date: { 
        $gte: fifteenMinutesAgo,  // Include recent past appointments
        $lte: oneHourFromNow      // Up to 1 hour in future
      },
    })

    console.log(`Found ${upcomingAppointments.length} appointments needing reminders`)

    let successCount = 0;
    let failureCount = 0;

    for (let appt of upcomingAppointments) {
      try {
        const user = await userModel.findById(appt.userId)
        if (!user || !user.email) {
          console.log(`Skipping appointment ${appt._id}: User not found or no email`)
          continue;
        }

        console.log(`Processing appointment for ${user.email} at ${new Date(appt.date).toLocaleString()}`)
        
        const message = `Hi ${user.name},\n\nThis is a reminder for your appointment with Dr. ${appt.docData.name} at ${appt.slotTime} on ${appt.slotDate}.\n\nThanks!`
        
        const emailResult = await sendEmail(user.email, 'Appointment Reminder', message)
        
        if (emailResult && emailResult.success) {
          // Mark reminder as sent
          await appointmentModel.findByIdAndUpdate(appt._id, { 
            reminderSent: true,
            reminderSentAt: new Date()
          })
          successCount++;
          console.log(`✓ Reminder sent to ${user.email}`)
        } else {
          failureCount++;
          // Safe error logging - handle cases where emailResult is undefined/null
          const errorMessage = emailResult?.error || 'Email service returned no result'
          console.error(`✗ Failed to send reminder for appointment ${appt._id}:`, errorMessage)
        }
        
        // Small delay between emails to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        failureCount++;
        console.error(`Error processing appointment ${appt._id}:`, error.message || error)
      }
    }

    console.log(`=== REMINDER CRON COMPLETED ===`)
    console.log(`Time: ${new Date().toLocaleString()}`)
    console.log(`Reminders sent: ${successCount}`)
    console.log(`Failures: ${failureCount}`)
    console.log('=====================================\n')
    
  } catch (error) {
    console.error('Reminder Cron Error:', error.message || error)
  }
})
