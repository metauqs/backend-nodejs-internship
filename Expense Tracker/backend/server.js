require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const port = Number(process.env.PORT || 5000);
async function start() {
    try {
        await connectDB();
        const server = app.listen(port, () => console.log(`Expense Tracker API listening at http://localhost:${port}`));
        const shutdown = (signal) => {
            console.log(`${signal} received; shutting down...`);
            server.close(async () => {
                await mongoose.connection.close();
                process.exit(0);
            });
        };
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    }
    catch (error) {
        console.error('Unable to start API:', error.message);
        process.exit(1);
    }
}
start();
