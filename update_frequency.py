
import re

def convert_frequency(match):
    freq_str = match.group(1)
    try:
        freq = float(freq_str)
        if freq == 0:
            months = 0 # Handle 0 case if any
        else:
            months = int(round(12 / freq))
        
        # Add LastDoneDate
        return f'"Frequency": {months},\n        "LastDoneDate": "2025-01-15",' 
    except ValueError:
        return match.group(0)

file_path = r"c:\Users\nattharm\Desktop\PMCAL\src\data\mockData.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Regex to find "Frequency": <number>, inside the mockData file.
# We trust that the formatting is consistent as seen in previous steps.
# Pattern looks for "Frequency" key, optional whitespace, colon, whitespace, number (int or float), comma.
pattern = r'"Frequency":\s*([\d\.]+),'

new_content = re.sub(pattern, convert_frequency, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Successfully converted Frequency to months and added LastDoneDate.")
