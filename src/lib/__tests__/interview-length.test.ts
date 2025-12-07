// Test file to demonstrate interview length functionality
import { analyzeInterviewLength, INTERVIEW_THRESHOLDS } from '../gemini-feedback';

// Mock transcript data for testing
const mockShortTranscript = [
  { id: 1, sender: 'ai' as const, text: 'Hello, let\'s start the interview.' },
  { id: 2, sender: 'user' as const, text: 'Hi' },
  { id: 3, sender: 'ai' as const, text: 'Tell me about yourself.' },
  { id: 4, sender: 'user' as const, text: 'I quit' }
];

const mockMediumTranscript = [
  { id: 1, sender: 'ai' as const, text: 'Hello, let\'s start the interview for the Software Engineer position.' },
  { id: 2, sender: 'user' as const, text: 'Hi, I\'m excited to be here.' },
  { id: 3, sender: 'ai' as const, text: 'Great! Tell me about your background in software development.' },
  { id: 4, sender: 'user' as const, text: 'I have 3 years of experience working with React and Node.js. I built several web applications.' },
  { id: 5, sender: 'ai' as const, text: 'Excellent. Can you explain the concept of closures in JavaScript?' },
  { id: 6, sender: 'user' as const, text: 'A closure is a function that has access to variables in its outer scope even after the outer function returns.' },
  { id: 7, sender: 'ai' as const, text: 'Good explanation. How would you optimize a slow database query?' },
  { id: 8, sender: 'user' as const, text: 'I would start by analyzing the query execution plan, adding appropriate indexes, and optimizing the WHERE clauses.' },
  { id: 9, sender: 'ai' as const, text: 'What\'s your experience with testing frameworks?' },
  { id: 10, sender: 'user' as const, text: 'I\'ve used Jest for unit testing and Cypress for end-to-end testing.' },
  { id: 11, sender: 'ai' as const, text: 'How do you handle state management in React applications?' },
  { id: 12, sender: 'user' as const, text: 'For simple state, I use useState and useContext. For complex state, I prefer Redux Toolkit.' },
  { id: 13, sender: 'ai' as const, text: 'Describe a challenging bug you encountered and how you solved it.' },
  { id: 14, sender: 'user' as const, text: 'I had a memory leak in a React app caused by not cleaning up event listeners in useEffect.' },
  { id: 15, sender: 'ai' as const, text: 'Thank you for the detailed responses. That concludes our interview.' }
];

// Test the analysis functionality
console.log('=== Interview Length Analysis Test ===');

console.log('\n1. Testing SHORT interview:');
const shortAnalysis = analyzeInterviewLength(mockShortTranscript);
console.log('Short interview analysis:', shortAnalysis);

console.log('\n2. Testing MEDIUM interview:');
const mediumAnalysis = analyzeInterviewLength(mockMediumTranscript);
console.log('Medium interview analysis:', mediumAnalysis);

console.log('\n3. Interview Thresholds:');
console.log('MINIMUM_TURNS:', INTERVIEW_THRESHOLDS.MINIMUM_TURNS);
console.log('SHORT_INTERVIEW:', INTERVIEW_THRESHOLDS.SHORT_INTERVIEW);
console.log('MEDIUM_INTERVIEW:', INTERVIEW_THRESHOLDS.MEDIUM_INTERVIEW);
console.log('LONG_INTERVIEW:', INTERVIEW_THRESHOLDS.LONG_INTERVIEW);

console.log('\n4. Expected categories:');
console.log(`Short transcript (${shortAnalysis.totalTurns} turns) should be: ${shortAnalysis.category}`);
console.log(`Medium transcript (${mediumAnalysis.totalTurns} turns) should be: ${mediumAnalysis.category}`);

console.log('\n=== Test completed successfully ===');