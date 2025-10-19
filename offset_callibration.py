import json
import cv2
import numpy as np

# --- CONFIG ---
image_path = "kilter_board.jpg"  # path to your climbing board image
holds_json = "circles.json"  # path to your file with all hold positions

# === LOAD ===
img = cv2.imread(image_path)
with open(holds_json, "r") as f:
    holds = json.load(f)

clicked_points = []

def click_event(event, x, y, flags, param):
    if event == cv2.EVENT_LBUTTONDOWN:
        clicked_points.append((x, y))
        print(f"Clicked at ({x}, {y})")
        cv2.circle(img, (x, y), 5, (0, 0, 255), -1)
        cv2.imshow("Click two holds", img)

print("Click the TOP-LEFT highlighted hold, then the BOTTOM-RIGHT highlighted hold.")
cv2.imshow("Click two holds", img)
cv2.setMouseCallback("Click two holds", click_event)
cv2.waitKey(0)
cv2.destroyAllWindows()

if len(clicked_points) != 2:
    print("⚠️ You must click exactly two points.")
    exit()

(x1_img, y1_img), (x2_img, y2_img) = clicked_points

# === User input ===
h1 = input("Enter the hold ID of the FIRST (top-left) clicked hold: ").strip()
h2 = input("Enter the hold ID of the SECOND (bottom-right) clicked hold: ").strip()

cx1_json, cy1_json = holds[h1]["cx"], holds[h1]["cy"]
cx2_json, cy2_json = holds[h2]["cx"], holds[h2]["cy"]

# === Compute scale and offset ===
scale_x = (x2_img - x1_img) / (cx2_json - cx1_json)
scale_y = (y2_img - y1_img) / (cy2_json - cy1_json)

offset_x = x1_img - cx1_json * scale_x
offset_y = y1_img - cy1_json * scale_y

print("\nCalibration complete.")
print(json.dumps({
    "scale_x": scale_x,
    "scale_y": scale_y,
    "offset_x": offset_x,
    "offset_y": offset_y
}, indent=2))