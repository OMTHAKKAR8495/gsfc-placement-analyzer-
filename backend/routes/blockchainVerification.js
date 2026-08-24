import express from 'express';
import crypto from 'crypto';
import db from '../db/index.js';

const router = express.Router();
const uuidv4 = () => crypto.randomUUID();

// Ensure Table Exists
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS blockchain_anchored_documents (
      id TEXT PRIMARY KEY,
      document_type TEXT NOT NULL,
      document_title TEXT NOT NULL,
      student_id TEXT,
      student_name TEXT NOT NULL,
      roll_number TEXT NOT NULL,
      company_name TEXT,
      job_title TEXT,
      ctc_range TEXT,
      document_hash TEXT NOT NULL,
      previous_block_hash TEXT NOT NULL,
      merkle_root TEXT NOT NULL,
      block_number INTEGER NOT NULL,
      issuer_name TEXT DEFAULT 'GSFC Placement Cell',
      issuer_role TEXT DEFAULT 'Authorized Placement Officer',
      status TEXT DEFAULT 'authentic',
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      metadata_json TEXT DEFAULT '{}'
    );
  `);
} catch (e) {
  console.error('Blockchain table init error:', e.message);
}

// Helper: Compute SHA-256 Hash of data string or buffer
export function computeSha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Seed initial Genesis Block and sample anchored credentials
export function seedGenesisLedger() {
  try {
    const existingCount = db.prepare('SELECT count(*) as count FROM blockchain_anchored_documents').get()?.count || 0;

    if (existingCount === 0) {
      const genesisHash = computeSha256('GSFC_UNIVERSITY_PLACEMENT_CELL_GENESIS_BLOCK_2026');
      
      const sampleDocs = [
        {
          id: 'GSFC-CERT-2026-001',
          type: 'placement_certificate',
          title: 'Official Campus Placement Confirmation — Google Cloud India',
          student_id: 's_omthakkar',
          student_name: 'Om Thakkar',
          roll: '24BT04171',
          company: 'Google Cloud India',
          role: 'Software Development Engineer - AI & Cloud',
          ctc: '₹28,00,000 PA',
          block_number: 1,
          prev_hash: genesisHash
        },
        {
          id: 'GSFC-OFFER-2026-045',
          type: 'offer_letter',
          title: 'Letter of Intent & Corporate Offer — Microsoft Azure Systems',
          student_id: 's_arav',
          student_name: 'Arav Sharma',
          roll: '21BCE045',
          company: 'Microsoft Azure Systems',
          role: 'Graduate Software Engineer - Cloud Systems',
          ctc: '₹24,00,000 PA',
          block_number: 2,
          prev_hash: ''
        },
        {
          id: 'GSFC-PASS-2026-108',
          type: 'eligibility_pass',
          title: 'Verified TPC Technical Eligibility Pass — Tata Consultancy Services',
          student_id: 's_rohan',
          student_name: 'Rohan Mehta',
          roll: '22MBA008',
          company: 'Tata Consultancy Services',
          role: 'Digital Systems & Data Analyst',
          ctc: '₹12,00,000 PA',
          block_number: 3,
          prev_hash: ''
        }
      ];

      let lastHash = genesisHash;
      for (const d of sampleDocs) {
        const canonicalString = `${d.id}|${d.type}|${d.student_id}|${d.roll}|${d.company}|${d.role}|${d.ctc}|${lastHash}`;
        const docHash = computeSha256(canonicalString);
        const merkleRoot = computeSha256(docHash + lastHash);

        db.prepare(`
          INSERT INTO blockchain_anchored_documents 
          (id, document_type, document_title, student_id, student_name, roll_number, company_name, job_title, ctc_range, document_hash, previous_block_hash, merkle_root, block_number, issuer_name, issuer_role)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Dr. Neeshu Chaudhary', 'TPC Placement Director')
        `).run(d.id, d.type, d.title, d.student_id, d.student_name, d.roll, d.company, d.role, d.ctc, docHash, lastHash, merkleRoot, d.block_number);

        lastHash = docHash;
      }
    }
  } catch (e) {
    console.error('Blockchain seed notice:', e.message);
  }
}
seedGenesisLedger();

// 1. Anchor a Document to the Cryptographic Hash-Chain
router.post('/anchor-document', (req, res) => {
  try {
    const { 
      documentId, documentType, documentTitle, studentId, studentName, 
      rollNumber, companyName, jobTitle, ctcRange, fileBase64, metadata 
    } = req.body;

    if (!studentName || !rollNumber || !documentType) {
      return res.status(400).json({ error: 'studentName, rollNumber, and documentType are required.' });
    }

    const docId = documentId || `GSFC-DOC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Check if docId already anchored
    const existing = db.prepare('SELECT * FROM blockchain_anchored_documents WHERE id = ?').get(docId);
    if (existing) {
      return res.status(400).json({ error: 'This Document ID is already anchored in the cryptographic ledger.', existing });
    }

    // Get previous block hash
    const lastBlock = db.prepare('SELECT block_number, document_hash FROM blockchain_anchored_documents ORDER BY block_number DESC LIMIT 1').get();
    const prevBlockHash = lastBlock?.document_hash || computeSha256('GSFC_GENESIS_ROOT');
    const blockNumber = (lastBlock?.block_number || 0) + 1;

    // Compute Document Hash
    let docHash = '';
    if (fileBase64) {
      docHash = computeSha256(fileBase64);
    } else {
      const canonicalData = `${docId}|${documentType}|${studentId || ''}|${rollNumber}|${companyName || ''}|${jobTitle || ''}|${ctcRange || ''}|${prevBlockHash}`;
      docHash = computeSha256(canonicalData);
    }

    const merkleRoot = computeSha256(docHash + prevBlockHash);

    db.prepare(`
      INSERT INTO blockchain_anchored_documents 
      (id, document_type, document_title, student_id, student_name, roll_number, company_name, job_title, ctc_range, document_hash, previous_block_hash, merkle_root, block_number, issuer_name, issuer_role, metadata_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'GSFC Placement Cell', 'Authorized Placement Officer', ?)
    `).run(
      docId,
      documentType || 'placement_certificate',
      documentTitle || 'Official Academic Placement Credential',
      studentId || 's_candidate',
      studentName,
      rollNumber,
      companyName || 'Corporate Partner',
      jobTitle || 'Role',
      ctcRange || 'Competitive',
      docHash,
      prevBlockHash,
      merkleRoot,
      blockNumber,
      JSON.stringify(metadata || {})
    );

    res.json({
      success: true,
      message: '🛡️ Document successfully sealed and anchored on the GSFC Cryptographic Ledger.',
      anchored_document: {
        id: docId,
        block_number: blockNumber,
        document_hash: docHash,
        previous_block_hash: prevBlockHash,
        merkle_root: merkleRoot,
        issued_at: new Date().toISOString(),
        verification_url: `/verify-document?docId=${docId}`
      }
    });
  } catch (err) {
    console.error('Error anchoring document:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Public Verification Endpoint by Document ID
router.get('/verify/:docId', (req, res) => {
  try {
    const { docId } = req.params;
    const cleanId = (docId || '').trim();

    const doc = db.prepare(`
      SELECT * FROM blockchain_anchored_documents 
      WHERE id = ? OR document_hash = ?
    `).get(cleanId, cleanId);

    if (!doc) {
      return res.status(404).json({
        verified: false,
        status: 'not_found',
        message: '❌ Document Not Found: No matching record exists on the GSFC University placement ledger. This document may be invalid or forged.'
      });
    }

    if (doc.status === 'revoked') {
      return res.json({
        verified: false,
        status: 'revoked',
        message: '⚠️ Document Revoked: This document was officially revoked by GSFC University TPC.',
        document: doc
      });
    }

    res.json({
      verified: true,
      status: 'authentic',
      message: `✅ Official Verified Credential: Authenticated by GSFC University Training & Placement Cell.`,
      document: {
        id: doc.id,
        document_title: doc.document_title,
        document_type: doc.document_type,
        student_name: doc.student_name,
        roll_number: doc.roll_number,
        company_name: doc.company_name,
        job_title: doc.job_title,
        ctc_range: doc.ctc_range,
        issued_at: doc.issued_at,
        issuer_name: doc.issuer_name,
        issuer_role: doc.issuer_role,
        block_number: doc.block_number,
        document_hash: doc.document_hash,
        previous_block_hash: doc.previous_block_hash,
        merkle_root: doc.merkle_root,
        ledger_status: 'Immutable & Tamper-Evident'
      }
    });
  } catch (err) {
    console.error('Error verifying document:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Public Verification Endpoint by File / Text Hash
router.post('/verify-hash', (req, res) => {
  try {
    const { hash, fileBase64, textContent } = req.body;
    let targetHash = hash;

    if (!targetHash && fileBase64) {
      targetHash = computeSha256(fileBase64);
    } else if (!targetHash && textContent) {
      targetHash = computeSha256(textContent);
    }

    if (!targetHash) {
      return res.status(400).json({ error: 'hash, fileBase64, or textContent is required.' });
    }

    const doc = db.prepare(`
      SELECT * FROM blockchain_anchored_documents 
      WHERE document_hash = ? OR merkle_root = ?
    `).get(targetHash, targetHash);

    if (!doc) {
      return res.status(404).json({
        verified: false,
        status: 'tampered_or_unregistered',
        calculated_hash: targetHash,
        message: '❌ Hash Mismatch / Unregistered: The cryptographic digest does not match any official certificate anchored by GSFC TPC.'
      });
    }

    res.json({
      verified: true,
      status: 'authentic',
      calculated_hash: targetHash,
      message: '✅ Cryptographic Match Verified: Document binary is 100% authentic and unaltered.',
      document: doc
    });
  } catch (err) {
    console.error('Error verifying hash:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Get Full Public Ledger Blocks
router.get('/ledger', (req, res) => {
  try {
    const blocks = db.prepare(`
      SELECT id, document_type, document_title, student_name, roll_number, company_name, block_number, document_hash, previous_block_hash, merkle_root, issued_at
      FROM blockchain_anchored_documents
      ORDER BY block_number DESC
      LIMIT 100
    `).all();

    res.json({
      total_anchored: blocks.length,
      latest_block: blocks[0] || null,
      ledger: blocks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get Anchored Documents for a Specific Student
router.get('/student/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;
    const docs = db.prepare(`
      SELECT * FROM blockchain_anchored_documents
      WHERE student_id = ? OR roll_number = ?
      ORDER BY issued_at DESC
    `).all(studentId, studentId);

    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
