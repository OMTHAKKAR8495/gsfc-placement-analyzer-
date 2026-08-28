/**
 * 📚 CampusHire AI — Dynamic Placement Study Material & Flashcard Generator
 * Generates interactive Flashcards, Revision Cheat Sheets, and Practice Quizzes tailored to target companies.
 */

export function generateStudyMaterial(company = 'Reliance Industries Limited', category = 'flashcards', topic = 'Core CS & System Design') {
  if (category === 'flashcards') {
    const flashcardDecks = {
      'Reliance Industries Limited': [
        { front: 'What is the ACID property in Relational Databases?', back: 'Atomicity (all or nothing), Consistency (valid state transitions), Isolation (independent concurrent transactions), Durability (committed data survives crashes).' },
        { front: 'Explain the difference between SQL and NoSQL databases.', back: 'SQL uses fixed relational schemas, ACID transactions, and vertical scaling. NoSQL (MongoDB/Redis) uses flexible documents/key-values with BASE consistency and horizontal scaling.' },
        { front: 'What is Kadane\'s Algorithm and its time complexity?', back: 'Kadane\'s algorithm calculates the maximum contiguous subarray sum in a single pass with O(N) linear time and O(1) auxiliary space.' },
        { front: 'Explain Database Indexing & B-Tree structure.', back: 'An index is a balanced tree (B+ Tree) that stores sorted keys and row pointers, reducing full-table scan time from O(N) disk I/O to O(log N).' },
        { front: 'What is the CAP Theorem in Distributed Systems?', back: 'A distributed system can only provide two of three guarantees simultaneously: Consistency, Availability, and Partition Tolerance.' }
      ],
      'Google Cloud India': [
        { front: 'What is the difference between Process and Thread?', back: 'A Process has its own dedicated address memory space. Threads share the memory address space of the parent process for lightweight multitasking.' },
        { front: 'How does the Event Loop work in Node.js / JavaScript?', back: 'The Call Stack executes synchronous code. Asynchronous operations run in Web APIs / libuv, queueing callbacks into Microtask (Promises) and Macrotask (Timers) queues.' },
        { front: 'What is the purpose of an Inverted Index in Search Engines?', back: 'A hashmap mapping words to a list of document IDs containing that word, enabling O(1) search token lookup instead of full text scans.' },
        { front: 'Explain Consistent Hashing and its role in Distributed Caching.', back: 'Maps both servers and keys to a 360° hash ring. When servers are added or removed, only K/N keys need remapping rather than redistributing all keys.' },
        { front: 'What is the difference between TCP and UDP protocols?', back: 'TCP is connection-oriented, reliable, ordered, with flow/congestion control. UDP is connectionless, fast, and lightweight (used in video streaming/VoIP).' }
      ],
      'Microsoft Azure Systems': [
        { front: 'Explain the Circuit Breaker Pattern in Cloud Microservices.', back: 'Prevents cascading application failure by temporarily blocking calls to an unresponsive downstream microservice and returning fallback data.' },
        { front: 'What is Dependency Injection in Modern Software Engineering?', back: 'A design pattern where an object receives its dependencies from external injectors rather than instantiating them directly, enabling loose coupling and unit test mocking.' },
        { front: 'Explain Microservices API Gateway Pattern.', back: 'A reverse proxy sitting between clients and microservices handling authentication, rate limiting, SSL termination, and request routing.' },
        { front: 'What is the difference between optimistic and pessimistic locking?', back: 'Optimistic locking checks version timestamps at commit time (ideal for high-concurrency low-conflict). Pessimistic locking acquires exclusive database locks immediately.' }
      ]
    };

    const cards = flashcardDecks[company] || flashcardDecks['Reliance Industries Limited'];

    return {
      id: `study_flash_${Date.now()}`,
      title: `${company} Placement Flashcard Deck`,
      category: 'flashcards',
      company,
      topic,
      content: {
        cards
      }
    };
  }

  if (category === 'revision_notes') {
    return {
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
              'Min/Max Binary Heap: O(1) peek minimum, O(log N) insertion and deletion.',
              'Sliding Window & Two-Pointers: Converts O(N²) quadratic loops into O(N) linear scans.'
            ]
          },
          {
            heading: '2. High-Frequency System Design Tradeoffs',
            bullets: [
              'Stateless Application Services enable zero-downtime horizontal autoscaling.',
              'Redis in-memory caching reduces relational database load by 80%+ (90/10 read-heavy rule).',
              'Database Replication: 1 Master Write Node + Multiple Read Replicas for scalable throughput.',
              'Asynchronous Message Queues (Kafka/RabbitMQ) decouple heavy background workloads.'
            ]
          },
          {
            heading: '3. Operating Systems & Networking Hot Topics',
            bullets: [
              'Virtual Memory: Uses Paging and Translation Lookaside Buffer (TLB) to map virtual addresses to physical RAM.',
              'Four Deadlock Conditions: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.',
              'HTTP/2 & HTTP/3: Multiplexing, header compression, and QUIC over UDP eliminate Head-of-Line blocking.',
              'DNS Resolution: Browser Cache → OS Cache → Recursive Resolver → Root → TLD → Authoritative Nameserver.'
            ]
          }
        ]
      }
    };
  }

  // category === 'mcq_quiz'
  return {
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
        },
        {
          id: 'q3',
          q: 'In the CAP theorem, which property guarantees that every non-failing node returns a response?',
          options: ['Consistency', 'Availability', 'Partition Tolerance', 'Durability'],
          correct: 1,
          explanation: 'Availability ensures that every active node returns a non-error response, though it may not be the newest write.'
        },
        {
          id: 'q4',
          q: 'In JavaScript / Node.js, where are Promise callbacks (then/catch/async) scheduled?',
          options: ['Macrotask Queue', 'Microtask Queue', 'Call Stack directly', 'ThreadPool'],
          correct: 1,
          explanation: 'Promises execute in the Microtask Queue, which takes priority right after the current execution context before Macrotasks.'
        }
      ]
    }
  };
}
