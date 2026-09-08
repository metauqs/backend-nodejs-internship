const mongoose = require('mongoose');

async function connectDB() {
    await mongoose.connect('mongodb+srv://Tauqs:tauqs@tauqs.5jypdc9.mongodb.net/Practice');
    console.log('MongoDB connected');
 }

module.exports = connectDB;