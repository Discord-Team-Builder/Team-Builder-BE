import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_AUTH_USER, SMTP_AUTH_PASS } from '../config/nodemailer.js';

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

export default transport;  