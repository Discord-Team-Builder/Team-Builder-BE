import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_AUTH_USER, SMTP_AUTH_PASS, MAIL_FROM } from '../config/nodemailer.js';
import ApiError from '../utils/api-error.js';
import { StatusCode } from './constants/statusCode.js';

const transport = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: SMTP_AUTH_USER, // generated ethereal user
    pass: SMTP_AUTH_PASS  // generated ethereal password
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    // Verify the connection configuration
    await transport.verify();
  }
  catch (error) {
    console.error('Error verifying SMTP connection:', error);
    throw new ApiError(StatusCode.INTERNAL_SERVER_ERROR, 'SMTP connection verification failed', [error.message], error.stack);
  }
  // Send email
  try {
    await transport.sendMail({
      from: `${MAIL_FROM}`,
      to,
      subject,
      html,
    });
  }
  catch (error) {
    console.error('Error sending email:', error);
    throw new ApiError(StatusCode.INTERNAL_SERVER_ERROR, 'Failed to send email', [error.message], error.stack);
  }
  
};

export default sendEmail;  