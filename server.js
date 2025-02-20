require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { dbConnection } = require('./config/db');

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar a MongoDB
dbConnection();

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/areas', require('./routes/areas')); 
app.use('/api/expedientes', require('./routes/expedientes'));


// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});