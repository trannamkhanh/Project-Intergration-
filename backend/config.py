import os
from dotenv import load_dotenv

load_dotenv()

# ── SQL Server (HUMAN) ──
SQLSERVER_DRIVER = os.getenv("SQLSERVER_DRIVER", "ODBC Driver 17 for SQL Server")
SQLSERVER_SERVER = os.getenv("SQLSERVER_SERVER", "localhost")
SQLSERVER_DATABASE = os.getenv("SQLSERVER_DATABASE", "HUMAN")

# ── MySQL (PAYROLL) ──
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "PAYROLL")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")

# ── JWT ──
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-key-change-in-production")


def get_sqlserver_connection():
    """Tra ve connection toi SQL Server (HUMAN)."""
    import pyodbc
    return pyodbc.connect(
        f"DRIVER={{{SQLSERVER_DRIVER}}};"
        f"SERVER={SQLSERVER_SERVER};"
        f"DATABASE={SQLSERVER_DATABASE};"
        f"Trusted_Connection=yes;"
    )


def get_mysql_connection():
    """Tra ve connection toi MySQL (PAYROLL)."""
    import pymysql
    return pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE,
        cursorclass=pymysql.cursors.DictCursor,
    )
