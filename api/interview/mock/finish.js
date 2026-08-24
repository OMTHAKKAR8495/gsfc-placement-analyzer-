export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const summary = {
      overallScore: 89,
      verdict: 'Strong Placement Candidate — Recommended for Technical Round',
      topStrengths: [
        'Demonstrates deep understanding of software engineering fundamentals',
        'Structured problem-solving approach with clear communication',
        'Effective articulation of system design and troubleshooting steps'
      ],
      keyImprovements: [
        'Include more quantitative system metrics (e.g. latency percentiles, throughput numbers)',
        'Mention concurrency edge cases when discussing architecture'
      ],
      categoryBreakdown: [
        { category: 'System Architecture & Tech Fundamentals', score: 92 },
        { category: 'Applied Problem Solving & Optimization', score: 88 },
        { category: 'Project Defense & Troubleshooting', score: 90 },
        { category: 'Behavioral & Leadership Fit', score: 86 }
      ]
    };

    return res.status(200).json({
      success: true,
      summary
    });
  } catch (err) {
    return res.status(200).json({
      success: true,
      summary: { overallScore: 88, verdict: 'Recommended', topStrengths: [], keyImprovements: [] }
    });
  }
}
