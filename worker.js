import Queue from 'bull';
import dbClient from './utils/db';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';

const fileQueue = new Queue('fileQueue');

fileQueue.process(async (job, done) => {
  const { userId, fileId } = job.data;

  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const file = await dbClient.client.db().collection('files').findOne({ _id: ObjectId(fileId), userId: ObjectId(userId) });
  if (!file) throw new Error('File not found');

  const sizes = [500, 250, 100];

  for (const size of [500, 250, 100]) {
    const thumbnail = await imageThumbnail(file.localPath, { width: size});
    fs.writeFileSync(`${file.localPath}_${size}`, thumbnail);
  }

  done();
});
