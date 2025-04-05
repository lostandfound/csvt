// examples/basic-usage.ts
import { parseCsvt } from '../src/index.js'; // Adjust path if running after build

const csvtString = `id:number!,name,registered:bool,score:number,data:object
1,Alice,true,95,"{\""valid\": true}"
2,Bob,false,,"{\""value\": 123}"
3,Charlie,true,88,
4,David,YES,70,"invalid-json"`; // bool error, type error

console.log('--- Strict Mode (Default) ---');
try {
  const resultStrict = parseCsvt(csvtString);
  console.log('Data:', resultStrict.data);
  console.log('Headers:', resultStrict.headers);
  console.log('Errors:', resultStrict.errors);
} catch (error) {
  console.error('ERROR:', error instanceof Error ? error.message : error);
}

console.log('\n--- Collect Mode ---');
const resultCollect = parseCsvt(csvtString, { errorMode: 'collect' });
console.log('Data:', resultCollect.data);
console.log('Headers:', resultCollect.headers);
console.log('Errors:', resultCollect.errors);

console.log('\n--- SubstituteNull Mode ---');
const resultSubstitute = parseCsvt(csvtString, { errorMode: 'substituteNull' });
console.log('Data:', resultSubstitute.data);
console.log('Headers:', resultSubstitute.headers);
console.log('Errors:', resultSubstitute.errors);

// Example with type parameter
interface UserScore {
    id: number;
    name: string;
    registered: boolean;
    score: number | null;
    data: Record<string, unknown> | null;
}

console.log('\n--- Typed Parsing (Collect) ---');
const resultTyped = parseCsvt<UserScore>(csvtString, { errorMode: 'collect' });
// resultTyped.data will be typed as UserScore[]
// Note: Errors still cause rows to be skipped in collect mode
console.log('Typed Data:', resultTyped.data); 