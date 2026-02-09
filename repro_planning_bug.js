
const { getDueDatesInYear } = require('./src/utils/planningUtils');

// Mock Data
const masterItem = {
    id: 999,
    Equipment: 'Test Eq',
    Frequency: '6', // String frequency!
    NextDueDate: '2024-01-15'
};

const historyList = [];
const targetYear = 2024;

console.log("Testing with String Frequency '6'...");
const results = getDueDatesInYear(masterItem, historyList, targetYear);
console.log(`Found ${results.length} dates:`, results.map(d => d.toISOString().split('T')[0]));

if (results.length === 1) {
    console.log("FAIL: Only found 1 instead of 2. String concatenation bug confirmed.");
} else if (results.length === 2) {
    console.log("PASS: Found 2 dates.");
} else {
    console.log("Unexpected result.");
}

// Test with Integer
const masterItemInt = { ...masterItem, Frequency: 6 };
console.log("\nTesting with Integer Frequency 6...");
const resultsInt = getDueDatesInYear(masterItemInt, historyList, targetYear);
console.log(`Found ${resultsInt.length} dates:`, resultsInt.map(d => d.toISOString().split('T')[0]));
