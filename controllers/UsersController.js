import sha1 from 'sha1';
// eslint-disable-next-line import/extensions
import dbClient from '../utils/db.mjs';

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
}

export default UsersController;
