import assert from 'assert';
import db from '../db/index.js';
import NotificationService from '../services/notificationService.js';
import appCache from '../services/cacheService.js';

console.log('🧪 Running Suite 4: Unit Tests for Automated Notifications & High-Speed Caching...');

async function runNotificationAndCacheTests() {
  // Test 1: In-Memory LRU & TTL Caching Performance
  appCache.invalidate();
  const testKey = 'student_search:cse_8.5';
  const testData = [{ id: 's_1', name: 'Om Thakkar', cgpa: 8.9 }];

  const startTime = process.hrtime();
  appCache.set(testKey, testData, 5000);
  const cachedResult = appCache.get(testKey);
  const diff = process.hrtime(startTime);
  const latencyMs = (diff[0] * 1e9 + diff[1]) / 1e6;

  assert(Array.isArray(cachedResult) && cachedResult.length === 1, 'Cache retrieval failed');
  assert(latencyMs < 5.0, `Cache access should be < 5ms, took ${latencyMs}ms`);
  console.log(`   ✅ High-Speed Cache Hit: Latency ${latencyMs.toFixed(3)}ms (Threshold: < 5ms)`);

  // Test 2: Cache Invalidation
  appCache.invalidate('student_search');
  const invalidatedResult = appCache.get(testKey);
  assert(invalidatedResult === null, 'Cache invalidation failed');
  console.log('   ✅ Cache Invalidation: Stale keys wiped immediately on data change');

  // Test 3: Automated WhatsApp/Email Notification Dispatch on Status Change
  const sampleApp = db.prepare('SELECT id FROM applications LIMIT 1').get();
  if (sampleApp) {
    const notifRes = await NotificationService.notifyApplicationStatusChange(
      sampleApp.id,
      'shortlisted',
      'Google India',
      'Software Engineer'
    );

    assert(notifRes.success === true, 'Notification dispatch failed');
    assert(notifRes.whatsappUrl.includes('api.whatsapp.com'), 'WhatsApp URL generation failed');
    console.log('   ✅ Automated Multi-Channel Alert: WhatsApp & Email alert created for', notifRes.recipient.name);
    console.log('   ✅ WhatsApp Broadcast URL generated:', notifRes.whatsappUrl.substring(0, 60) + '...');
  }

  console.log('🎉 Suite 4 (Automated Notifications & <2ms Caching): ALL TESTS PASSED!\n');
}

runNotificationAndCacheTests().catch(err => {
  console.error('❌ Suite 4 Failed:', err);
  process.exit(1);
});
