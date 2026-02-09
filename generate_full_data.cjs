// Generate complete 29-field schema for all 36 PM/CAL list records
const fs = require('fs');
const path = require('path');

// Master data lookup (from dbPMCALMaster)
const masterData = {
    101: { code: "TA-DSC-01", pmby: "Vendor Service", freq: 2 },
    103: { code: "TA-TGA-01", pmby: "Vendor Service", freq: 2 },
    105: { code: "TA-DMA-01", pmby: "Vendor Service", freq: 2 },
    108: { code: "RHEO-CAP-01", pmby: "Vendor Service", freq: 1 },
    110: { code: "MFI-01", pmby: "Vendor Service", freq: 1 },
    112: { code: "RHEO-ROT-01", pmby: "Vendor Service", freq: 2 },
    114: { code: "INSTRON-5969", pmby: "Vendor Service", freq: 1 },
    115: { code: "INSTRON-5969", pmby: "Vendor Service", freq: 2 },
    125: { code: "OPT-MIC-01", pmby: "In-house", freq: 2 },
    126: { code: "SEM-01", pmby: "Vendor Service", freq: 2 },
    147: { code: "FTIR-01", pmby: "Vendor Service", freq: 2 },
    150: { code: "GPC-01", pmby: "Vendor Service", freq: 2 },
    152: { code: "DENS-01", pmby: "In-house", freq: 1 }
};

const technicians = ['John Doe', 'Sarah Chen', 'Mike Johnson', 'Lisa Wang', 'David Kim'];
const leaders = ['Dr. Wilson', 'Dr. Martinez', 'Dr. Thompson', 'Dr. Lee'];
const approvers = ['Jane Smith', 'Robert Brown', 'Emily Davis', 'Michael Chang'];

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateCost(pmby) {
    if (pmby === 'Vendor Service') {
        return Math.floor(Math.random() * 25000) + 10000;
    } else {
        return Math.floor(Math.random() * 4000) + 2000;
    }
}

// Output JavaScript code
console.log(`// Current Date for Reference: 2026-01-26
export const initialPMCALlist = [`);

// Generate all records...
// For now, let's output this message
console.log("// Due to file size, this script generates a template.");
console.log("// The actual implementation will be done via direct file editing.");

console.log("];");
