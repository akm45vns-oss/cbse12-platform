from flask import Blueprint, jsonify

bp = Blueprint('leaderboard', __name__)

@bp.route('/<period>', methods=['GET'])
def get_leaderboard(period):
    return jsonify({"message": f"Leaderboard endpoint for {period}"})
