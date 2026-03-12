from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import JWT_SECRET_KEY


def create_app():
    app = Flask(__name__)

    app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600  # 1 hour

    CORS(app, origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"])
    JWTManager(app)

    # Import va dang ky routes tu service.py
    from service import api
    app.register_blueprint(api, url_prefix="/api")

    @app.route("/api/health")
    def health():
        return {"status": "ok", "databases": {"hr": "SQL Server (HUMAN)", "payroll": "MySQL (PAYROLL)"}}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
