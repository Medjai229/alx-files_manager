/* eslint-disable jest/prefer-expect-assertions */
/* eslint-disable no-unused-expressions */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/lowercase-name */
/* eslint-disable no-undef */
import request from 'supertest';
import { expect } from 'chai';
import dbClient from '../../utils/db';
import redisClient from '../../utils/redis';
import app from '../../server';

describe('Files Endpoints', () => {
  let userId;
  let userToken;
  let fileId;

  const userData = {
    email: 'test@example.com',
    password: '123456',
  };

  const fileData = {
    name: 'testFile.txt',
    type: 'file',
    data: 'Test File',
  }

  before(async () => {
    const resId = await request(app).post('/users').send(userData);
    userId = resId.body.id;

    const resToken = await request(app).get('/connect').auth(userData.email, userData.password);
    userToken = resToken.body.token;
  });

  describe('POST /files', () => {
    it('should upload a new file', async () => {
      const res = await request(app).post('/files').set('x-token', userToken).send(fileData);
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('id').that.is.a('string');
      expect(res.body).to.have.property('userId', userId);
      expect(res.body).to.have.property('name', fileData.name);
      expect(res.body).to.have.property('type', fileData.type);
      expect(res.body).to.have.property('isPublic', false);
      expect(res.body).to.have.property('parentId', 0);
      fileId = res.body.id;
    });

    it('should return 401 for unauthorized (no token)', async () => {
      const res = await request(app).post('/files').send(fileData);
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('should return 401 for unauthorized (no userId found)', async () => {
      const res = await request(app).post('/files').set('x-token', 'notAToken').send({fileData});
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('should return 400 for missing name', async () => {
      const res = await request(app).post('/files').set('x-token', userToken).send({ type: fileData.type, data: fileData.data });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'Missing name');
    });

    it('should return 400 for missing type', async () => {
      const res = await request(app).post('/files').set('x-token', userToken).send({ name: fileData.name, data: fileData.data });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'Missing type');
    });

    it('should return 400 for missing data', async () => {
      const res = await request(app).post('/files').set('x-token', userToken).send({ name: fileData.name, type: fileData.type });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'Missing data');
    });

    it('should return 400 for parent not found', async () => {
      const res = await request(app).post('/files').set('x-token', userToken).send({ name: fileData.name,
        type: fileData.type,
        data: fileData.data,
        parentId: '123456123456',
      });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'Parent not found');
    });
  });

  describe('GET /files/:id', () => {
    it('should return file info', async () => {
      const res = await request(app).get(`/files/${fileId}`).set('x-token', userToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('id', fileId)
      expect(res.body).to.have.property('userId', userId);
      expect(res.body).to.have.property('name', fileData.name);
      expect(res.body).to.have.property('type', fileData.type);
      expect(res.body).to.have.property('isPublic', false);
      expect(res.body).to.have.property('parentId', 0);
    });

    it('should return 401 for unauthorized (no token)', async () => {
      const res = await request(app).get(`/files/${fileId}`);
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('should return 401 for unauthorized (no userId found)', async () => {
      const res = await request(app).get(`/files/${fileId}`).set('x-token', 'NotAToken');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('should return 404 for file not found', async () => {
      const res = await request(app).get('/files/123456123456').set('x-token', userToken);
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('error', 'Not found');
    });
  });

  describe('GET /files', () => {
    it('should return a list of files', async () => {
      const res = await request(app).get('/files').set('x-token', userToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body).to.deep.include({
        id: fileId,
        userId: userId,
        name: fileData.name,
        type: fileData.type,
        isPublic: false,
        parentId: 0,
      });
    });

    it('should return 401 for unauthorized (no token)', async () => {
      const res = await request(app).get('/files');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('should return 401 for unauthorized (no userId found)', async () => {
      const res = await request(app).get('/files').set('x-token', 'NotAToken');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });
  });

  describe('PUT /files/:id/publish', () => {
    it('should publish a file', async () => {
      const res = await request(app).put(`/files/${fileId}/publish`).set('x-token', userToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('id', fileId)
      expect(res.body).to.have.property('userId', userId);
      expect(res.body).to.have.property('name', fileData.name);
      expect(res.body).to.have.property('type', fileData.type);
      expect(res.body).to.have.property('isPublic', true);
      expect(res.body).to.have.property('parentId', 0);
    });

    it('should return 401 for unauthorized (no token)', async () => {
      const res = await request(app).put(`/files/${fileId}/publish`);
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('should return 401 for unauthorized (no userId found)', async () => {
      const res = await request(app).put(`/files/${fileId}/publish`).set('x-token', 'notAToken');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('should return 404 for file not found', async () => {
      const res = await request(app).put('/files/123456123456/publish').set('x-token', userToken);
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('error', 'Not found');
    });
  });

  describe('PUT /files/:id/unpublish', () => {
    it('should publish a file', async () => {
      const res = await request(app).put(`/files/${fileId}/unpublish`).set('x-token', userToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('id', fileId)
      expect(res.body).to.have.property('userId', userId);
      expect(res.body).to.have.property('name', fileData.name);
      expect(res.body).to.have.property('type', fileData.type);
      expect(res.body).to.have.property('isPublic', false);
      expect(res.body).to.have.property('parentId', 0);
    });

    it('should return 401 for unauthorized (no token)', async () => {
      const res = await request(app).put(`/files/${fileId}/unpublish`);
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('should return 401 for unauthorized (no userId found)', async () => {
      const res = await request(app).put(`/files/${fileId}/unpublish`).set('x-token', 'notAToken');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('should return 404 for file not found', async () => {
      const res = await request(app).put('/files/123456123456/unpublish').set('x-token', userToken);
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('error', 'Not found');
    });
  });

  after(async () => {
    await dbClient.client.db().collection('users').deleteOne({ email: userData.email });
    
    if (fileId) {
      await dbClient.client.db().collection('files').deleteOne({ id: fileId });
    }
    
    await redisClient.del(`auth_${userToken}`);
  });
});