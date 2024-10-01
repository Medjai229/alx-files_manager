import app from '../../server';
import request from 'supertest';
import { expect } from 'chai';

describe('App Endpoints', () => {
  it('should return status of redis and DB on GET /status', async () => {
    const res = await request(app).get('/status');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('redis', true);
    expect(res.body).to.have.property('db', true);
  });

  it('should return number of users and files on GET /stats', async () => {
    const res = await request(app).get('/stats');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('users').that.is.a('number');
    expect(res.body).to.have.property('files').that.is.a('number');
  });
});