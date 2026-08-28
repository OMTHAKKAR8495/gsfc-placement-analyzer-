export default function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { category = 'flashcards', company = 'Reliance Industries Limited', topic = 'Core CS & System Design' } = req.body || req.query || {};

  if (category === 'flashcards') {
    return res.status(200).json({
      id: `study_flash_${Date.now()}`,
      title: `${company} Placement Flashcard Deck`,
      category: 'flashcards',
      company,
      topic,
      content: {
        cards: [
          { front: 'What is the ACID property in Relational Databases?', back: 'Atomicity (all or nothing), Consistency (valid state transitions), Isolation (independent concurrent transactions), Durability (committed data survives crashes).' },
          { front: 'Explain the difference between SQL and NoSQL databases.', back: 'SQL uses fixed schemas and ACID transactions. NoSQL uses flexible documents/key-values for horizontal scale.' },
          { front: 'What is Kadane\'s Algorithm and its time complexity?', back: 'Calculates maximum contiguous subarray sum in O(N) linear time and O(1) space.' },
          { front: 'Explain Database Indexing & B-Tree structure.', back: 'B+ Tree index reduces full-table scan time from O(N) disk I/O to O(log N).' },
          { front: 'What is the CAP Theorem in Distributed Systems?', back: 'A distributed system can guarantee at most two of Consistency, Availability, and Partition Tolerance.' }
        ]
      }
    });
  }

  if (category === 'revision_notes') {
    return res.status(200).json({
      id: `study_notes_${Date.now()}`,
      title: `${company} High-Yield Placement Revision Cheat Sheet`,
      category: 'revision_notes',
      company,
      topic,
      content: {
        title: `${company} Placement Cheat Sheet`,
        sections: [
          {
            heading: '1. Core Data Structures & Big-O Quick Ref',
            bullets: [
              'Hash Map / Set: O(1) Average Search, Insert & Delete.',
              'Binary Search Tree (Balanced AVL/Red-Black): O(log N) operations.',
              'Sliding Window & Two-Pointers: Converts O(N²) quadratic loops into O(N) linear scans.'
            ]
          },
          {
            heading: '2. High-Frequency System Design Tradeoffs',
            bullets: [
              'Stateless Application Services enable zero-downtime horizontal autoscaling.',
              'Redis in-memory caching reduces relational database load by 80%+ (90/10 read-heavy rule).',
              'Database Replication: 1 Master Write Node + Multiple Read Replicas for scalable throughput.'
            ]
          }
        ]
      }
    });
  }

  return res.status(200).json({
    id: `study_quiz_${Date.now()}`,
    title: `${company} Technical Assessment Mock Quiz`,
    category: 'mcq_quiz',
    company,
    topic,
    content: {
      quiz_title: `${company} Placement Assessment Quiz`,
      questions: [
        {
          id: 'q1',
          q: 'What is the average time complexity of searching for an element in an unsorted hash map with good hashing?',
          options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
          correct: 0,
          explanation: 'Hash maps provide constant O(1) average time complexity for lookups using direct bucket hashing.'
        },
        {
          id: 'q2',
          q: 'Which database isolation level prevents Dirty Reads, Non-Repeatable Reads, and Phantom Reads?',
          options: ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable'],
          correct: 3,
          explanation: 'Serializable is the highest transaction isolation level which completely isolates concurrent transactions.'
        }
      ]
    }
  });
}
