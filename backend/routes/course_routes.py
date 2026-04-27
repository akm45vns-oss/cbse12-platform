import json
import os
from flask import Blueprint, jsonify

bp = Blueprint('courses', __name__)

@bp.route('/', methods=['GET'])
def get_courses():
    try:
        from models.course import Course
        courses = Course.query.all()
        result = []
        for c in courses:
            result.append({
                'id': c.id,
                'title': c.title,
                'description': c.description,
                'total_units': len(c.units),
                'difficulty': 'Mixed' # Could derive from units
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/<int:course_id>', methods=['GET'])
def get_course_detail(course_id):
    try:
        from models.course import Course
        c = Course.query.get(course_id)
        if not c:
            return jsonify({"error": "Course not found"}), 404
        
        c_dict = {
            'id': c.id,
            'title': c.title,
            'description': c.description,
            'units': []
        }

        for u in c.units:
            u_dict = {
                'id': u.id,
                'name': u.name,
                'difficulty': u.difficulty,
                'topics': []
            }
            for t in u.topics:
                t_dict = {
                    'id': t.id,
                    'title': t.title,
                    'content_summary': t.content_summary,
                    'quizzes': []
                }
                for q in t.quizzes:
                    q_dict = {
                        'id': q.id,
                        'title': q.title,
                        'questions': []
                    }
                    for ques in q.questions:
                        ques_dict = {
                            'id': ques.id,
                            'text': ques.question_text,
                            'options': [{'id': o.id, 'text': o.option_text} for o in ques.options]
                        }
                        q_dict['questions'].append(ques_dict)
                    t_dict['quizzes'].append(q_dict)
                u_dict['topics'].append(t_dict)
            c_dict['units'].append(u_dict)
            
        return jsonify(c_dict)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
