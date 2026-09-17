import assert from 'assert';
import db, { initDatabase } from '../db/index.js';
import { computeSha256 } from '../routes/blockchainVerification.js';

console.log('🧪 Running Phase 6: Trust & Cryptographic Merkle Hash-Chain Test Suite...\n');

async function runBlockchainTests() {
  await initDatabase();

  // Clean up any test records
  await db.prepare("DELETE FROM blockchain_anchored_documents WHERE id LIKE 'GSFC-VERIFY-2026%'").run();

  // 1. Test Deterministic Canonical SHA-256 Document Hashing
  console.log('1️⃣ Testing Deterministic Document Hashing & Merkle Root Proof...');
  const testCertId = 'GSFC-VERIFY-2026-' + Date.now();
  const testStudentName = 'Om Thakkar';
  const testRoll = '24BT04171';
  const testCompany = 'Google Cloud India';
  const testCtc = '₹28,00,000 PA';

  const lastBlock = await db.prepare('SELECT block_number, document_hash FROM blockchain_anchored_documents ORDER BY block_number DESC LIMIT 1').get();
  const prevHash = lastBlock?.document_hash || computeSha256('GSFC_GENESIS_ROOT');
  const blockNumber = (Number(lastBlock?.block_number) || 0) + 1;

  const canonicalPayload = `${testCertId}|placement_certificate|s_omthakkar|${testRoll}|${testCompany}|SDE-2|${testCtc}|${prevHash}`;
  const docHash = computeSha256(canonicalPayload);
  const merkleRoot = computeSha256(docHash + prevHash);

  await db.prepare(`
    INSERT INTO blockchain_anchored_documents 
    (id, document_type, document_title, student_id, student_name, roll_number, company_name, job_title, ctc_range, document_hash, previous_block_hash, merkle_root, block_number, issuer_name, issuer_role)
    VALUES (?, 'placement_certificate', 'Verified Placement Offer', 's_omthakkar', ?, ?, ?, 'SDE-2', ?, ?, ?, ?, ?, 'GSFC Placement Cell', 'Director')
  `).run(testCertId, testStudentName, testRoll, testCompany, testCtc, docHash, prevHash, merkleRoot, blockNumber);

  console.log(`   ✅ Anchored Block #${blockNumber} (${testCertId}) with Hash: ${docHash.slice(0, 16)}...`);
  console.log(`   ✅ Merkle Root: ${merkleRoot.slice(0, 16)}...`);

  // 2. Test Zero-Auth Public Verification by ID
  console.log('\n2️⃣ Testing Public Credential Verification by Certificate ID...');
  const fetched = await db.prepare('SELECT * FROM blockchain_anchored_documents WHERE id = ?').get(testCertId);
  assert(fetched !== null, 'Anchored certificate must be retrievable');
  assert(fetched.document_hash === docHash, 'Document hash must match exactly');
  assert(fetched.merkle_root === merkleRoot, 'Merkle root must match exactly');
  console.log(`   ✅ Successfully verified credential for ${fetched.student_name} (${fetched.company_name})`);

  // 3. Test Whole-Ledger Cryptographic Audit
  console.log('\n3️⃣ Testing Whole-Ledger Cryptographic Chain Audit...');
  const blocks = await db.prepare('SELECT * FROM blockchain_anchored_documents ORDER BY block_number ASC').all();
  assert(blocks.length >= 1, 'Ledger must have anchored blocks');

  let chainValid = true;
  for (let i = 0; i < blocks.length; i++) {
    const curr = blocks[i];
    const expectedMerkle = computeSha256(curr.document_hash + curr.previous_block_hash);
    assert(curr.merkle_root === expectedMerkle, `Block #${curr.block_number} Merkle root must match`);
    if (i > 0) {
      const prev = blocks[i - 1];
      assert(curr.previous_block_hash === prev.document_hash, `Block #${curr.block_number} must link to Block #${prev.block_number}`);
    }
  }
  console.log(`   ✅ Cryptographic Hash-Chain Validated: ${blocks.length} blocks verified with 0 breaks in Merkle continuity.`);

  // Clean up test cert
  await db.prepare('DELETE FROM blockchain_anchored_documents WHERE id = ?').run(testCertId);

  console.log('\n🎉 Phase 6 Test Suite Passed with 100% Assertion Success!\n');
  process.exit(0);
}

runBlockchainTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
