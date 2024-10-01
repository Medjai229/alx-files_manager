/* eslint-disable jest/prefer-expect-assertions */
/* eslint-disable no-unused-expressions */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/lowercase-name */
/* eslint-disable no-undef */
import request from 'supertest';
import { expect } from 'chai';
import { ObjectId } from 'mongodb';
import dbClient from '../../utils/db';
import redisClient from '../../utils/redis';
import app from '../../server';

describe('User Endpoints', () => {
  let userId;

  describe('POST /users', () => {
    const userData = {
      email: 'test@example.com',
      password: '123456',
    };
    it('should create a new user', async () => {
      const res = await request(app).post('/users').send(userData);
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('id').that.is.a('string');
      expect(res.body).to.have.property('email', userData.email);

      userId = res.body.id;
    });

    it('should return 400 for missing email', async () => {
      const res = await request(app).post('/users').send({ password: '123456' });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'Missing email');
    });

    it('should return 400 for missing password', async () => {
      const res = await request(app).post('/users').send({ email: 'test@example.com' });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'Missing password');
    });

    it('should return 400 for existing user', async () => {
      const res = await request(app).post('/users').send(userData);
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'Already exist');
    });
  });

  after(async () => {
    await dbClient.client.db().collection('users').deleteOne({ _id: ObjectId(userId) });
  });
});
