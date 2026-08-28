export default function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { company = 'Google Cloud India', difficulty = 'Medium', topic = 'Dynamic Programming' } = req.body || req.query || {};

  const problems = {
    'Dynamic Programming': {
      id: 'dp_01',
      title: 'Maximum Subarray (Kadane\'s Algorithm)',
      difficulty: 'Medium',
      topic: 'Dynamic Programming',
      company: company || 'Reliance Industries / Google Cloud',
      description: 'Given an integer array `nums`, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.\n\nYou must solve this in O(n) linear time complexity.',
      starterCode: 'function maxSubArray(nums) {\n  if (!nums || nums.length === 0) return 0;\n  let currentSum = nums[0];\n  let maxSum = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    currentSum = Math.max(nums[i], currentSum + nums[i]);\n    maxSum = Math.max(maxSum, currentSum);\n  }\n  return maxSum;\n}',
      testCases: [
        { input: '[-2, 1, -3, 4, -1, 2, 1, -5, 4]', expected: '6' },
        { input: '[1]', expected: '1' },
        { input: '[5, 4, -1, 7, 8]', expected: '23' }
      ],
      constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4', 'Optimal Time: O(n), Space: O(1)']
    },
    'Arrays & Hashing': {
      id: 'arr_01',
      title: 'Longest Consecutive Elements Sequence',
      difficulty: 'Medium',
      topic: 'Arrays & Hashing',
      company: company || 'Google Cloud India',
      description: 'Given an unsorted array of integers `nums`, return the length of the longest consecutive elements sequence.\n\nYou must write an algorithm that runs in `O(n)` time complexity.',
      starterCode: 'function longestConsecutive(nums) {\n  if (!nums || nums.length === 0) return 0;\n  const numSet = new Set(nums);\n  let longest = 0;\n  for (const num of numSet) {\n    if (!numSet.has(num - 1)) {\n      let current = num;\n      let streak = 1;\n      while (numSet.has(current + 1)) {\n        current += 1;\n        streak += 1;\n      }\n      longest = Math.max(longest, streak);\n    }\n  }\n  return longest;\n}',
      testCases: [
        { input: '[100, 4, 200, 1, 3, 2]', expected: '4' },
        { input: '[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]', expected: '9' },
        { input: '[]', expected: '0' }
      ],
      constraints: ['0 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9', 'Time: O(n)']
    },
    'Trees & Graphs': {
      id: 'tree_01',
      title: 'Number of Islands (Grid BFS / DFS)',
      difficulty: 'Medium',
      topic: 'Trees & Graphs',
      company: company || 'Google Cloud India / Amazon',
      description: 'Given an `m x n` 2D binary grid `grid` which represents a map of `\'1\'`s (land) and `\'0\'`s (water), return the number of islands.',
      starterCode: 'function numIslands(grid) {\n  if (!grid || grid.length === 0) return 0;\n  let count = 0;\n  function dfs(r, c) {\n    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] !== "1") return;\n    grid[r][c] = "0";\n    dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);\n  }\n  for (let r = 0; r < grid.length; r++) {\n    for (let c = 0; c < grid[0].length; c++) {\n      if (grid[r][c] === "1") { count++; dfs(r, c); }\n    }\n  }\n  return count;\n}',
      testCases: [
        { input: 'grid = [["1","1","0"],["1","1","0"],["0","0","1"]]', expected: '2 islands' }
      ],
      constraints: ['1 <= m, n <= 300']
    },
    'Two Pointers & Sliding Window': {
      id: 'tp_01',
      title: 'Container With Most Water',
      difficulty: 'Medium',
      topic: 'Two Pointers & Sliding Window',
      company: company || 'Microsoft Azure / Reliance',
      description: 'Given an integer array `height`, find two lines that together with the x-axis form a container containing the most water.',
      starterCode: 'function maxArea(height) {\n  let left = 0, right = height.length - 1, maxWater = 0;\n  while (left < right) {\n    const w = right - left;\n    const h = Math.min(height[left], height[right]);\n    maxWater = Math.max(maxWater, w * h);\n    if (height[left] < height[right]) left++;\n    else right--;\n  }\n  return maxWater;\n}',
      testCases: [
        { input: '[1, 8, 6, 2, 5, 4, 8, 3, 7]', expected: '49' }
      ],
      constraints: ['2 <= height.length <= 10^5']
    },
    'Stack & String Algorithms': {
      id: 'stack_01',
      title: 'Valid Parentheses String Matching',
      difficulty: 'Easy',
      topic: 'Stack & String Algorithms',
      company: company || 'TCS / GSFC Limited',
      description: 'Determine if input string containing brackets is valid.',
      starterCode: 'function isValid(s) {\n  const stack = [];\n  const map = { ")": "(", "}": "{", "]": "[" };\n  for (const c of s) {\n    if (c === "(" || c === "{" || c === "[") stack.push(c);\n    else if (stack.length === 0 || stack.pop() !== map[c]) return false;\n  }\n  return stack.length === 0;\n}',
      testCases: [
        { input: 's = "()[]{}"', expected: 'true' }
      ],
      constraints: ['1 <= s.length <= 10^4']
    }
  };

  const prob = problems[topic] || problems['Dynamic Programming'];
  return res.status(200).json(prob);
}
