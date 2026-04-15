from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from config import get_sqlserver_connection, get_mysql_connection
from decimal import Decimal
from datetime import datetime, date
from werkzeug.security import check_password_hash, generate_password_hash

api = Blueprint("api", __name__)

# Runtime read-state for alerts (ephemeral, reset on server restart).
ALERT_READ_IDS = set()


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


def convert_mysql_row(row):
    """Convert Decimal and date values in a MySQL dict row."""
    for key in row:
        if isinstance(row[key], Decimal):
            row[key] = float(row[key])
        elif hasattr(row[key], 'isoformat'):
            if key in ('SalaryMonth', 'Month'):
                row[key] = row[key].strftime('%Y-%m')
            else:
                row[key] = row[key].isoformat()
    return row


# ============================
#  AUTH (SQL Server - Users)
# ============================
@api.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "")
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Vui long nhap ten dang nhap va mat khau"}), 400

    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Users WHERE Username = ?", username)
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Ten dang nhap hoac mat khau khong dung"}), 401

    user = row_to_dict(cursor, row)

    if not check_password_hash(user["PasswordHash"], password):
        return jsonify({"error": "Ten dang nhap hoac mat khau khong dung"}), 401

    token = create_access_token(identity=str(user["UserID"]))
    return jsonify({
        "token": token,
        "user": {
            "id": user["UserID"],
            "fullName": user["FullName"],
            "email": user["Email"],
            "role": user["Role"],
        }
    })


@api.route("/auth/profile", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT UserID, Username, FullName, Email, Role FROM Users WHERE UserID = ?",
        user_id,
    )
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Khong tim thay nguoi dung"}), 404

    user = row_to_dict(cursor, row)
    return jsonify({
        "id": user["UserID"],
        "username": user.get("Username"),
        "fullName": user.get("FullName"),
        "email": user.get("Email"),
        "role": user.get("Role"),
    })


@api.route("/auth/change-password", methods=["POST"])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    current_password = data.get("currentPassword", "")
    new_password = data.get("newPassword", "")

    if not current_password or not new_password:
        return jsonify({"error": "Vui long nhap day du mat khau"}), 400

    if len(new_password) < 6:
        return jsonify({"error": "Mat khau moi phai co it nhat 6 ky tu"}), 400

    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT PasswordHash FROM Users WHERE UserID = ?", user_id)
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({"error": "Khong tim thay nguoi dung"}), 404

    password_hash = row[0]
    if not check_password_hash(password_hash, current_password):
        conn.close()
        return jsonify({"error": "Mat khau hien tai khong dung"}), 400

    new_hash = generate_password_hash(new_password)
    cursor.execute(
        "UPDATE Users SET PasswordHash = ? WHERE UserID = ?",
        new_hash,
        user_id,
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Doi mat khau thanh cong"})


@api.route("/auth/logout", methods=["POST"])
@jwt_required()
def logout():
    return jsonify({"message": "Dang xuat thanh cong"})


def _to_date(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value[:10]).date()
        except ValueError:
            return None
    return None


def _build_alerts():
    alerts = []
    alert_id = 1
    today = date.today()

    # Birthdays + work anniversaries from SQL Server Employees
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT EmployeeID, FullName, DateOfBirth, HireDate FROM Employees")
    employees = rows_to_list(cursor, cursor.fetchall())
    conn.close()

    for emp in employees:
        dob = _to_date(emp.get("DateOfBirth"))
        if dob:
            birthday = date(today.year, dob.month, dob.day)
            diff = (birthday - today).days
            if -7 <= diff <= 30:
                alerts.append({
                    "id": alert_id,
                    "employeeId": emp.get("EmployeeID"),
                    "type": "birthday",
                    "title": "Sinh nhat",
                    "message": f"{emp.get('FullName', '')} {'vua' if diff < 0 else 'se'} den sinh nhat trong {abs(diff)} ngay",
                    "severity": "info",
                    "read": alert_id in ALERT_READ_IDS,
                    "date": birthday.isoformat(),
                })
                alert_id += 1

        hire = _to_date(emp.get("HireDate"))
        if hire:
            years = today.year - hire.year
            if years > 0 and years % 5 == 0:
                anniversary = date(today.year, hire.month, hire.day)
                diff = (anniversary - today).days
                if -30 <= diff <= 60:
                    alerts.append({
                        "id": alert_id,
                        "employeeId": emp.get("EmployeeID"),
                        "type": "work_anniversary",
                        "title": "Work anniversary",
                        "message": f"{emp.get('FullName', '')} se ky niem {years} nam lam viec",
                        "severity": "info",
                        "read": alert_id in ALERT_READ_IDS,
                        "date": anniversary.isoformat(),
                    })
                    alert_id += 1

    # Leave exceeded from MySQL attendance
    mysql_conn = get_mysql_connection()
    mysql_cur = mysql_conn.cursor()
    mysql_cur.execute(
        """
        SELECT a.EmployeeID, a.WorkDays, a.LeaveDays, a.AbsentDays,
               a.AttendanceMonth AS Month, ep.FullName AS EmployeeName
        FROM attendance a
        LEFT JOIN employees_payroll ep ON a.EmployeeID = ep.EmployeeID
        """
    )
    attendance_rows = mysql_cur.fetchall()

    for row in attendance_rows:
        leave_days = row.get("LeaveDays") or 0
        absent_days = row.get("AbsentDays") or 0
        if leave_days > 3 or absent_days > 1:
            month_val = row.get("Month")
            month_text = month_val.strftime("%Y-%m") if hasattr(month_val, "strftime") else str(month_val or "")
            alerts.append({
                "id": alert_id,
                "employeeId": row.get("EmployeeID"),
                "type": "leave",
                "title": "Nghi qua so ngay" if absent_days <= 1 else "Vang mat nhieu",
                "message": f"{row.get('EmployeeName', '')} co {leave_days} ngay nghi phep va {absent_days} ngay vang mat trong thang {month_text}",
                "severity": "critical" if absent_days > 2 else "warning",
                "read": alert_id in ALERT_READ_IDS,
                "date": today.isoformat(),
            })
            alert_id += 1

    # Salary anomalies from MySQL salaries
    mysql_cur.execute(
        """
        SELECT s.EmployeeID, s.SalaryMonth, s.NetSalary, ep.FullName AS EmployeeName
        FROM salaries s
        LEFT JOIN employees_payroll ep ON s.EmployeeID = ep.EmployeeID
        ORDER BY s.EmployeeID, s.SalaryMonth
        """
    )
    salary_rows = mysql_cur.fetchall()
    mysql_conn.close()

    by_employee = {}
    for row in salary_rows:
        by_employee.setdefault(row.get("EmployeeID"), []).append(row)

    for _, rows in by_employee.items():
        if len(rows) < 2:
            continue
        prev = rows[-2]
        curr = rows[-1]
        prev_net = float(prev.get("NetSalary") or 0)
        curr_net = float(curr.get("NetSalary") or 0)
        if prev_net <= 0:
            continue
        diff_pct = ((curr_net - prev_net) / prev_net) * 100
        if abs(diff_pct) > 10:
            prev_month = prev.get("SalaryMonth")
            curr_month = curr.get("SalaryMonth")
            prev_text = prev_month.strftime("%Y-%m") if hasattr(prev_month, "strftime") else str(prev_month or "")
            curr_text = curr_month.strftime("%Y-%m") if hasattr(curr_month, "strftime") else str(curr_month or "")
            alerts.append({
                "id": alert_id,
                "employeeId": curr.get("EmployeeID"),
                "type": "salary",
                "title": "Bat thuong luong",
                "message": f"{curr.get('EmployeeName', '')}: luong thay doi {diff_pct:+.1f}% tu {prev_text} sang {curr_text}",
                "severity": "critical",
                "read": alert_id in ALERT_READ_IDS,
                "date": today.isoformat(),
            })
            alert_id += 1

    return alerts


@api.route("/alerts", methods=["GET"])
def get_alerts():
    try:
        return jsonify(_build_alerts())
    except Exception as exc:
        return jsonify({"error": f"Khong the tai du lieu canh bao: {exc}"}), 500


@api.route("/alerts/anniversaries", methods=["GET"])
def get_anniversaries():
    alerts = [a for a in _build_alerts() if a.get("type") in ("birthday", "work_anniversary")]
    return jsonify(alerts)


@api.route("/alerts/leave-exceeded", methods=["GET"])
def get_leave_exceeded():
    alerts = [a for a in _build_alerts() if a.get("type") == "leave"]
    return jsonify(alerts)


@api.route("/alerts/salary-discrepancies", methods=["GET"])
def get_salary_discrepancies():
    alerts = [a for a in _build_alerts() if a.get("type") == "salary"]
    return jsonify(alerts)


@api.route("/alerts/<int:alert_id>/read", methods=["PUT"])
def mark_alert_read(alert_id):
    ALERT_READ_IDS.add(alert_id)
    return jsonify({"message": "Da danh dau da doc"})


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


@api.route("/employees/search", methods=["GET"])
def search_employees():
    query = request.args.get("q", "").strip()
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT e.*, d.DepartmentName, p.PositionName
        FROM Employees e
        LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
        LEFT JOIN Positions p ON e.PositionID = p.PositionID
        WHERE e.FullName LIKE ? OR e.Email LIKE ?
        ORDER BY e.EmployeeID
    """, f"%{query}%", f"%{query}%")
    result = rows_to_list(cursor, cursor.fetchall())
    conn.close()
    return jsonify(result)


@api.route("/employees/<int:id>", methods=["GET"])
def get_employee_by_id(id):
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT e.*, d.DepartmentName, p.PositionName
        FROM Employees e
        LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
        LEFT JOIN Positions p ON e.PositionID = p.PositionID
        WHERE e.EmployeeID = ?
    """, id)
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "Nhan vien khong ton tai"}), 404
    return jsonify(row_to_dict(cursor, row))


@api.route("/employees", methods=["POST"])
def create_employee():
    data = request.get_json()
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO Employees (FullName, DateOfBirth, Gender, PhoneNumber, Email, HireDate, DepartmentID, PositionID, Status)
        OUTPUT INSERTED.EmployeeID
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, data.get("FullName"), data.get("DateOfBirth"), data.get("Gender"),
         data.get("PhoneNumber"), data.get("Email"), data.get("HireDate"),
         data.get("DepartmentID"), data.get("PositionID"), data.get("Status", "Đang làm việc"))
    new_id = cursor.fetchone()[0]
    conn.commit()

    # Sync to MySQL employees_payroll
    try:
        mysql_conn = get_mysql_connection()
        mysql_cur = mysql_conn.cursor()
        mysql_cur.execute("""
            INSERT INTO employees_payroll (EmployeeID, FullName, DepartmentID, PositionID, Status)
            VALUES (%s, %s, %s, %s, %s)
        """, (new_id, data.get("FullName"), data.get("DepartmentID"), data.get("PositionID"), data.get("Status", "Đang làm việc")))
        mysql_conn.commit()
        mysql_conn.close()
    except Exception:
        pass

    # Return full employee
    cursor.execute("""
        SELECT e.*, d.DepartmentName, p.PositionName
        FROM Employees e
        LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
        LEFT JOIN Positions p ON e.PositionID = p.PositionID
        WHERE e.EmployeeID = ?
    """, new_id)
    result = row_to_dict(cursor, cursor.fetchone())
    conn.close()
    return jsonify(result), 201


@api.route("/employees/<int:id>", methods=["PUT"])
def update_employee(id):
    data = request.get_json()
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE Employees SET FullName=?, DateOfBirth=?, Gender=?, PhoneNumber=?, Email=?,
        HireDate=?, DepartmentID=?, PositionID=?, Status=?, UpdatedAt=GETDATE()
        WHERE EmployeeID=?
    """, data.get("FullName"), data.get("DateOfBirth"), data.get("Gender"),
         data.get("PhoneNumber"), data.get("Email"), data.get("HireDate"),
         data.get("DepartmentID"), data.get("PositionID"), data.get("Status"), id)
    conn.commit()

    # Sync to MySQL employees_payroll
    try:
        mysql_conn = get_mysql_connection()
        mysql_cur = mysql_conn.cursor()
        mysql_cur.execute("""
            UPDATE employees_payroll SET FullName=%s, DepartmentID=%s, PositionID=%s, Status=%s, SyncedAt=NOW()
            WHERE EmployeeID=%s
        """, (data.get("FullName"), data.get("DepartmentID"), data.get("PositionID"), data.get("Status"), id))
        mysql_conn.commit()
        mysql_conn.close()
    except Exception:
        pass

    cursor.execute("""
        SELECT e.*, d.DepartmentName, p.PositionName
        FROM Employees e
        LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
        LEFT JOIN Positions p ON e.PositionID = p.PositionID
        WHERE e.EmployeeID = ?
    """, id)
    result = row_to_dict(cursor, cursor.fetchone())
    conn.close()
    return jsonify(result)


@api.route("/employees/<int:id>", methods=["DELETE"])
def delete_employee(id):
    conn = get_sqlserver_connection()
    cursor = conn.cursor()

    # Check constraints
    cursor.execute("SELECT COUNT(*) FROM Dividends WHERE EmployeeID = ?", id)
    if cursor.fetchone()[0] > 0:
        conn.close()
        return jsonify({"error": "Khong the xoa: nhan vien con co du lieu co tuc"}), 400

    mysql_conn = get_mysql_connection()
    mysql_cur = mysql_conn.cursor()
    mysql_cur.execute("SELECT COUNT(*) as cnt FROM salaries WHERE EmployeeID = %s", (id,))
    sal_count = mysql_cur.fetchone()["cnt"]
    mysql_cur.execute("SELECT COUNT(*) as cnt FROM attendance WHERE EmployeeID = %s", (id,))
    att_count = mysql_cur.fetchone()["cnt"]

    if sal_count > 0 or att_count > 0:
        mysql_conn.close()
        conn.close()
        return jsonify({"error": "Khong the xoa: nhan vien con co du lieu luong hoac cham cong"}), 400

    # Delete from MySQL first
    mysql_cur.execute("DELETE FROM employees_payroll WHERE EmployeeID = %s", (id,))
    mysql_conn.commit()
    mysql_conn.close()

    # Delete from SQL Server
    cursor.execute("DELETE FROM Employees WHERE EmployeeID = ?", id)
    conn.commit()
    conn.close()
    return jsonify({"message": "Xoa nhan vien thanh cong"}), 200


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


@api.route("/departments/<int:id>", methods=["GET"])
def get_department_by_id(id):
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT d.*,
            (SELECT COUNT(*) FROM Employees e WHERE e.DepartmentID = d.DepartmentID) AS EmployeeCount
        FROM Departments d
        WHERE d.DepartmentID = ?
    """, id)
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "Phong ban khong ton tai"}), 404
    return jsonify(row_to_dict(cursor, row))


@api.route("/departments", methods=["POST"])
def create_department():
    data = request.get_json()
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO Departments (DepartmentName)
        OUTPUT INSERTED.DepartmentID
        VALUES (?)
    """, data.get("DepartmentName"))
    new_id = cursor.fetchone()[0]
    conn.commit()

    # Sync to MySQL
    try:
        mysql_conn = get_mysql_connection()
        mysql_cur = mysql_conn.cursor()
        mysql_cur.execute("INSERT INTO departments_payroll (DepartmentID, DepartmentName) VALUES (%s, %s)",
                          (new_id, data.get("DepartmentName")))
        mysql_conn.commit()
        mysql_conn.close()
    except Exception:
        pass

    cursor.execute("""
        SELECT d.*, (SELECT COUNT(*) FROM Employees e WHERE e.DepartmentID = d.DepartmentID) AS EmployeeCount
        FROM Departments d WHERE d.DepartmentID = ?
    """, new_id)
    result = row_to_dict(cursor, cursor.fetchone())
    conn.close()
    return jsonify(result), 201


@api.route("/departments/<int:id>", methods=["PUT"])
def update_department(id):
    data = request.get_json()
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE Departments SET DepartmentName=?, UpdatedAt=GETDATE() WHERE DepartmentID=?",
                   data.get("DepartmentName"), id)
    conn.commit()

    # Sync to MySQL
    try:
        mysql_conn = get_mysql_connection()
        mysql_cur = mysql_conn.cursor()
        mysql_cur.execute("UPDATE departments_payroll SET DepartmentName=%s, SyncedAt=NOW() WHERE DepartmentID=%s",
                          (data.get("DepartmentName"), id))
        mysql_conn.commit()
        mysql_conn.close()
    except Exception:
        pass

    cursor.execute("""
        SELECT d.*, (SELECT COUNT(*) FROM Employees e WHERE e.DepartmentID = d.DepartmentID) AS EmployeeCount
        FROM Departments d WHERE d.DepartmentID = ?
    """, id)
    result = row_to_dict(cursor, cursor.fetchone())
    conn.close()
    return jsonify(result)


@api.route("/departments/<int:id>", methods=["DELETE"])
def delete_department(id):
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM Employees WHERE DepartmentID = ?", id)
    if cursor.fetchone()[0] > 0:
        conn.close()
        return jsonify({"error": "Khong the xoa: phong ban con co nhan vien"}), 400
    cursor.execute("DELETE FROM Departments WHERE DepartmentID = ?", id)
    conn.commit()

    try:
        mysql_conn = get_mysql_connection()
        mysql_cur = mysql_conn.cursor()
        mysql_cur.execute("DELETE FROM departments_payroll WHERE DepartmentID = %s", (id,))
        mysql_conn.commit()
        mysql_conn.close()
    except Exception:
        pass

    conn.close()
    return jsonify({"message": "Xoa phong ban thanh cong"}), 200


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


@api.route("/positions/<int:id>", methods=["GET"])
def get_position_by_id(id):
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Positions WHERE PositionID = ?", id)
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "Chuc vu khong ton tai"}), 404
    return jsonify(row_to_dict(cursor, row))


@api.route("/positions", methods=["POST"])
def create_position():
    data = request.get_json()
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO Positions (PositionName)
        OUTPUT INSERTED.PositionID
        VALUES (?)
    """, data.get("PositionName"))
    new_id = cursor.fetchone()[0]
    conn.commit()

    try:
        mysql_conn = get_mysql_connection()
        mysql_cur = mysql_conn.cursor()
        mysql_cur.execute("INSERT INTO positions_payroll (PositionID, PositionName) VALUES (%s, %s)",
                          (new_id, data.get("PositionName")))
        mysql_conn.commit()
        mysql_conn.close()
    except Exception:
        pass

    cursor.execute("SELECT * FROM Positions WHERE PositionID = ?", new_id)
    result = row_to_dict(cursor, cursor.fetchone())
    conn.close()
    return jsonify(result), 201


@api.route("/positions/<int:id>", methods=["PUT"])
def update_position(id):
    data = request.get_json()
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE Positions SET PositionName=?, UpdatedAt=GETDATE() WHERE PositionID=?",
                   data.get("PositionName"), id)
    conn.commit()

    try:
        mysql_conn = get_mysql_connection()
        mysql_cur = mysql_conn.cursor()
        mysql_cur.execute("UPDATE positions_payroll SET PositionName=%s, SyncedAt=NOW() WHERE PositionID=%s",
                          (data.get("PositionName"), id))
        mysql_conn.commit()
        mysql_conn.close()
    except Exception:
        pass

    cursor.execute("SELECT * FROM Positions WHERE PositionID = ?", id)
    result = row_to_dict(cursor, cursor.fetchone())
    conn.close()
    return jsonify(result)


@api.route("/positions/<int:id>", methods=["DELETE"])
def delete_position(id):
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM Employees WHERE PositionID = ?", id)
    if cursor.fetchone()[0] > 0:
        conn.close()
        return jsonify({"error": "Khong the xoa: chuc vu con co nhan vien"}), 400
    cursor.execute("DELETE FROM Positions WHERE PositionID = ?", id)
    conn.commit()

    try:
        mysql_conn = get_mysql_connection()
        mysql_cur = mysql_conn.cursor()
        mysql_cur.execute("DELETE FROM positions_payroll WHERE PositionID = %s", (id,))
        mysql_conn.commit()
        mysql_conn.close()
    except Exception:
        pass

    conn.close()
    return jsonify({"message": "Xoa chuc vu thanh cong"}), 200


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


@api.route("/dividends/employee/<int:employee_id>", methods=["GET"])
def get_dividends_by_employee(employee_id):
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT d.*, e.FullName AS EmployeeName
        FROM Dividends d
        LEFT JOIN Employees e ON d.EmployeeID = e.EmployeeID
        WHERE d.EmployeeID = ?
        ORDER BY d.DividendDate
    """, employee_id)
    result = rows_to_list(cursor, cursor.fetchall())
    conn.close()
    return jsonify(result)


@api.route("/dividends", methods=["POST"])
def create_dividend():
    data = request.get_json()
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO Dividends (EmployeeID, DividendAmount, DividendDate)
        OUTPUT INSERTED.DividendID
        VALUES (?, ?, ?)
    """, data.get("EmployeeID"), data.get("DividendAmount"), data.get("DividendDate"))
    new_id = cursor.fetchone()[0]
    conn.commit()

    cursor.execute("""
        SELECT d.*, e.FullName AS EmployeeName
        FROM Dividends d
        LEFT JOIN Employees e ON d.EmployeeID = e.EmployeeID
        WHERE d.DividendID = ?
    """, new_id)
    result = row_to_dict(cursor, cursor.fetchone())
    conn.close()
    return jsonify(result), 201


@api.route("/dividends/<int:id>", methods=["PUT"])
def update_dividend(id):
    data = request.get_json()
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE Dividends SET EmployeeID=?, DividendAmount=?, DividendDate=?
        WHERE DividendID=?
    """, data.get("EmployeeID"), data.get("DividendAmount"), data.get("DividendDate"), id)
    conn.commit()

    cursor.execute("""
        SELECT d.*, e.FullName AS EmployeeName
        FROM Dividends d
        LEFT JOIN Employees e ON d.EmployeeID = e.EmployeeID
        WHERE d.DividendID = ?
    """, id)
    result = row_to_dict(cursor, cursor.fetchone())
    conn.close()
    return jsonify(result)


@api.route("/dividends/<int:id>", methods=["DELETE"])
def delete_dividend(id):
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Dividends WHERE DividendID = ?", id)
    conn.commit()
    conn.close()
    return jsonify({"message": "Xoa co tuc thanh cong"}), 200


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
    for row in result:
        convert_mysql_row(row)
    return jsonify(result)


@api.route("/payroll/employee/<int:employee_id>", methods=["GET"])
def get_salaries_by_employee(employee_id):
    conn = get_mysql_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT s.*, ep.FullName AS EmployeeName
        FROM salaries s
        LEFT JOIN employees_payroll ep ON s.EmployeeID = ep.EmployeeID
        WHERE s.EmployeeID = %s
        ORDER BY s.SalaryMonth
    """, (employee_id,))
    result = cursor.fetchall()
    conn.close()
    for row in result:
        convert_mysql_row(row)
    return jsonify(result)


@api.route("/payroll", methods=["POST"])
def create_salary():
    data = request.get_json()
    conn = get_mysql_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO salaries (EmployeeID, SalaryMonth, BaseSalary, Bonus, Deductions, NetSalary)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (data.get("EmployeeID"), data.get("SalaryMonth"), data.get("BaseSalary"),
          data.get("Bonus", 0), data.get("Deductions", 0), data.get("NetSalary")))
    conn.commit()
    new_id = cursor.lastrowid

    cursor.execute("""
        SELECT s.*, ep.FullName AS EmployeeName
        FROM salaries s
        LEFT JOIN employees_payroll ep ON s.EmployeeID = ep.EmployeeID
        WHERE s.SalaryID = %s
    """, (new_id,))
    result = cursor.fetchone()
    conn.close()
    convert_mysql_row(result)
    return jsonify(result), 201


@api.route("/payroll/<int:id>", methods=["PUT"])
def update_salary(id):
    data = request.get_json()
    conn = get_mysql_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE salaries SET EmployeeID=%s, SalaryMonth=%s, BaseSalary=%s, Bonus=%s, Deductions=%s, NetSalary=%s
        WHERE SalaryID=%s
    """, (data.get("EmployeeID"), data.get("SalaryMonth"), data.get("BaseSalary"),
          data.get("Bonus", 0), data.get("Deductions", 0), data.get("NetSalary"), id))
    conn.commit()

    cursor.execute("""
        SELECT s.*, ep.FullName AS EmployeeName
        FROM salaries s
        LEFT JOIN employees_payroll ep ON s.EmployeeID = ep.EmployeeID
        WHERE s.SalaryID = %s
    """, (id,))
    result = cursor.fetchone()
    conn.close()
    convert_mysql_row(result)
    return jsonify(result)


@api.route("/payroll/<int:id>", methods=["DELETE"])
def delete_salary(id):
    conn = get_mysql_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM salaries WHERE SalaryID = %s", (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Xoa ban ghi luong thanh cong"}), 200


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
        convert_mysql_row(row)
    return jsonify(result)


@api.route("/attendance/employee/<int:employee_id>", methods=["GET"])
def get_attendance_by_employee(employee_id):
    conn = get_mysql_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.AttendanceID, a.EmployeeID, a.WorkDays, a.AbsentDays, a.LeaveDays,
               a.AttendanceMonth AS Month, ep.FullName AS EmployeeName
        FROM attendance a
        LEFT JOIN employees_payroll ep ON a.EmployeeID = ep.EmployeeID
        WHERE a.EmployeeID = %s
        ORDER BY a.AttendanceMonth
    """, (employee_id,))
    result = cursor.fetchall()
    conn.close()
    for row in result:
        convert_mysql_row(row)
    return jsonify(result)


@api.route("/attendance", methods=["POST"])
def create_attendance():
    data = request.get_json()
    conn = get_mysql_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO attendance (EmployeeID, WorkDays, AbsentDays, LeaveDays, AttendanceMonth)
        VALUES (%s, %s, %s, %s, %s)
    """, (data.get("EmployeeID"), data.get("WorkDays"), data.get("AbsentDays", 0),
          data.get("LeaveDays", 0), data.get("Month")))
    conn.commit()
    new_id = cursor.lastrowid

    cursor.execute("""
        SELECT a.AttendanceID, a.EmployeeID, a.WorkDays, a.AbsentDays, a.LeaveDays,
               a.AttendanceMonth AS Month, ep.FullName AS EmployeeName
        FROM attendance a
        LEFT JOIN employees_payroll ep ON a.EmployeeID = ep.EmployeeID
        WHERE a.AttendanceID = %s
    """, (new_id,))
    result = cursor.fetchone()
    conn.close()
    convert_mysql_row(result)
    return jsonify(result), 201


@api.route("/attendance/<int:id>", methods=["PUT"])
def update_attendance(id):
    data = request.get_json()
    conn = get_mysql_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE attendance SET EmployeeID=%s, WorkDays=%s, AbsentDays=%s, LeaveDays=%s, AttendanceMonth=%s
        WHERE AttendanceID=%s
    """, (data.get("EmployeeID"), data.get("WorkDays"), data.get("AbsentDays", 0),
          data.get("LeaveDays", 0), data.get("Month"), id))
    conn.commit()

    cursor.execute("""
        SELECT a.AttendanceID, a.EmployeeID, a.WorkDays, a.AbsentDays, a.LeaveDays,
               a.AttendanceMonth AS Month, ep.FullName AS EmployeeName
        FROM attendance a
        LEFT JOIN employees_payroll ep ON a.EmployeeID = ep.EmployeeID
        WHERE a.AttendanceID = %s
    """, (id,))
    result = cursor.fetchone()
    conn.close()
    convert_mysql_row(result)
    return jsonify(result)


@api.route("/attendance/<int:id>", methods=["DELETE"])
def delete_attendance(id):
    conn = get_mysql_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM attendance WHERE AttendanceID = %s", (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Xoa ban ghi cham cong thanh cong"}), 200


# ============================
#  DASHBOARD STATS
# ============================
@api.route("/reports/dashboard", methods=["GET"])
def get_dashboard_stats():
    # Employees stats from SQL Server
    conn = get_sqlserver_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM Employees")
    total_employees = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM Employees WHERE Status = N'Đang làm việc'")
    active_employees = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM Departments")
    total_departments = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM Positions")
    total_positions = cursor.fetchone()[0]

    # Status distribution
    cursor.execute("SELECT Status, COUNT(*) as cnt FROM Employees GROUP BY Status")
    status_dist = [{"name": row[0] or "Khong xac dinh", "value": row[1]} for row in cursor.fetchall()]

    # Gender distribution
    cursor.execute("SELECT Gender, COUNT(*) as cnt FROM Employees GROUP BY Gender")
    gender_counts = {}
    gender_map = {
        "Male": "Nam",
        "Female": "Nữ",
        "M": "Nam",
        "F": "Nữ",
        "male": "Nam",
        "female": "Nữ",
    }
    for row in cursor.fetchall():
        raw_gender = row[0] or "Khong xac dinh"
        gender_label = gender_map.get(raw_gender, raw_gender)
        gender_counts[gender_label] = gender_counts.get(gender_label, 0) + row[1]
    gender_dist = [{"name": name, "value": value} for name, value in gender_counts.items()]

    # Department distribution
    cursor.execute("""
        SELECT d.DepartmentName, COUNT(e.EmployeeID) as cnt
        FROM Departments d
        LEFT JOIN Employees e ON d.DepartmentID = e.DepartmentID
        GROUP BY d.DepartmentName
    """)
    dept_dist = [{"name": row[0], "value": row[1]} for row in cursor.fetchall()]

    conn.close()

    # Payroll stats from MySQL
    mysql_conn = get_mysql_connection()
    mysql_cur = mysql_conn.cursor()

    mysql_cur.execute("SELECT COALESCE(SUM(NetSalary), 0) as total FROM salaries WHERE SalaryMonth = (SELECT MAX(SalaryMonth) FROM salaries)")
    total_payroll = float(mysql_cur.fetchone()["total"])

    # Monthly salary trend
    mysql_cur.execute("""
        SELECT DATE_FORMAT(SalaryMonth, '%Y-%m') as month, SUM(NetSalary) as total
        FROM salaries GROUP BY SalaryMonth ORDER BY SalaryMonth
    """)
    salary_trend = [{"month": row["month"], "total": float(row["total"])} for row in mysql_cur.fetchall()]

    # Attendance summary latest month
    mysql_cur.execute("""
        SELECT COALESCE(SUM(WorkDays),0) as totalWorkDays,
               COALESCE(SUM(AbsentDays),0) as totalAbsentDays,
               COALESCE(SUM(LeaveDays),0) as totalLeaveDays
        FROM attendance
        WHERE AttendanceMonth = (SELECT MAX(AttendanceMonth) FROM attendance)
    """)
    att_summary = mysql_cur.fetchone()
    attendance_summary = {
        "totalWorkDays": int(att_summary["totalWorkDays"]),
        "totalAbsentDays": int(att_summary["totalAbsentDays"]),
        "totalLeaveDays": int(att_summary["totalLeaveDays"]),
    }

    mysql_conn.close()

    return jsonify({
        "totalEmployees": total_employees,
        "activeEmployees": active_employees,
        "totalDepartments": total_departments,
        "totalPositions": total_positions,
        "totalPayroll": total_payroll,
        "statusDistribution": status_dist,
        "genderDistribution": gender_dist,
        "departmentDistribution": dept_dist,
        "monthlySalaryTrend": salary_trend,
        "attendanceSummary": attendance_summary,
    })


@api.route("/reports/hr", methods=["GET"])
def get_hr_report():
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DepartmentName, COUNT(*) AS EmployeeCount FROM Employees e JOIN Departments d ON e.DepartmentID = d.DepartmentID GROUP BY DepartmentName")
    departments = rows_to_list(cursor, cursor.fetchall())
    cursor.execute("SELECT Status, COUNT(*) AS Count FROM Employees GROUP BY Status")
    status = rows_to_list(cursor, cursor.fetchall())
    cursor.execute("SELECT Gender, COUNT(*) AS Count FROM Employees GROUP BY Gender")
    gender = rows_to_list(cursor, cursor.fetchall())
    conn.close()
    return jsonify({
        "departments": departments,
        "status": status,
        "gender": gender,
    })


@api.route("/reports/payroll", methods=["GET"])
def get_payroll_report():
    conn = get_mysql_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DATE_FORMAT(SalaryMonth, '%Y-%m') AS Month, SUM(NetSalary) AS TotalNetSalary FROM salaries GROUP BY SalaryMonth ORDER BY SalaryMonth")
    monthly = [
        {"month": row["Month"], "totalNetSalary": float(row["TotalNetSalary"])}
        for row in cursor.fetchall()
    ]
    cursor.execute("SELECT COALESCE(SUM(NetSalary),0) AS TotalPayroll, AVG(NetSalary) AS AverageSalary FROM salaries")
    summary = cursor.fetchone()
    conn.close()
    return jsonify({
        "monthly": monthly,
        "summary": {
            "totalPayroll": float(summary["TotalPayroll"]),
            "averageSalary": float(summary["AverageSalary"] or 0),
        },
    })


@api.route("/reports/attendance", methods=["GET"])
def get_attendance_report():
    conn = get_mysql_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DATE_FORMAT(AttendanceMonth, '%Y-%m') AS Month, SUM(WorkDays) AS TotalWorkDays, SUM(AbsentDays) AS TotalAbsentDays, SUM(LeaveDays) AS TotalLeaveDays FROM attendance GROUP BY AttendanceMonth ORDER BY AttendanceMonth")
    data = [
        {
            "month": row["Month"],
            "totalWorkDays": int(row["TotalWorkDays"] or 0),
            "totalAbsentDays": int(row["TotalAbsentDays"] or 0),
            "totalLeaveDays": int(row["TotalLeaveDays"] or 0),
        }
        for row in cursor.fetchall()
    ]
    conn.close()
    return jsonify({"monthly": data})


@api.route("/reports/dividends", methods=["GET"])
def get_dividend_report():
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DATEPART(YEAR, DividendDate) AS Year, DATEPART(MONTH, DividendDate) AS Month, SUM(DividendAmount) AS TotalAmount FROM Dividends GROUP BY DATEPART(YEAR, DividendDate), DATEPART(MONTH, DividendDate) ORDER BY Year, Month")
    monthly = [
        {"year": row["Year"], "month": row["Month"], "totalAmount": float(row["TotalAmount"])}
        for row in cursor.fetchall()
    ]
    conn.close()
    return jsonify({"monthly": monthly})
