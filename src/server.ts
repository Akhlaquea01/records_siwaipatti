import { connectDB } from './config/database.js';
import app from './app.js';

const PORT = parseInt(process.env['PORT'] ?? '5000', 10);
const NODE_ENV = process.env['NODE_ENV'] ?? 'development';

const startServer = async (): Promise<void> => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT} [${NODE_ENV}]`);
        console.log(`📡 API base: http://localhost:${PORT}/api/v1`);
        console.log(`🔍 Health:   http://localhost:${PORT}/api/v1/health`);
    });
};

startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
