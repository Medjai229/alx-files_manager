/* eslint-disable jest/prefer-expect-assertions */
/* eslint-disable no-unused-expressions */
/* eslint-disable jest/valid-expect */
import { expect } from 'chai';
import redisClient from '../../utils/redis';

describe('redisClient', () => {
  it('should be alive', () => {
    expect(redisClient.isAlive()).to.be.true;
  });

  it('should set and get a value in Redis', async () => {
    await redisClient.set('test_key', 'test_value', 10);
    const value = await redisClient.get('test_key');
    expect(value).to.equal('test_value');
  });

  it('should delete a value in Redis', async () => {
    await redisClient.set('delete_key', 'to_delete', 10);
    await redisClient.del('delete_key');
    const value = await redisClient.get('delete_key');
    expect(value).to.be.null;
  });
});
