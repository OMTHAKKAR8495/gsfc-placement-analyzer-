import assert from 'assert';
import { computeStudentPlacementProbability, forecastPlacementTrends } from '../ai/modules/placementForecaster.js';

console.log('🧪 Running Phase 3: Mathematical Predictive Model & At-Risk Factor Test Suite...\n');

async function runPredictiveTests() {
  // 1. High Propensity Student Test
  console.log('1️⃣ Testing High Placement Propensity Candidate...');
  const highStudent = {
    id: 's_top',
    name: 'Tanvi Joshi',
    cgpa: 9.4,
    ats_score: 95,
    mock_interview_score: 92,
    applications_count: 5,
    parsed_resume_json: JSON.stringify({ skills: ['Python', 'SQL', 'Kubernetes', 'FastAPI', 'Docker'] })
  };

  const highEval = computeStudentPlacementProbability(highStudent, { departmentMedianAts: 82 });
  assert(highEval.placementProbabilityPct >= 85, 'High student must have placement probability >= 85%');
  assert(highEval.riskScore <= 20, 'High student risk score must be <= 20');
  assert(highEval.riskLevel === 'Low Risk', 'Risk level must be Low Risk');
  console.log(`   ✅ High student placement probability: ${highEval.placementProbabilityPct}%, Risk: ${highEval.riskScore}% (${highEval.riskLevel})`);

  // 2. High Risk Student Factor Decomposition Test
  console.log('\n2️⃣ Testing Critical At-Risk Candidate & Factor Decomposition...');
  const atRiskStudent = {
    id: 's_risk',
    name: 'Struggling Candidate',
    cgpa: 6.2,
    ats_score: 55,
    mock_interview_score: 45,
    applications_count: 0,
    parsed_resume_json: JSON.stringify({ skills: ['HTML'] })
  };

  const riskEval = computeStudentPlacementProbability(atRiskStudent, { departmentMedianAts: 82 });
  assert(riskEval.riskScore >= 60, 'At-risk candidate must have riskScore >= 60');
  assert(riskEval.riskLevel === 'Critical High Risk', 'Risk level must be Critical High Risk');
  assert(riskEval.riskFactors.length >= 2, 'Must decompose at least 2 explainable risk factors');
  assert(riskEval.riskFactors.some(f => f.factor.includes('Zero Applications')), 'Must identify zero applications factor');
  assert(riskEval.riskFactors.some(f => f.factor.includes('ATS Compliance Deficit')), 'Must identify ATS deficit factor');
  assert(riskEval.priorityRemediation.length > 10, 'Must provide concrete remediation path');
  console.log(`   ✅ At-Risk Candidate Risk Score: ${riskEval.riskScore}% (${riskEval.riskLevel})`);
  console.log(`   ✅ Identified ${riskEval.riskFactors.length} explainable risk factors:`);
  riskEval.riskFactors.forEach(f => console.log(`      - [${f.impact}] ${f.factor}`));
  console.log(`   ✅ Remediation: "${riskEval.priorityRemediation}"`);

  // 3. Department Cohort Conversion Forecaster Test
  console.log('\n3️⃣ Testing Branch-Level Cohort Conversion Forecaster...');
  const aggregatedData = {
    totalStudents: 150,
    totalSelected: 60,
    currentPlacementRate: 40,
    totalDrives: 22,
    branchStats: [
      { branch: 'Computer Science & Engineering', total: 60, selected: 32, avgAts: 88, avgCgpa: 8.2 },
      { branch: 'Chemical Engineering', total: 40, selected: 18, avgAts: 81, avgCgpa: 7.7 },
      { branch: 'Mechanical Engineering', total: 50, selected: 10, avgAts: 72, avgCgpa: 7.1 }
    ]
  };

  const forecast = await forecastPlacementTrends(aggregatedData);
  assert(Array.isArray(forecast.branchForecast), 'Branch forecast must be an array');
  assert(forecast.branchForecast.length === 3, 'Must forecast all 3 branches');
  assert(forecast.ctcTrend && forecast.ctcTrend.projectedAvgCtcLPA > 0, 'Must project average CTC LPA');
  assert(forecast.keyActionableRecommendations.length >= 2, 'Must generate institutional recommendations');
  console.log(`   ✅ Projected CTC: ${forecast.ctcTrend.projectedAvgCtcLPA} LPA (Trend: ${forecast.ctcTrend.direction})`);
  forecast.branchForecast.forEach(b => {
    console.log(`      - ${b.branch}: Projected ${b.predictedPlacementRatePct}% (Confidence: ${b.confidence})`);
  });

  console.log('\n🎉 Phase 3 Test Suite Passed with 100% Assertion Success!\n');
}

runPredictiveTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
