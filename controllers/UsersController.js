import sha1 from 'sha1';
import pkg from 'mongodb';
// eslint-disable-next-line import/extensions
import dbClient from '../utils/db.mjs';
// eslint-disable-next-line import/extensions
import redisClient from '../utils/redis.mjs';

const { ObjectId } = pkg;

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    const existingUser = await dbClient.db.collection('users').findOne({ email });

    if (existingUser) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }

    const hashedPassword = sha1(password);
    const result = await dbClient.db.collection('users').insertOne({
      email,
      password: hashedPassword,
    });

    res.status(201).json({ id: result.insertedId, email });
  }

  static async getMe(req, res) {
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

    const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    res.status(200).json({ id: user._id, email: user.email });
  }
}

export default UsersController;
