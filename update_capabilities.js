// Script to update capability names in mockData.js
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'data', 'mockData.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Define capability mapping
const mappings = [
    ['CapabilityName: "Thermal Analysis"', 'CapabilityName: "Microstructure"'],
    ['CapabilityName: "Microscopy"', 'CapabilityName: "Imaging"'],
    ['CapabilityName: "Spectroscopy"', 'CapabilityName: "Small molecules"'],
    ['Capability: "Spectroscopy"', 'Capability: "Small molecules"'],
    ['CapabilityName: "Chromatography"', 'CapabilityName: "Small molecules"'],
    ['Capability: "Chromatography"', 'Capability: "Small molecules"'],
    ['CapabilityName: "Mechanical Testing"', 'CapabilityName: "Mesostructure"'],
    ['Capability: "Mechanical Testing"', 'Capability: "Mesostructure"'],
    ['CapabilityName: "Physical Testing"', 'CapabilityName: "Mesostructure"'],
    ['Capability: "Physical Testing"', 'Capability: "Mesostructure"'],
    ['Capability: "Thermal Analysis"', 'Capability: "Microstructure"'],
    ['Capability: "Microscopy"', 'Capability: "Imaging"']
];

// Apply all  replacements
mappings.forEach(([oldVal, newVal]) => {
    const regex = new RegExp(oldVal.replace(/"/g, '\\"'), 'g');
    content = content.split(oldVal).join(newVal);
});

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log("Capability names updated successfully!");
console.log(`File: ${filePath}`);
