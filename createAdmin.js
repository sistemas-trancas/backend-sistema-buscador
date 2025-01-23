const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conexión a MongoDB exitosa');

    const username = 'admin';
    const password = 'adminmaster007'; // Cambia esto a una contraseña segura
    const role = 'admin';
    const area = 'administration';

    // Verificar si el usuario administrador ya existe
    const existingAdmin = await User.findOne({ username });
    if (existingAdmin) {
      console.log('El usuario administrador ya existe');
      mongoose.connection.close();
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = new User({
      username,
      password: hashedPassword,
      role,
      area,
    });

    await adminUser.save();
    console.log('Usuario administrador creado exitosamente');
    mongoose.connection.close();
  } catch (err) {
    console.error('Error al crear usuario administrador:', err);
    mongoose.connection.close();
  }
};

createAdminUser();