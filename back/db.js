const mongoose = require('mongoose');

module.exports = async function connectDB() {
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI não definido — pulando conexão com MongoDB');
    return;
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log('MongoDB Atlas conectado');
};
