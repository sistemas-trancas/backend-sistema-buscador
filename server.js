require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { dbConnection } = require("./config/db");

const app = express();
const port = process.env.PORT || 6000;

// Configuración de CORS
const corsOptions = {
  origin: "*", // Permitir solicitudes desde cualquier origen
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Middlewares
app.use(express.json());

// Conectar a MongoDB
dbConnection();

// Rutas
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/user"));

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
