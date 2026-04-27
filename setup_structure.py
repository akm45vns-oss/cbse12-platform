import os
import json
import shutil

base_dir = r"c:\Users\akm45\Desktop\smart_study_hub"

# Directory structure
dirs = [
    "backend",
    "backend/models",
    "backend/routes",
    "backend/services",
    "backend/utils",
    "frontend",
    "frontend/css",
    "frontend/js",
    "frontend/assets",
    "frontend/assets/images",
    "frontend/assets/icons",
    "data"
]

# Create dirs
for d in dirs:
    os.makedirs(os.path.join(base_dir, d), exist_ok=True)

# Merge JSON files
json_files = [
    "python_programming.json",
    "computer_networks.json",
    "oop_cpp.json",
    "data_visualization.json",
    "machine_learning.json"
]

syllabus_data = {
    "platform": "Smart Study Hub",
    "courses": []
}

for jf in json_files:
    file_path = os.path.join(base_dir, jf)
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            course_data = json.load(f)
            syllabus_data["courses"].append(course_data)
        os.remove(file_path)

# Also load analytics_gamification and index metadata
analytics_path = os.path.join(base_dir, "analytics_gamification.json")
if os.path.exists(analytics_path):
    with open(analytics_path, "r", encoding="utf-8") as f:
        syllabus_data["analytics_gamification"] = json.load(f)
    os.remove(analytics_path)

index_path = os.path.join(base_dir, "index.json")
if os.path.exists(index_path):
    with open(index_path, "r", encoding="utf-8") as f:
        syllabus_data["metadata"] = json.load(f)
    os.remove(index_path)

with open(os.path.join(base_dir, "data", "syllabus.json"), "w", encoding="utf-8") as f:
    json.dump(syllabus_data, f, indent=2)

# Move frontend files
html_path = os.path.join(base_dir, "index.html")
css_path = os.path.join(base_dir, "styles.css")

if os.path.exists(html_path):
    # For now, move it to index.html, we will split it via the agent next
    shutil.move(html_path, os.path.join(base_dir, "frontend", "index.html"))

if os.path.exists(css_path):
    shutil.move(css_path, os.path.join(base_dir, "frontend", "css", "styles.css"))

# Create empty files
empty_backend_files = [
    "backend/app.py",
    "backend/config.py",
    "backend/database.db",
    "backend/models/__init__.py",
    "backend/models/user.py",
    "backend/models/course.py",
    "backend/models/quiz.py",
    "backend/models/performance.py",
    "backend/models/gamification.py",
    "backend/routes/__init__.py",
    "backend/routes/auth_routes.py",
    "backend/routes/course_routes.py",
    "backend/routes/quiz_routes.py",
    "backend/routes/analytics_routes.py",
    "backend/routes/leaderboard_routes.py",
    "backend/services/__init__.py",
    "backend/services/quiz_service.py",
    "backend/services/analytics_service.py",
    "backend/services/gamification_service.py",
    "backend/utils/__init__.py",
    "backend/utils/helpers.py",
    "backend/utils/validators.py",
    "requirements.txt"
]

empty_frontend_files = [
    "frontend/dashboard.html",
    "frontend/courses.html",
    "frontend/quiz.html",
    "frontend/leaderboard.html",
    "frontend/js/app.js",
    "frontend/js/quiz.js",
    "frontend/js/dashboard.js",
    "frontend/js/charts.js",
]

for f in empty_backend_files + empty_frontend_files:
    open(os.path.join(base_dir, f), "a").close()

print("Setup completed successfully.")
