import json
import os
from flask import Blueprint, jsonify
from config import Config

bp = Blueprint('analytics', __name__)

@bp.route('/dashboard', methods=['GET'])
def get_dashboard_stats():
    """Returns mock dashboard statistics synthesized from the master syllabus data."""
    syllabus_path = os.path.join(Config.DATA_FOLDER, 'syllabus.json')
    try:
        with open(syllabus_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
            # Synthesize some fake student progress based on the loaded courses
            courses = data.get('courses', [])
            total_courses = len(courses)
            
            # Extract weak topics purely for demonstration
            weak_topics = []
            if courses:
                # Pick a couple random subtopics or units as "weak"
                for course in courses[:2]:
                    if "units" in course and course["units"]:
                        unit = course["units"][0]
                        weak_topics.append({
                            "name": unit["unit_name"],
                            "course": course["course"],
                            "score": "62%"
                        })
                        
            # Extract badge icons from gamification schema if available
            badges = []
            metadata = data.get("analytics_gamification", {})
            if "gamification_mapping" in metadata:
                global_badges = metadata["gamification_mapping"].get("badges", {}).get("global_badges", [])
                for b in global_badges[:4]:
                    badges.append(b)

            stats = {
                "user": {
                    "username": "Alex",
                    "xp": 342,
                    "level": 3,
                    "level_title": "Learner",
                    "streak_days": 7
                },
                "metrics": {
                    "accuracy_pct": 78,
                    "enrolled_courses": 3,
                    "total_courses": total_courses
                },
                "weak_topics": weak_topics,
                "recent_badges": badges
            }
            
            return jsonify(stats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
