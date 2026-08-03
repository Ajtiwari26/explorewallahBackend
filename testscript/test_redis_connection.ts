import { redis, checkRedisConnection } from '../src/config/redis';

async function runTest() {
  console.log('🧪 Testing Upstash Redis Connection & Operations...');
  const isConnected = await checkRedisConnection();
  
  if (!isConnected) {
    console.error('❌ Redis connection test failed!');
    process.exit(1);
  }

  const testKey = 'test:explorewallah:key';
  const testValue = { status: 'OK', cachedAt: new Date().toISOString() };

  await redis.set(testKey, JSON.stringify(testValue), { ex: 60 });
  console.log('✅ Wrote test key to Redis');

  const retrieved = await redis.get<string>(testKey);
  console.log('✅ Read test key from Redis:', retrieved);

  await redis.del(testKey);
  console.log('✅ Deleted test key from Redis');
  console.log('🎉 All Upstash Redis tests passed successfully!');
}

runTest().catch((err) => {
  console.error('❌ Redis test failed with error:', err);
  process.exit(1);
});
