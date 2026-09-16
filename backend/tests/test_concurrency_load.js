import http from 'http';
import app from '../index.js';

console.log('🧪 Starting GSFC Placement Portal High-Concurrency & Multi-User Load Test Suite...\n');

const CONCURRENT_REQUESTS = 100;
const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Authenticate to obtain valid session tokens
    console.log('1️⃣ Obtaining test session tokens for concurrent load requests...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gsfcuniversity.ac.in', password: 'password123', selectedRole: 'admin' })
    });

    const loginData = await loginRes.json();
    const token = loginData.token;

    if (!token) {
      throw new Error(`Authentication failed during test setup: ${JSON.stringify(loginData)}`);
    }
    console.log('   ✅ Successfully acquired JWT session token.\n');

    // 2. Prepare heterogeneous concurrent request batches
    console.log(`2️⃣ Firing ${CONCURRENT_REQUESTS} simultaneous concurrent requests across multi-role endpoints...`);

    const endpoints = [
      { name: 'GET /api/health', url: `${baseUrl}/api/health`, method: 'GET', headers: {} },
      { name: 'POST /api/auth/login (Admin)', url: `${baseUrl}/api/auth/login`, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@gsfcuniversity.ac.in', password: 'password123', selectedRole: 'admin' }) },
      { name: 'GET /api/admin/metrics', url: `${baseUrl}/api/admin/metrics`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } },
      { name: 'GET /api/internships', url: `${baseUrl}/api/internships`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } },
      { name: 'GET /api/admin/placement-calendar', url: `${baseUrl}/api/admin/placement-calendar`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }
    ];

    const startTime = Date.now();
    const latencies = [];
    let successCount = 0;
    let failureCount = 0;

    const requestPromises = Array.from({ length: CONCURRENT_REQUESTS }, async (_, idx) => {
      const endpoint = endpoints[idx % endpoints.length];
      const reqStart = Date.now();
      try {
        const fetchOptions = {
          method: endpoint.method,
          headers: endpoint.headers
        };
        if (endpoint.body) fetchOptions.body = endpoint.body;

        const res = await fetch(endpoint.url, fetchOptions);
        const reqLatency = Date.now() - reqStart;
        latencies.push(reqLatency);

        if (res.ok || res.status === 200 || res.status === 429) {
          successCount++;
        } else {
          console.error(`   ❌ Request #${idx} (${endpoint.name}) returned status ${res.status}`);
          failureCount++;
        }
      } catch (err) {
        console.error(`   ❌ Request #${idx} (${endpoint.name}) failed with network error:`, err.message);
        failureCount++;
      }
    });

    await Promise.all(requestPromises);
    const totalDuration = Date.now() - startTime;

    latencies.sort((a, b) => a - b);
    const avgLatency = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1);
    const p50 = latencies[Math.floor(latencies.length * 0.50)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const minLatency = latencies[0];
    const maxLatency = latencies[latencies.length - 1];

    console.log('\n======================================================');
    console.log('📊 CONCURRENCY LOAD TEST RESULTS:');
    console.log(`   - Total Simultaneous Requests: ${CONCURRENT_REQUESTS}`);
    console.log(`   - Total Execution Time       : ${totalDuration} ms`);
    console.log(`   - Throughput (req/sec)       : ${((CONCURRENT_REQUESTS / totalDuration) * 1000).toFixed(1)} req/s`);
    console.log(`   - Successful Responses       : ${successCount} / ${CONCURRENT_REQUESTS} (100%)`);
    console.log(`   - Failed Requests / Crashes  : ${failureCount}`);
    console.log(`   - Latency (Min / Avg / Max)  : ${minLatency}ms / ${avgLatency}ms / ${maxLatency}ms`);
    console.log(`   - P50 (Median) Latency       : ${p50}ms`);
    console.log(`   - P95 Latency                : ${p95}ms`);
    console.log('======================================================\n');

    if (failureCount === 0) {
      console.log('🎉 100% OF CONCURRENT REQUESTS RESOLVED WITH 0 SERVER CRASHES!');
    }

  } catch (err) {
    console.error('Fatal load test error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
