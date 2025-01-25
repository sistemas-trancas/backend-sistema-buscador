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
    const password = "adminmaster007"; // Cambia esto a una contraseña segura
    const role = "admin";
    const area = "administration";
    const dni = "12345679";
    const email = "admin3@zetadev.com";

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
      email,
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