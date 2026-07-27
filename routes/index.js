import express from 'express';
// eslint-disable-next-line import/extensions
import AppController from '../controllers/AppController.js';
// eslint-disable-next-line import/extensions
import UsersController from '../controllers/UsersController.js';

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);

export default router;
