const STORAGE_KEY = 'gsfc_company_uploaded_questions';

export const INITIAL_COMPANY_QUESTIONS = [
  {
    id: 'gsfc-co-1',
    companyName: 'GSFC University Placement Cell',
    roleTitle: 'Full Stack & Software Developer',
    projectTopic: 'React & Node.js Web Application',
    source: 'company_uploaded',
    category: 'Technical',
    difficulty: 'Hard',
    question: 'GSFC Campus Drive Question: In your web project developed using React & Node.js, how did you handle asynchronous state updates, database connectivity, and deployment optimization?',
    suggestedAnswer: 'In our campus web application project:\n1. **Frontend Architecture**: Managed async API state using custom React hooks and TanStack Query with loading/error boundaries.\n2. **Backend & Database**: Connected Node.js/Express controllers to MongoDB/MySQL using parameterized query pools and index tuning.\n3. **Deployment**: Optimized production build sizes using code-splitting and hosted static assets on CDN.',
    keyPointsToInclude: [
      'Async state handling & custom React hooks',
      'Node.js REST API controllers & query optimization',
      'Production build bundle optimization and CDN deployment'
    ],
    starGuide: {
      situation: 'Building a student placement management system for our campus project.',
      task: 'Deliver a scalable full-stack application with rapid response times for 2,000+ simultaneous student users.',
      action: 'Implemented Express connection pooling, indexed database tables, and optimized React component memoization.',
      result: 'Achieved sub-200ms API responses and handled peak campus registration traffic smoothly.'
    }
  },
  {
    id: 'gsfc-co-2',
    companyName: 'Google Cloud India',
    roleTitle: 'Software Engineer - AI & Cloud',
    projectTopic: 'Distributed Systems & Rate Limiting',
    source: 'company_uploaded',
    category: 'System Design',
    difficulty: 'Hard',
    question: 'Google Cloud Screening Question: How would you design a distributed rate limiter operating across multiple global edge locations for your API project?',
    suggestedAnswer: 'I would use a hybrid architecture:\n1. **Local Token Bucket**: Maintain local token bucket counters at each edge proxy node to handle 99% of requests with sub-millisecond latency.\n2. **Centralized Synchronization**: Sync token usage periodically (e.g., every 50ms) to a global Redis Cluster or distributed KV store.\n3. **Graceful Fallback**: Under network partitions, fallback to local rate limits to preserve system availability.',
    keyPointsToInclude: [
      'Edge local token buckets for sub-ms latency',
      'Async synchronization with global Redis cluster',
      'Partition tolerance & local fallback under network degradation'
    ]
  },
  {
    id: 'gsfc-co-3',
    companyName: 'Microsoft Azure Systems',
    roleTitle: 'Graduate Software Engineer',
    projectTopic: 'Microservices & CI/CD Pipeline',
    source: 'company_uploaded',
    category: 'System Design',
    difficulty: 'Hard',
    question: 'Microsoft Campus Drive Question: Describe how you structured containerization and automated CI/CD deployment in your cloud microservices project.',
    suggestedAnswer: 'For Azure Cloud deployments:\n1. **Docker Containerization**: Use multi-stage Dockerfiles to minimize base image size (<150MB).\n2. **CI/CD Workflow**: GitHub Actions runner executes linting, unit tests, Trivy security vulnerability scans, and pushes images to ACR.\n3. **Orchestration**: Kubernetes rolling deployment with readiness/liveness probes ensuring zero-downtime releases.',
    keyPointsToInclude: [
      'Multi-stage Docker builds',
      'Automated vulnerability scanning & unit testing in CI',
      'Zero-downtime rolling updates with K8s probes'
    ]
  },
  {
    id: 'gsfc-co-4',
    companyName: 'Tata Consultancy Services (TCS)',
    roleTitle: 'Systems Engineer',
    projectTopic: 'Database Architecture & Caching',
    source: 'company_uploaded',
    category: 'Technical',
    difficulty: 'Medium',
    question: 'TCS Interview Question: How did you design data indexing and Redis caching for high-frequency database queries in your capstone project?',
    suggestedAnswer: 'To handle heavy read traffic:\n1. **Caching Layer**: Placed Redis in front of the primary SQL/NoSQL database with a Cache-Aside strategy and TTL expirations.\n2. **Database Indexing**: Created compound indexes on high-cardinality query fields to eliminate full table scans.\n3. **Cache Invalidation**: Used pub/sub event emitters to purge stale cache entries on data updates.',
    keyPointsToInclude: [
      'Cache-Aside pattern with Redis TTL',
      'Compound database indexes on high-cardinality columns',
      'Data consistency and cache invalidation strategies'
    ]
  }
];

export function getCompanyUploadedQuestions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_COMPANY_QUESTIONS;
    const userUploaded = JSON.parse(raw);
    return [...userUploaded, ...INITIAL_COMPANY_QUESTIONS];
  } catch (err) {
    console.error('Failed reading company questions from localStorage:', err);
    return INITIAL_COMPANY_QUESTIONS;
  }
}

export function saveCompanyUploadedQuestion(newQ) {
  const existing = getCompanyUploadedQuestions();
  const created = {
    ...newQ,
    id: 'user-co-q-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    source: 'company_uploaded'
  };

  const currentCustomOnly = getCustomUploadedOnly();
  const updatedCustom = [created, ...currentCustomOnly];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustom));
  } catch (e) {
    console.error('Failed saving custom company question:', e);
  }

  return [created, ...existing];
}

export function bulkUploadCompanyQuestions(qList) {
  const currentCustomOnly = getCustomUploadedOnly();
  const newCreated = qList.map((q, i) => ({
    ...q,
    id: 'user-co-q-' + Date.now() + '-' + i,
    source: 'company_uploaded'
  }));

  const updatedCustom = [...newCreated, ...currentCustomOnly];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustom));
  } catch (e) {
    console.error('Failed bulk saving company questions:', e);
  }

  return [...newCreated, ...getCompanyUploadedQuestions()];
}

export function deleteCompanyUploadedQuestion(id) {
  const currentCustomOnly = getCustomUploadedOnly();
  const updatedCustom = currentCustomOnly.filter(q => q.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustom));
  } catch (e) {
    console.error('Failed deleting company question:', e);
  }
  return [...updatedCustom, ...INITIAL_COMPANY_QUESTIONS];
}

function getCustomUploadedOnly() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}
