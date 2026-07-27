import dbClient from './utils/db';

const Bull = require('bull');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs');
const { ObjectId } = require('mongodb');

const fileQueue = new Bull('fileQueue');
const THUMBNAIL_WIDTHS = [500, 250, 100];

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  const file = await dbClient.db.collection('files').findOne({
    _id: ObjectId(fileId),
    userId: ObjectId(userId),
  });

  if (!file) {
    throw new Error('File not found');
  }

  const promises = THUMBNAIL_WIDTHS.map(async (width) => {
    const thumbnail = await imageThumbnail(file.localPath, { width });
    await fs.promises.writeFile(`${file.localPath}_${width}`, thumbnail);
  });

  await Promise.all(promises);
});

console.log('Worker is running and waiting for jobs...');
