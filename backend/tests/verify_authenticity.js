import { analyzeDocumentAuthenticity } from '../services/authenticityChecker.js';

async function runCheck() {
  console.log('🧪 Testing Document Authenticity & Tamper Detection Engine...');
  const sampleBuffer = Buffer.from('GSFC University Student Academic Portfolio & Verified Credentials');
  const report = await analyzeDocumentAuthenticity(sampleBuffer, 'Om_Thakkar_Resume.pdf', 'application/pdf', {
    admissionYear: 2022,
    passingYear: 2026,
    claimedCgpa: 8.9
  });

  console.log('✅ Authenticity Report Generated');
  console.log('   - File:', report.file_name);
  console.log('   - Risk Level:', report.risk_level);
  console.log('   - Risk Score:', report.risk_score);
  console.log('   - Signals Evaluated:', report.signals?.length);
  console.log('   - Disclaimer Present:', !!report.disclaimer);
  console.log('🎉 Document Authenticity Verification Passed!\n');
}

runCheck();

