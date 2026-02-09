import fs from 'fs';
import path from 'path';

const chunks = [
    'master_chunk1.json',
    'master_chunk2.json',
    'master_chunk3.json',
    'master_chunk4.json'
];

let allData = [];

chunks.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        allData = allData.concat(data);
    }
});

// Transform data
const transformedData = allData.map(item => ({
    id: parseInt(item.ID),
    CapabilityName: item.CapabilityName,
    Equipment: item.Equipment,
    EquipmentCode: item.EquipmentCode,
    DocumentCode: item.DocumentCode,
    Action: item.Action,
    Frequency: item.Frequency === "" ? null : parseFloat(item.Frequency),
    ServiceTime: item["ServiceTime(Days)"] === "" ? null : parseFloat(item["ServiceTime(Days)"]),
    PM: item.PM.toLowerCase() === "true",
    CAL: item.CAL.toLowerCase() === "true",
    PMby: item.PMby
}));

const mockDataPath = path.join(process.cwd(), 'src/data/mockData.js');
let mockDataContent = fs.readFileSync(mockDataPath, 'utf8');

// Replace the initialPMCALMaster array
const startMarker = 'export const initialPMCALMaster = [';
const endMarker = '];';

const startIndex = mockDataContent.indexOf(startMarker);
const remainingContent = mockDataContent.substring(startIndex);
const endIndex = remainingContent.indexOf(endMarker) + startIndex + endMarker.length;

const newArrayContent = `export const initialPMCALMaster = ${JSON.stringify(transformedData, null, 4)};`;

const updatedContent = mockDataContent.substring(0, startIndex) + newArrayContent + mockDataContent.substring(endIndex);

fs.writeFileSync(mockDataPath, updatedContent, 'utf8');
console.log('Successfully updated mockData.js with reassembled master data.');
