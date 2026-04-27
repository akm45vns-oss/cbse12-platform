import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from config import Config

def create_app(config_class=Config):
    app = Flask(__name__, static_folder="../frontend", static_url_path="/")
    app.config.from_object(config_class)

    # Enable CORS
    CORS(app)

    # Initialize extensions (Database)
    from models import db
    db.init_app(app)

    # Import all models (this registers them with SQLAlchemy)
    with app.app_context():
        import models.user
        import models.course
        import models.quiz
        import models.gamification
        import models.performance
        db.create_all()

    # Register Blueprints
    from routes.auth_routes import bp as auth_bp
    from routes.course_routes import bp as course_bp
    from routes.quiz_routes import bp as quiz_bp
    from routes.analytics_routes import bp as analytics_bp
    from routes.leaderboard_routes import bp as leaderboard_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(course_bp, url_prefix='/api/courses')
    app.register_blueprint(quiz_bp, url_prefix='/api/quizzes')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(leaderboard_bp, url_prefix='/api/leaderboard')

    # Catch-all route to serve the frontend Single Page Application / Static HTML
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def catch_all(path):
        # Allow accessing static assets directly
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        # Default to index.html
        return send_from_directory(app.static_folder, "index.html")
        
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({"error": "Resource not found"}), 404

    return app

if __name__ == '__main__':
    import os
    app = create_app()
    app.run(debug=True, port=5000)
