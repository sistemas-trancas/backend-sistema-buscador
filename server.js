const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const expedientesRoutes = require('./routes/expedientesRoutes');
const userRoutes = require('./routes/userRoutes');
const areasRoutes = require('./routes/areasRoutes');

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Conexión a MongoDB exitosa'))
  .catch((err) => console.error('Error al conectar con MongoDB:', err));

// Rutas
app.use('/api/expedientes', expedientesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/areas', areasRoutes);

// Inicio del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});