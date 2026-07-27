import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
// eslint-disable-next-line import/extensions
import dbClient from '../utils/db.mjs';
// eslint-disable-next-line import/extensions
import redisClient from '../utils/redis.mjs';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Basic ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const base64Credentials = authHeader.slice('Basic '.length);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');

    if (!email || !password) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const hashedPassword = sha1(password);
    const user = await dbClient.db.collection('users').findOne({
      email,
      password: hashedPassword,
    });

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id.toString(), 24 * 60 * 60);

    res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await redisClient.del(key);
    res.status(204).end();
  }
}

export default AuthController;
