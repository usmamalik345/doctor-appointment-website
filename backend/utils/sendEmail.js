import nodemailer from 'nodemailer'

export const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.GMAIL_EMAIL,
      to,
      subject,
      text,
    });

    console.log('Email sent:', info.messageId);

    // ✅ Return success object
    return {
      success: true,
      messageId: info.messageId,
    };

  } catch (err) {
    console.error("Email sending failed:", err);

    // ✅ Return failure object
    return {
      success: false,
      error: err.message,
    };
  }
};
