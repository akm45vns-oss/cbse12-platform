from flask import Blueprint, jsonify, request
from models.quiz import Quiz, Question, Option

bp = Blueprint('quizzes', __name__)

@bp.route('/<int:quiz_id>/submit', methods=['POST'])
def submit_quiz(quiz_id):
    try:
        data = request.get_json()
        student_answers = data.get('answers', {}) # format: {"question_id_str": "option_id_str"}
        
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({"error": "Quiz not found"}), 404
            
        score = 0
        total = len(quiz.questions)
        results = {}
        
        for q in quiz.questions:
            selected_opt_id = student_answers.get(str(q.id))
            correct_opt = next((o for o in q.options if o.is_correct), None)
            correct_opt_id = correct_opt.id if correct_opt else None
            
            is_correct = False
            if selected_opt_id and str(selected_opt_id) == str(correct_opt_id):
                is_correct = True
                score += 1
                
            results[str(q.id)] = {
                "correct": is_correct,
                "selected_option_id": selected_opt_id,
                "correct_option_id": correct_opt_id,
                "explanation": q.explanation
            }
            
        return jsonify({
            "score": score,
            "total": total,
            "results": results
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
