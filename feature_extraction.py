import json
import cv2
import numpy as np
import os

# --- CONFIG ---
image_path = "route_pictures/tap_tap_tap.jpg"  # path to your climbing board image
holds_json = "circles.json"  # path to your file with all hold positions

scale_x = 1.1979166666666667
scale_y = 1.1990740740740742
offset_x = -5.875
offset_y = 33.02777777777777

outer_scale = 0.95    # outer circle scale (90% of radius)
inner_scale = 0.85    # inner circle scale (80% of radius)

min_fraction = 0.75  # minimum fraction of ring pixels needed
min_pixels = 125      # minimum number of valid pixels to count

# === LOAD IMAGE ===
img = cv2.imread(image_path)
if img is None:
    raise FileNotFoundError(f"Could not load {image_path}")

with open(holds_json, "r") as f:
    holds = json.load(f)

highlighted = {}

# === PREPARE hold centers ===
hold_centers = {}
for hold_id, hold in holds.items():
    cx = hold["cx"] * scale_x + offset_x
    cy = hold["cy"] * scale_y + offset_y
    hold_centers[hold_id] = (cx, cy)

# === HELPER FUNCTIONS ===
def count_dominant_color(h_vals, s_vals, v_vals):
    valid_mask = (s_vals >= 60) & (v_vals >= 50)
    num_valid = np.sum(valid_mask)
    if num_valid < min_pixels:
        return None, 0

    h_vals = h_vals[valid_mask]

    color_counts = {
        "orange": np.sum((0 <= h_vals) & (h_vals < 25)),
        "green":  np.sum((25 <= h_vals) & (h_vals < 90)),
        "cyan":   np.sum((90 <= h_vals) & (h_vals < 130)),
        "purple": np.sum((130 <= h_vals) & (h_vals < 165))
    }

    dominant_color = max(color_counts, key=color_counts.get)
    fraction = color_counts[dominant_color] / num_valid

    if fraction < min_fraction:
        return None, fraction

    return dominant_color, fraction

def snap_to_closest_hold(cx, cy, hold_centers):
    min_dist = float("inf")
    closest_id = None
    for hold_id, (hx, hy) in hold_centers.items():
        dist = np.sqrt((cx - hx)**2 + (cy - hy)**2)
        if dist < min_dist:
            min_dist = dist
            closest_id = hold_id
    return closest_id

# === PROCESS EACH HOLD ===
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

for hold_id, hold in holds.items():
    cx = int(hold["cx"] * scale_x + offset_x)
    cy = int(hold["cy"] * scale_y + offset_y)
    outer_r = int(hold["r"] * scale_x * outer_scale)
    inner_r = int(hold["r"] * scale_x * inner_scale)

    if not (0 <= cx < img.shape[1] and 0 <= cy < img.shape[0]):
        continue

    # Build outer and inner masks
    mask_outer = np.zeros(img.shape[:2], np.uint8)
    cv2.circle(mask_outer, (cx, cy), outer_r, 255, -1)
    mask_inner = np.zeros(img.shape[:2], np.uint8)
    cv2.circle(mask_inner, (cx, cy), inner_r, 255, -1)

    # Ring mask = outer - inner
    ring_mask = cv2.subtract(mask_outer, mask_inner)

    # Extract HSV pixels in the ring
    region = cv2.bitwise_and(hsv, hsv, mask=ring_mask)
    h_vals = region[:, :, 0][ring_mask > 0]
    s_vals = region[:, :, 1][ring_mask > 0]
    v_vals = region[:, :, 2][ring_mask > 0]

    # Compute dominant color and fraction
    color, fraction = count_dominant_color(h_vals, s_vals, v_vals)
    if color:
        # Snap to closest hold ID
        snapped_id = snap_to_closest_hold(cx, cy, hold_centers)

        # Convert back to original coordinates for output
        orig_cx = (hold_centers[snapped_id][0] - offset_x) / scale_x
        orig_cy = (hold_centers[snapped_id][1] - offset_y) / scale_y

        highlighted[snapped_id] = {
            "cx": int(orig_cx),
            "cy": int(orig_cy),
            "color": color
        }

# === WRITE OUTPUT JSON ===
# Make sure the output directory exists
output_dir = "extract_json"
os.makedirs(output_dir, exist_ok=True)

# Build output path: extract_json/<original_file_name>.json
base_name = os.path.splitext(os.path.basename(image_path))[0]
output_path = os.path.join(output_dir, base_name + ".json")

# Write JSON
with open(output_path, "w") as f:
    json.dump(highlighted, f, indent=2)

print(f"Output written to {output_path}")
