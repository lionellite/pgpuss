// Test script to see our sanitization
const testUrl = ' `http://217.76.59.131:8000/api/complaints/webhooks/whatsapp/` ';
console.log('Original URL:', JSON.stringify(testUrl));

// Let's try our current regex
let result1 = testUrl.trim().replace(/^[\s`'"]+|[\s`'"]+$/g, '');
console.log('Result 1 (current regex):', JSON.stringify(result1));

// Let's try a better approach: just replace all leading/trailing non-URL characters
// Or let's just trim and then remove any leading/trailing backticks/quotes again, step by step
let result2 = testUrl;
result2 = result2.trim(); // First trim whitespace
result2 = result2.replace(/^(`|'|")+/, ''); // Remove leading quotes/backticks
result2 = result2.replace(/(`|'|")+$/, ''); // Remove trailing quotes/backticks
console.log('Result 2 (step by step):', JSON.stringify(result2));

// Let's also try a more aggressive approach
let result3 = testUrl.replace(/[`'"\s]+$/g, '').replace(/^[`'"\s]+/g, '');
console.log('Result 3 (aggressive):', JSON.stringify(result3));
