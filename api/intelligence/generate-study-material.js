export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { category = 'flashcards', company = 'Reliance Industries', topic = 'Cloud & Database Architecture' } = req.body || {};

  return res.status(200).json({
    category,
    company,
    topic,
    title: `${company} Core Placement Study Guide`,
    cards: [
      { question: 'What is the ACID property in Relational Databases?', answer: 'Atomicity, Consistency, Isolation, and Durability guarantees reliable transaction processing.' },
      { question: 'Explain the difference between SQL and NoSQL databases.', answer: 'SQL uses structured schemas and relational tables; NoSQL uses flexible documents, key-values, or graphs for horizontal scale.' },
      { question: 'What is Kadane\'s Algorithm used for?', answer: 'Finding the maximum sum contiguous subarray in linear O(N) time.' },
      { question: 'What is the purpose of an Index in PostgreSQL / MySQL?', answer: 'Indexes provide quick random lookups using B-Trees, reducing full table scans.' }
    ]
  });
}
