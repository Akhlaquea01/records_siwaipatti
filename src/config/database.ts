import mongoose from 'mongoose';

const MONGODB_URL = process.env.MONGODB_URL as string;
const DB_NAME = process.env.DB_NAME as string;

if (!MONGODB_URL) {
    throw new Error('MONGODB_URL environment variable is not defined');
}
if (!DB_NAME) {
    throw new Error('DB_NAME environment variable is not defined');
}

export const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(`${MONGODB_URL}/${DB_NAME}`);
        console.log(`✅ MongoDB connected: ${conn.connection.host} → DB: ${conn.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};
