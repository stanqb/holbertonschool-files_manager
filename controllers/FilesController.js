import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import pkg from 'mongodb';
// eslint-disable-next-line import/extensions
import dbClient from '../utils/db.mjs';
// eslint-disable-next-line import/extensions
import redisClient from '../utils/redis.mjs';

const { ObjectId } = pkg;

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
const VALID_TYPES = ['folder', 'file', 'image'];

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Missing name' });
      return;
    }

    if (!type || !VALID_TYPES.includes(type)) {
      res.status(400).json({ error: 'Missing type' });
      return;
    }

    if (!data && type !== 'folder') {
      res.status(400).json({ error: 'Missing data' });
      return;
    }

    let parentObjectId = 0;

    if (parentId !== 0 && parentId !== '0') {
      if (!ObjectId.isValid(parentId)) {
        res.status(400).json({ error: 'Parent not found' });
        return;
      }

      const parentFile = await dbClient.db.collection('files').findOne({
        _id: new ObjectId(parentId),
      });

      if (!parentFile) {
        res.status(400).json({ error: 'Parent not found' });
        return;
      }

      if (parentFile.type !== 'folder') {
        res.status(400).json({ error: 'Parent is not a folder' });
        return;
      }

      parentObjectId = parentId;
    }

    const newFile = {
      userId: new ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentObjectId,
    };

    if (type === 'folder') {
      const result = await dbClient.db.collection('files').insertOne(newFile);
      res.status(201).json({
        id: result.insertedId,
        userId,
        name,
        type,
        isPublic,
        parentId: parentObjectId,
      });
      return;
    }

    if (!fs.existsSync(FOLDER_PATH)) {
      fs.mkdirSync(FOLDER_PATH, { recursive: true });
    }

    const localPath = path.join(FOLDER_PATH, uuidv4());
    const fileBuffer = Buffer.from(data, 'base64');
    fs.writeFileSync(localPath, fileBuffer);

    newFile.localPath = localPath;

    const result = await dbClient.db.collection('files').insertOne(newFile);

    res.status(201).json({
      id: result.insertedId,
      userId,
      name,
      type,
      isPublic,
      parentId: parentObjectId,
    });
  }
}

export default FilesController;
