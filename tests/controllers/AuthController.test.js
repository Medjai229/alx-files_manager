/* eslint-disable jest/prefer-expect-assertions */
/* eslint-disable no-unused-expressions */
/* eslint-disable jest/valid-expect */
import request from 'supertest';
import { expect } from 'chai';
import dbClient from '../../utils/db';
import redisClient from '../../utils/redis';
import app from '../../server';

describe('Auth Endpoints', () => {
  let userToken;
  const userData = {
    email: 'test@example.com',
    password: '123456',
  };

  before(async () => {
    await request(app).post('/users').send(userData);
  });

  describe('GET /connect', () => {
    it('should authenticate user and return a token', async () => {
      const res = await request(app).get('/connect').auth(userData.email, userData.password);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
      userToken = res.body.token;
    });

    it('should return 401 for unauthorized (no auth header)', async () => {
      const res = await request(app).get('/connect');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('should return 401 for unauthorized (no email or password)', async () => {
      const res = await request(app).get('/connect').auth('', '');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('should return 401 for unauthorized (no user matching)', async () => {
      const res = await request(app).get('/connect').auth('test@test.com', '123465');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });
  });

  describe('GET /disconnect', () => {
    it('should disconnect user', async () => {
      const res = await request(app).get('/disconnect').set('x-token', userToken);
      expect(res.status).to.equal(204);
      expect(res.body).to.be.empty;
    });

    it('should return 401 for unauthorized (no token provided)', async () => {
      const res = await request(app).get('/disconnect').set('x-token', '');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('should return 401 for unauthorized (no user found)', async () => {
      const res = await request(app).get('/disconnect').set('x-token', 'notAToken');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });
  });

  after(async () => {
    await dbClient.client.db().collection('users').deleteOne({ email: userData.email });
  });
})