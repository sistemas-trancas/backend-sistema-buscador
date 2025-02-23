const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const User = require("./models/usuario");

dotenv.config();

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conexión a MongoDB exitosa");

    const username = "zetadev";
    const password = "zetadev1234"; // Cambia esto a una contraseña segura
    const role = "admin";
    const area = "679b1c0cc4c6ec85ca95c3ce";
    const dni = "00000000";

    // Verificar si el usuario administrador ya existe
    const existingAdmin = await User.findOne({ dni });
    if (existingAdmin) {
      console.log("El usuario administrador ya existe");
      return;
    }

    // Crear el usuario administrador
    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = new User({
      username,
      password: hashedPassword,
      role,
      area,
      dni,
    });

    await adminUser.save();
    console.log("Usuario administrador creado exitosamente");
  } catch (err) {
    console.error("Error al crear el usuario administrador:", err);
  } finally {
    mongoose.connection.close();
  }
};

createAdminUser();