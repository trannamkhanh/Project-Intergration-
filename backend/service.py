from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from config import get_sqlserver_connection, get_mysql_connection
from decimal import Decimal

api = Blueprint("api", __name__)


# Helper: convert pyodbc Row to dict
def row_to_dict(cursor, row):
    columns = [col[0] for col in cursor.description]
    d = {}
    for col, val in zip(columns, row):
        if isinstance(val, Decimal):
            val = float(val)
        elif hasattr(val, 'isoformat'):
            val = val.isoformat()
        d[col] = val
    return d


def rows_to_list(cursor, rows):
    return [row_to_dict(cursor, r) for r in rows]


# ============================
#  EMPLOYEES  (SQL Server)
# ============================
@api.route("/employees", methods=["GET"])
def get_employees():
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT e.*, d.DepartmentName, p.PositionName
        FROM Employees e
        LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
        LEFT JOIN Positions p ON e.PositionID = p.PositionID
        ORDER BY e.EmployeeID
    """)
    result = rows_to_list(cursor, cursor.fetchall())
    conn.close()
    return jsonify(result)


# ============================
#  DEPARTMENTS  (SQL Server)
# ============================
@api.route("/departments", methods=["GET"])
def get_departments():
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT d.*,
            (SELECT COUNT(*) FROM Employees e WHERE e.DepartmentID = d.DepartmentID) AS EmployeeCount
        FROM Departments d
        ORDER BY d.DepartmentID
    """)
    result = rows_to_list(cursor, cursor.fetchall())
    conn.close()
    return jsonify(result)


# ============================
#  POSITIONS  (SQL Server)
# ============================
@api.route("/positions", methods=["GET"])
def get_positions():
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Positions ORDER BY PositionID")
    result = rows_to_list(cursor, cursor.fetchall())
    conn.close()
    return jsonify(result)


# ============================
#  DIVIDENDS  (SQL Server)
# ============================
@api.route("/dividends", methods=["GET"])
def get_dividends():
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT d.*, e.FullName AS EmployeeName
        FROM Dividends d
        LEFT JOIN Employees e ON d.EmployeeID = e.EmployeeID
        ORDER BY d.DividendID
    """)
    result = rows_to_list(cursor, cursor.fetchall())
    conn.close()
    return jsonify(result)


# ============================
#  PAYROLL / SALARIES  (MySQL)
# ============================
@api.route("/payroll", methods=["GET"])
def get_salaries():
    conn = get_mysql_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT s.*, ep.FullName AS EmployeeName
        FROM salaries s
        LEFT JOIN employees_payroll ep ON s.EmployeeID = ep.EmployeeID
        ORDER BY s.SalaryID
    """)
    result = cursor.fetchall()
    conn.close()
    # Convert Decimal to float for JSON
    for row in result:
        for key in row:
            if isinstance(row[key], Decimal):
                row[key] = float(row[key])
            elif hasattr(row[key], 'isoformat'):
                # SalaryMonth: chi lay YYYY-MM de frontend loc theo thang
                if key == 'SalaryMonth':
                    row[key] = row[key].strftime('%Y-%m')
                else:
                    row[key] = row[key].isoformat()
    return jsonify(result)


# ============================
#  ATTENDANCE  (MySQL)
# ============================
@api.route("/attendance", methods=["GET"])
def get_attendance():
    conn = get_mysql_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.AttendanceID, a.EmployeeID, a.WorkDays, a.AbsentDays, a.LeaveDays,
               a.AttendanceMonth AS Month, ep.FullName AS EmployeeName
        FROM attendance a
        LEFT JOIN employees_payroll ep ON a.EmployeeID = ep.EmployeeID
        ORDER BY a.AttendanceID
    """)
    result = cursor.fetchall()
    conn.close()
    for row in result:
        for key in row:
            if hasattr(row[key], 'isoformat'):
                # Month (AttendanceMonth): chi lay YYYY-MM
                if key == 'Month':
                    row[key] = row[key].strftime('%Y-%m')
                else:
                    row[key] = row[key].isoformat()
    return jsonify(result)
