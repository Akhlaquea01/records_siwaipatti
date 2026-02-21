import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security headers (relax CSP for Swagger UI)
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        },
    })
);

// CORS
app.use(
    cors({
        origin: process.env['CORS_ORIGIN'] ?? '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger UI (available at /api/v1/docs)
app.use(
    '/api/v1/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'Rent Management API – Docs',
        customCss: `.swagger-ui .topbar { background-color: #1a1a2e; } .swagger-ui .topbar-wrapper img { display: none; } .swagger-ui .topbar-wrapper::after { content: '🏠 Rent Management API'; color: white; font-size: 1.2rem; font-weight: bold; margin-left: 1rem; }`,
        swaggerOptions: { persistAuthorization: true },
    })
);

// Serve raw OpenAPI spec as JSON
app.get('/api/v1/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// API routes
app.use('/api/v1', apiRoutes);

// 404 fallback
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found', data: null });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
