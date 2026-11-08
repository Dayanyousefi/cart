import { Router } from 'express';
import { healthController } from './health.controller';

export const healthRouter = Router();

healthRouter.get('/health', healthController.getHealth);
healthRouter.get('/health/simulate-error', healthController.simulateError);
healthRouter.get('/foundation/status', healthController.getFoundationStatus);
