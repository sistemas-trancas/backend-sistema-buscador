const nodemailer = require("nodemailer");
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.MAILGUN_HOST,
  port: process.env.MAILGUN_PORT,
  auth: {
    user: process.env.MAILGUN_USER,
    pass: process.env.MAILGUN_PASS,
  },
});

module.exports = transporter;