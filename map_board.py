import re
import json

# Read the RTF file
with open("circles.rtf", "r") as f:
    rtf_content = f.read()

# Remove line-continuation backslashes and join lines
clean_text = rtf_content.replace('\\\n', '').replace('\\\r\n', '')

# Extract all <circle ...> tags
circle_pattern = re.compile(r'<circle\s+[^>]*>', re.IGNORECASE)
circles = circle_pattern.findall(clean_text)

id_dict = {}

for circle in circles:
    # Extract id, cx, cy attributes
    cid_match = re.search(r'id="(\d+)"', circle)
    cx_match = re.search(r'cx="(\d+)"', circle)
    cy_match = re.search(r'cy="(\d+)"', circle)
    
    if cid_match and cx_match and cy_match:
        cid = int(cid_match.group(1))
        cx = int(cx_match.group(1))
        cy = int(cy_match.group(1))
        id_dict[cid] = {'cx': cx, 'cy': cy}

# Write JSON directly (no "id" wrapper)
with open("circles.json", "w") as json_file:
    json.dump(id_dict, json_file, indent=2)

print("JSON written to circles.json successfully!")
