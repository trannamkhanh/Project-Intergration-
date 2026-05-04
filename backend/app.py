from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import JWT_SECRET_KEY


def create_app():
    app = Flask(__name__)

    app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600  # 1 hour

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)

    # Import va dang ky routes tu service.py
    from service import api
    app.register_blueprint(api, url_prefix="/api")

    # Import va dang ky routes RBAC tu rbac_service.py
    from rbac_service import api_rbac
    app.register_blueprint(api_rbac, url_prefix="/api/rbac")

    @app.route("/")
    def index():
        return jsonify({
            "name": "HR-Payroll API",
            "status": "running",
            "endpoints": {
                "health": "/api/health",
                "auth": "/api/auth/login",
                "employees": "/api/employees",
                "departments": "/api/departments",
                "positions": "/api/positions",
                "payroll": "/api/payroll",
                "attendance": "/api/attendance",
                "dividends": "/api/dividends",
                "dashboard": "/api/reports/dashboard",
                "rbac": "/api/rbac/*",
            }
        })

    @app.route("/api/health")
    def health():
        return {"status": "ok", "databases": {"hr": "SQL Server (HUMAN)", "payroll": "MySQL (PAYROLL)"}}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
