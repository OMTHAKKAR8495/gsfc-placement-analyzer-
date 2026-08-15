import { getCompanyUploadedQuestions } from './companyQuestionStorage';

export const DEFAULT_INTERVIEW_QUESTIONS = [
  {
    id: 'q-1',
    roleTitle: 'Full Stack Developer',
    category: 'Technical',
    difficulty: 'Hard',
    question: 'How do you optimize a React web application suffering from heavy re-renders and slow initial load times?',
    suggestedAnswer: 'I take a systematic approach:\n1. **Performance Profiling**: Use React DevTools Profiler & Chrome Lighthouse to pinpoint heavy component trees and LCP bottlenecks.\n2. **Code Splitting & Lazy Loading**: Use React.lazy() and dynamic imports for non-critical route chunks.\n3. **Memoization & State Design**: Apply useMemo and useCallback to prevent expensive recalculations, and lift state down to avoid re-rendering entire component trees.\n4. **Virtualization & Assets**: Virtualize long lists with react-window, compress images, and cache static assets via CDN.',
    keyPointsToInclude: [
      'React DevTools Profiler & Lighthouse CWV',
      'React.lazy and Dynamic Route Splitting',
      'State Colocation & Memoization (useMemo / useCallback)',
      'DOM Virtualization & Asset Compression'
    ],
    starGuide: {
      situation: 'In my previous project, our dashboard page load time exceeded 4.2 seconds due to unoptimized state management.',
      task: 'My goal was to achieve an LCP under 1.2s and eliminate unnecessary DOM re-renders.',
      action: 'I audited the component graph with React DevTools, split bundle routes dynamically, virtualized dynamic tables, and implemented memoized selectors.',
      result: 'Reduced bundle size by 54% and improved page load performance score from 48 to 96 on Google Lighthouse.'
    }
  },
  {
    id: 'q-2',
    roleTitle: 'Software Engineer',
    category: 'System Design',
    difficulty: 'Medium',
    question: 'Describe how you would design a rate-limiting middleware for a RESTful API service.',
    suggestedAnswer: 'I would implement the Token Bucket algorithm using Redis:\n1. **Identification**: Track requests by Client IP address or Authenticated User JWT ID.\n2. **Redis In-Memory Key Store**: Store key rate:user:{id} with an atomic INCR and TTL expiration.\n3. **Middleware Flow**: Return HTTP 429 Too Many Requests if limit is exceeded.',
    keyPointsToInclude: [
      'Token Bucket / Sliding Window Log algorithm',
      'Redis atomic INCR & EXPIRE operations',
      'HTTP 429 Too Many Requests response headers'
    ]
  },
  {
    id: 'q-3',
    roleTitle: 'Software Engineer',
    category: 'Behavioral',
    difficulty: 'Medium',
    question: 'Tell me about a time when you faced a critical bug in production right before a major release. How did you handle it?',
    suggestedAnswer: 'During a production release, a race condition caused user session tokens to silently invalidate:\n1. **Immediate Triage**: Rolled back to stable tag and communicated transparently.\n2. **Root Cause Analysis**: Isolated bug using Sentry stack traces.\n3. **Fix & Verification**: Wrote regression unit test and patched refresh queue.',
    keyPointsToInclude: [
      'Calm incident response & immediate rollback',
      'Log/Stack trace triage using error monitoring',
      'Writing regression tests prior to hotfix deployment'
    ]
  }
];

export function generateTailoredInterviewQuestions(profile = {}, selectedJob) {
  const candidateSkills = profile.skills || ['React', 'Node.js', 'Python', 'JavaScript', 'SQL', 'MongoDB'];
  const projectQuestions = [];
  const companyUploadedQuestions = getCompanyUploadedQuestions();

  // 1. Dynamic Candidate Project Topic Framing
  if (candidateSkills.some(s => ['React', 'TypeScript', 'JavaScript', 'Frontend', 'Next.js', 'Vue', 'Tailwind'].includes(s))) {
    const matchedTopics = candidateSkills.filter(s => ['React', 'TypeScript', 'JavaScript', 'Next.js', 'Vue', 'Tailwind'].includes(s)).join(', ') || 'Frontend Frameworks';
    projectQuestions.push({
      id: 'proj-topic-1',
      roleTitle: selectedJob?.title || profile.title || 'Full Stack Developer',
      projectTopic: 'Frontend Project Architecture (' + matchedTopics + ')',
      source: 'project_based',
      category: 'Technical',
      difficulty: 'Medium',
      question: 'Project Deep-Dive: In your recent web project utilizing ' + matchedTopics + ', how did you architect state management, optimize asynchronous API re-renders, and maintain performance under heavy user interaction?',
      suggestedAnswer: 'For my web application project:\n1. **State Strategy**: Kept component state localized, using lightweight stores for global UI state and TanStack Query for cached server data.\n2. **Performance Tuning**: Applied code-splitting via React.lazy(), virtualized high-density DOM lists, and used useMemo/useCallback to eliminate unnecessary re-renders.\n3. **Type & Code Quality**: Enforced strict interfaces across API response DTOs to prevent runtime crashes.',
      keyPointsToInclude: [
        'Server state caching vs client UI state',
        'React.lazy dynamic route chunking & DOM virtualization',
        'Strict interfaces for API response safety'
      ],
      starGuide: {
        situation: 'Developing a high-traffic web dashboard project using ' + matchedTopics + '.',
        task: 'Prevent UI lag and maintain responsive 60fps rendering during fast real-time state updates.',
        action: 'Isolated volatile state, applied memoized selector hooks, and lazy-loaded heavy chart components.',
        result: 'Reduced bundle payload size by 45% and achieved sub-100ms UI interaction latency.'
      }
    });
  }

  if (candidateSkills.some(s => ['Node.js', 'Express', 'Python', 'FastAPI', 'Django', 'Java', 'Spring', 'Backend', 'REST API'].includes(s))) {
    const matchedTopics = candidateSkills.filter(s => ['Node.js', 'Express', 'Python', 'FastAPI', 'Django', 'Java', 'Spring', 'REST API'].includes(s)).join(', ') || 'Backend Services';
    projectQuestions.push({
      id: 'proj-topic-2',
      roleTitle: selectedJob?.title || profile.title || 'Backend Engineer',
      projectTopic: 'Backend & API Security (' + matchedTopics + ')',
      source: 'project_based',
      category: 'Technical',
      difficulty: 'Hard',
      question: 'Project Deep-Dive: In your backend service project constructed with ' + matchedTopics + ', explain your approach to securing API endpoints, preventing SQL/NoSQL injection, and handling rate limiting.',
      suggestedAnswer: 'In my backend project architecture:\n1. **Authentication & Authorization**: Implemented stateless JWT RS256 token authentication with RBAC middleware.\n2. **Injection Defense**: Utilized ORM parameterized queries to eradicate injection risks completely.\n3. **Traffic Rate Limiting**: Deployed Redis sliding-window rate limiters to shield endpoints against DDoS abuse.',
      keyPointsToInclude: [
        'JWT RS256 token verification & RBAC authorization',
        'Parameterized SQL/ORM queries to prevent injection attacks',
        'Redis rate limiting middleware'
      ]
    });
  }

  if (candidateSkills.some(s => ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQL', 'Database', 'NoSQL'].includes(s))) {
    const matchedTopics = candidateSkills.filter(s => ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQL', 'NoSQL'].includes(s)).join(', ') || 'Database Systems';
    projectQuestions.push({
      id: 'proj-topic-3',
      roleTitle: selectedJob?.title || profile.title || 'Data Systems Engineer',
      projectTopic: 'Database Design & Query Optimization (' + matchedTopics + ')',
      source: 'project_based',
      category: 'System Design',
      difficulty: 'Medium',
      question: 'Project Deep-Dive: In your project involving ' + matchedTopics + ', how did you design data models, create index strategies, and leverage caching to maximize query performance?',
      suggestedAnswer: 'For database performance in my project:\n1. **Data Modeling**: Normalized relational tables for consistency while using compound indexes on foreign keys and search filters.\n2. **In-Memory Caching**: Added a Redis Cache-Aside layer for hot read queries, reducing database load by over 70%.\n3. **Query Optimization**: Re-wrote N+1 queries using join joins and EXPLAIN execution plan analysis.',
      keyPointsToInclude: [
        'Compound database index optimization',
        'Redis Cache-Aside pattern with TTL expiration',
        'Eliminating N+1 queries using EXPLAIN plans'
      ]
    });
  }

  // 2. Prioritize Company Uploaded Questions
  let matchedCompanyQs = companyUploadedQuestions;
  if (selectedJob?.company) {
    const jobCo = selectedJob.company.toLowerCase();
    const specificCoQs = companyUploadedQuestions.filter(
      q => q.companyName && q.companyName.toLowerCase().includes(jobCo)
    );
    if (specificCoQs.length > 0) {
      matchedCompanyQs = [...specificCoQs, ...companyUploadedQuestions.filter(q => !specificCoQs.includes(q))];
    }
  }

  // 3. Combine & Deduplicate
  const combined = [
    ...matchedCompanyQs,
    ...projectQuestions,
    ...DEFAULT_INTERVIEW_QUESTIONS.map(q => ({ ...q, source: 'standard' }))
  ];

  const seen = new Set();
  const uniqueQuestions = [];
  for (const q of combined) {
    if (!seen.has(q.id)) {
      seen.add(q.id);
      uniqueQuestions.push(q);
    }
  }

  return uniqueQuestions;
}
