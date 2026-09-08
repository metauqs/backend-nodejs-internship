const mongoose = require('mongoose');

async function connectDB() {
    await mongoose.connect(process.env.DBURL);
    console.log('MongoDB connected');
 }

module.exports = connectDB;