import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import pkg from 'mongodb';
import mime from 'mime-types';
// eslint-disable-next-line import/extensions
import dbClient from '../utils/db.mjs';
// eslint-disable-next-line import/extensions
import redisClient from '../utils/redis.mjs';

const { ObjectId } = pkg;

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
const VALID_TYPES = ['folder', 'file', 'image'];

class FilesController {
  static async postUpload(req, res) {
    try {
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
    } catch (err) {
      console.error('postUpload error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getShow(req, res) {
    try {
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

      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      const file = await dbClient.db.collection('files').findOne({
        _id: new ObjectId(id),
        userId: new ObjectId(userId),
      });

      if (!file) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      res.status(200).json({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      });
    } catch (err) {
      console.error('getShow error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getIndex(req, res) {
    try {
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

      const { parentId = '0', page = '0' } = req.query;
      const pageNumber = parseInt(page, 10) || 0;

      const matchStage = { userId: new ObjectId(userId) };

      if (parentId !== '0') {
        matchStage.parentId = ObjectId.isValid(parentId) ? new ObjectId(parentId) : parentId;
      } else {
        matchStage.parentId = 0;
      }

      const files = await dbClient.db.collection('files').aggregate([
        { $match: matchStage },
        { $skip: pageNumber * 20 },
        { $limit: 20 },
      ]).toArray();

      const formattedFiles = files.map((file) => ({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      }));

      res.status(200).json(formattedFiles);
    } catch (err) {
      console.error('getIndex error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async putPublish(req, res) {
    try {
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

      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      const file = await dbClient.db.collection('files').findOne({
        _id: new ObjectId(id),
        userId: new ObjectId(userId),
      });

      if (!file) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      await dbClient.db.collection('files').updateOne(
        { _id: new ObjectId(id) },
        { $set: { isPublic: true } },
      );

      res.status(200).json({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: true,
        parentId: file.parentId,
      });
    } catch (err) {
      console.error('putPublish error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async putUnpublish(req, res) {
    try {
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

      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      const file = await dbClient.db.collection('files').findOne({
        _id: new ObjectId(id),
        userId: new ObjectId(userId),
      });

      if (!file) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      await dbClient.db.collection('files').updateOne(
        { _id: new ObjectId(id) },
        { $set: { isPublic: false } },
      );

      res.status(200).json({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: false,
        parentId: file.parentId,
      });
    } catch (err) {
      console.error('putUnpublish error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getFile(req, res) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(id) });

      if (!file) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      if (!file.isPublic) {
        const token = req.headers['x-token'];
        const userId = token ? await redisClient.get(`auth_${token}`) : null;

        if (!userId || userId !== file.userId.toString()) {
          res.status(404).json({ error: 'Not found' });
          return;
        }
      }

      if (file.type === 'folder') {
        res.status(400).json({ error: "A folder doesn't have content" });
        return;
      }

      if (!fs.existsSync(file.localPath)) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      const mimeType = mime.lookup(file.name) || 'application/octet-stream';
      const content = fs.readFileSync(file.localPath);

      res.setHeader('Content-Type', mimeType);
      res.status(200).send(content);
    } catch (err) {
      console.error('getFile error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default FilesController;
