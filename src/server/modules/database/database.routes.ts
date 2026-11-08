import { Router } from 'express';
import { databaseController } from './database.controller';

export const databaseRouter = Router();

databaseRouter.get('/db/status', databaseController.getDatabaseFoundationStatus);
databaseRouter.post('/db/test-repository', databaseController.executeRepositoryAction);
