import mongoose from 'mongoose';

const MONGODB_URL = process.env.MONGODB_URL as string;
const DB_NAME = process.env.DB_NAME as string;
const NODE_ENV = process.env.NODE_ENV ?? 'development';

if (!MONGODB_URL) {
    throw new Error('MONGODB_URL environment variable is not defined');
}
if (!DB_NAME) {
    throw new Error('DB_NAME environment variable is not defined');
}

import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

export const connectDB = async (): Promise<void> => {
    try {
        const connectionString = `${MONGODB_URL}/${DB_NAME}`;
        const conn = await mongoose.connect(connectionString);
        console.log(`✅ MongoDB connected: ${conn.connection.host} → DB: ${conn.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        if (NODE_ENV === 'production') {
            // In production, a DB failure is unrecoverable — exit cleanly
            process.exit(1);
        } else {
            // In development, keep the server alive so routes/Swagger still work
            console.warn('⚠️  Running without database – API calls that hit MongoDB will fail.');
        }
    }
};
