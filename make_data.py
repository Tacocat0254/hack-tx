import os
import json

INPUT_DIR = "extract_json"
OUTPUT_PATH = "all_climbs.json"

def main():
    climbs = []

    for filename in os.listdir(INPUT_DIR):
        if not filename.endswith(".json"):
            continue

        file_path = os.path.join(INPUT_DIR, filename)
        with open(file_path, "r") as f:
            try:
                data = json.load(f)
                climbs.append(data)
            except json.JSONDecodeError:
                print(f"Skipping invalid JSON: {filename}")

    with open(OUTPUT_PATH, "w") as out:
        json.dump(climbs, out, indent=2)

    print(f"Saved {len(climbs)} climbs to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
