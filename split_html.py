import os
import re

base = r"c:\Users\akm45\Desktop\smart_study_hub\frontend"
index_path = os.path.join(base, "index.html")

if not os.path.exists(index_path):
    print("index.html not found, skipping split")
    exit(0)

with open(index_path, "r", encoding="utf-8") as f:
    html = f.read()

# Extract segments
# Sidebar
sidebar_match = re.search(r'(<aside class="sidebar" id="sidebar">.*?</aside>)', html, re.DOTALL)
sidebar = sidebar_match.group(1) if sidebar_match else ""

# Topbar
topbar_match = re.search(r'(<header class="topbar" id="topbar">.*?</header>)', html, re.DOTALL)
topbar = topbar_match.group(1) if topbar_match else ""

# Pages
dashboard_match = re.search(r'(<section class="page active" id="page-dashboard">.*?</section>\n\n    <!-- ─────────────  COURSES PAGE)', html, re.DOTALL)
dashboard = dashboard_match.group(1).replace('<!-- ─────────────  COURSES PAGE', '').strip() if dashboard_match else ""

courses_match = re.search(r'(<section class="page" id="page-courses">.*?</section>\n\n    <!-- ─────────────  LEADERBOARD)', html, re.DOTALL)
courses = courses_match.group(1).replace('<!-- ─────────────  LEADERBOARD', '').strip() if courses_match else ""

leaderboard_match = re.search(r'(<section class="page" id="page-leaderboard">.*?</section>\n\n    <!-- ─────────────  PROFILE)', html, re.DOTALL)
leaderboard = leaderboard_match.group(1).replace('<!-- ─────────────  PROFILE', '').strip() if leaderboard_match else ""

quiz_match = re.search(r'(<div class="modal-overlay" id="quiz-modal".*?</div>\n    </div>)', html, re.DOTALL)
quiz = quiz_match.group(1) if quiz_match else ""

head = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Smart Study Hub</title>
  <link rel="stylesheet" href="css/styles.css" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body>
"""

tail = """  </main>
  <script src="js/app.js"></script>
</body>
</html>
"""

def make_page(filename, content, script=""):
    with open(os.path.join(base, filename), "w", encoding="utf-8") as f:
        f.write(head)
        f.write(sidebar)
        f.write("\n")
        f.write(topbar)
        f.write('\n  <main class="main-content" id="main-content">\n')
        f.write(content)
        t = tail
        if script:
            t = t.replace('<script src="js/app.js"></script>', f'<script src="js/app.js"></script>\n  <script src="js/{script}"></script>')
        f.write("\n" + t)

make_page("dashboard.html", dashboard, "dashboard.js")
make_page("courses.html", courses, "app.js") # reuse app or courses
make_page("leaderboard.html", leaderboard, "")
make_page("quiz.html", quiz, "quiz.js")

# Rewrite index.html as a redirect or login
with open(index_path, "w", encoding="utf-8") as f:
    f.write(head)
    f.write('''  <div style="display:flex; height:100vh; align-items:center; justify-content:center; flex-direction:column;">
    <h1>Smart Study Hub</h1>
    <a href="dashboard.html" style="padding:10px 20px; background:#4f8ef7; color:#fff; border-radius:8px; text-decoration:none; margin-top:20px;">Enter Dashboard</a>
  </div>
</body>
</html>
''')

print("Frontend pages split correctly.")
