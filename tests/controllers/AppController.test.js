/* eslint-disable jest/prefer-expect-assertions */
/* eslint-disable no-unused-expressions */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/lowercase-name */
import request from 'supertest';
import { expect } from 'chai';
import app from '../../server';

describe('App Endpoints', () => {
  describe('GET /status', () => {
    it('should return status of redis and DB', async () => {
      const res = await request(app).get('/status');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('redis', true);
      expect(res.body).to.have.property('db', true);
    });
  });

  describe('GET /stats', () => {
    it('should return number of users and files on GET /stats', async () => {
      const res = await request(app).get('/stats');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('users').that.is.a('number');
      expect(res.body).to.have.property('files').that.is.a('number');
    });
  });
});
