
const { getDueDatesInYear } = require('./src/utils/planningUtils');

const mockMaster_DMA = {
    id: 999,
    EquipmentName: "DMA",
    Frequency: "6 months", // Simulating the problematic string
    NextDueDate: "2026-01-01"
};

const mockHistory = [];
const year = 2026;

console.log("Testing Frequency: '6 months'");
const dates1 = getDueDatesInYear(mockMaster_DMA, mockHistory, year);
console.log(`Dates found: ${dates1.length}`);
dates1.forEach(d => console.log(d.toISOString()));

const mockMaster_DMA_Num = {
    id: 999,
    EquipmentName: "DMA",
    Frequency: 6,
    NextDueDate: "2026-01-01"
};

console.log("\nTesting Frequency: 6 (Number)");
const dates2 = getDueDatesInYear(mockMaster_DMA_Num, mockHistory, year);
console.log(`Dates found: ${dates2.length}`);
dates2.forEach(d => console.log(d.toISOString()));
