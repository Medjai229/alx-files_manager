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

describe('User Endpoints', () => {
  let userToken;
  let userId;
  const userData = {
    email: 'test@example.com',
    password: '123456',
  };

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const res = await request(app).post('/users').send(userData);
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('id').that.is.a('string');
      expect(res.body).to.have.property('email', userData.email);
      userId = res.body.id;
    });

    it('should return 400 for missing email', async () => {
      const res = await request(app).post('/users').send({ password: userData.password });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'Missing email');
    });

    it('should return 400 for missing password', async () => {
      const res = await request(app).post('/users').send({ email: userData.email });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'Missing password');
    });

    it('should return 400 for existing user', async () => {
      const res = await request(app).post('/users').send(userData);
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'Already exist');
    });
  });

  describe('GET /users/me', () => {
    before(async () => {
      const res = await request(app).get('/connect').auth(userData.email, userData.password);
      userToken = res.body.token;
    });

    it('should return authenticated user information', async () => {
      const res = await request(app).get('/users/me').set('x-token', userToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('id', userId);
      expect(res.body).to.have.property('email', userData.email);
    });

    it('should return 401 for unauthorized (no token)', async () => {
      const res = await request(app).get('/users/me').set('x-token', '');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('should return 401 for unauthorized (no user id found)', async () => {
      const res = await request(app).get('/users/me').set('x-token', 'notAToken');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });
  });

  after(async () => {
    await dbClient.client.db().collection('users').deleteOne({ email: userData.email });
    await redisClient.del(`auth_${userToken}`);
  });
});
