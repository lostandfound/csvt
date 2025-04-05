import { writeCsvt } from '../src/index'; // Adjust path based on execution context

console.log('--- Basic Writer Usage (Infer Headers) ---');

const dataToWrite1 = [
  { id: 1, name: 'Alice', score: 95.5, active: true, tags: ['A', 'B'], profile: { age: 30 }, createdAt: new Date('2023-10-27T10:00:00Z') },
  { id: 2, name: 'Bob, "The Builder"', score: null, active: false, tags: ['C'], profile: { age: 45, city: 'New York' }, createdAt: new Date('2023-10-28T11:30:00Z') },
  { id: 3, name: 'Charlie\nSmith', score: 88, active: true, tags: [], profile: null, createdAt: new Date('2023-10-29') } // Date only
];

try {
  const csvtString1 = writeCsvt(dataToWrite1);
  console.log('Generated CSVT (Inferred Headers):\n', csvtString1);
} catch (error) {
  console.error('Error generating CSVT:', error);
}


console.log('\n--- Writer Usage (Specify Headers) ---');

const dataToWrite2 = [
    { id: 1, user_name: 'Alice', registration_date: new Date('2023-01-15T08:00:00Z'), points: 100 },
    { id: 2, user_name: 'Bob', registration_date: new Date('2023-02-20T10:30:00Z'), points: 150 }
];

try {
  const csvtString2 = writeCsvt(dataToWrite2, {
    headers: [
      { name: 'ID', type: 'number!' },
      { name: 'Username', type: 'string' },
      { name: 'Registered Date', type: 'date' },
    ]
  });
  console.log('\nGenerated CSVT (Specified Headers):\n', csvtString2);
} catch (error) {
    console.error('Error generating CSVT with specified headers:', error);
}

console.log('\nTo run this example:');
console.log('1. Ensure dependencies are installed: npm install');
console.log('2. Compile TypeScript: npm run build');
console.log('3. Run with Node: node dist/examples/writer-usage.js'); 