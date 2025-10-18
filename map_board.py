import xml.etree.ElementTree as ET
import json
from striprtf.striprtf import rtf_to_text

# Read the RTF file
with open("circles.rtf", "r") as file:
    rtf_content = file.read()

# Convert RTF to plain text
plain_text = rtf_to_text(rtf_content)

# Parse as XML (wrap in <svg> if needed)
root = ET.fromstring(f"<svg>{plain_text}</svg>")

id_dict = {}
for circle in root.findall('circle'):
    cid = circle.attrib.get('id')
    cx = circle.attrib.get('cx')
    cy = circle.attrib.get('cy')
    if cid and cx and cy:
        id_dict[int(cid)] = {'cx': int(cx), 'cy': int(cy)}

# Wrap under "id" key
output = {"id": id_dict}

# Convert to JSON
json_output = json.dumps(output, indent=2)
print(json_output)
