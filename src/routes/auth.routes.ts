import { Router, Request, Response } from 'express';
import type { OpenAPIV3 } from 'openapi-types';

const router = Router();

export const paths: OpenAPIV3.PathsObject = {
    '/auth/login': {
        post: {
            summary: 'Verify passkey for login',
            tags: ['Authentication'],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['password'],
                            properties: {
                                password: {
                                    type: 'string',
                                    description: 'The master passkey (from environment)',
                                    example: '12345'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Login successful',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Login successful' }
                                }
                            }
                        }
                    }
                },
                401: {
                    description: 'Invalid password',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Invalid password' }
                                }
                            }
                        }
                    }
                },
                500: {
                    description: 'Server configuration error'
                }
            }
        }
    }
};

router.post('/login', (req: Request, res: Response) => {
    const { password } = req.body;

    // Check against PASSKEY from environment variables
    const passkey = process.env['PASSKEY'];

    if (!passkey) {
        // If no PASSKEY is configured on the server, we might want to fail safe
        res.status(500).json({ success: false, message: 'Server configuration error' });
        return;
    }

    if (password === passkey) {
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

export default router;
