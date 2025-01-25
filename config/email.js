const nodemailer = require("nodemailer");

// Configuración del transporte SMTP para Mailgun
const transporter = nodemailer.createTransport({
  host: "smtp.mailgun.org", // Host SMTP de Mailgun
  port: 587, // Puerto recomendado para STARTTLS
  auth: {
    user: "postmaster@sandboxb9039b27e8ce445e8180c022ddda9502.mailgun.org", // Usuario SMTP
    pass: "883e8010a93d71ba47691ed8613aa270-9c3f0c68-bce1a321", // Contraseña SMTP
  },
});

module.exports = transporter;