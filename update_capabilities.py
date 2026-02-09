# Script to update capability names in mockData.js
import re

# Read the file
file_path = r'd:\OneDrive - The Siam Cement Public Company Limited\Desktop\PMCAL\src\data\mockData.js'

with  open(file_path, 'r', encoding='utf-8') as file:
    content = file.read()

# Define capability mapping
mappings = [
    ('CapabilityName: "Thermal Analysis"', 'CapabilityName: "Microstructure"'),
    ('CapabilityName: "Microscopy"', 'CapabilityName: "Imaging"'),
    ('CapabilityName: "Spectroscopy"', 'CapabilityName: "Small molecules"'),
    ('Capability: "Spectroscopy"', 'Capability: "Small molecules"'),
    ('CapabilityName: "Chromatography"', 'CapabilityName: "Small molecules"'),
    ('Capability: "Chromatography"', 'Capability: "Small molecules"'),
    ('CapabilityName: "Mechanical Testing"', 'CapabilityName: "Mesostructure"'),
    ('Capability: "Mechanical Testing"', 'Capability: "Mesostructure"'),
    ('CapabilityName: "Physical Testing"', 'CapabilityName: "Mesostructure"'),
    ('Capability: "Physical Testing"', 'Capability: "Mesostructure"'),
    ('Capability: "Thermal Analysis"', 'Capability: "Microstructure"'),
    ('Capability: "Microscopy"', 'Capability: "Imaging"')
]

# Apply all replacements
for old, new in mappings:
    content = content.replace(old, new)

# Write back
with open(file_path, 'w', encoding='utf-8') as file:
    file.write(content)

print("Capability names updated successfully!")
print(f"File: {file_path}")
