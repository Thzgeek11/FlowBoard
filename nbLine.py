import os

EXTENSIONS = {".py", ".js", ".html", ".css"}

def count_lines(directory):
    total = 0

    for root, _, files in os.walk(directory):
        for file in files:
            if not any(file.endswith(ext) for ext in EXTENSIONS):
                continue

            path = os.path.join(root, file)

            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                lines = sum(1 for _ in f)

            print(f"{path} : {lines} lignes")
            total += lines

    print("\n======================")
    print(f"TOTAL CODE : {total} lignes")


count_lines("backend")
count_lines("frontend")
