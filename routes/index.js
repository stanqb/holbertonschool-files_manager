import express from 'express';
// eslint-disable-next-line import/extensions
import AppController from '../controllers/AppController.js';
// eslint-disable-next-line import/extensions
import UsersController from '../controllers/UsersController.js';
// eslint-disable-next-line import/extensions
import AuthController from '../controllers/AuthController.js';
// eslint-disable-next-line import/extensions
import FilesController from '../controllers/FilesController.js';

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);
router.post('/files', FilesController.postUpload);
router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);

export default router;
