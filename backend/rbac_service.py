from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config import get_erd_db_connection
from decimal import Decimal

api_rbac = Blueprint("api_rbac", __name__)

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
#  ROLES
# ============================
@api_rbac.route("/roles", methods=["GET"])
def get_roles():
    conn = get_erd_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT role_id, role_name, description FROM role ORDER BY role_id")
    result = rows_to_list(cursor, cursor.fetchall())
    conn.close()
    return jsonify(result)

@api_rbac.route("/roles", methods=["POST"])
def create_role():
    data = request.get_json()
    role_name = data.get("role_name")
    description = data.get("description", "")
    if not role_name:
        return jsonify({"error": "role_name is required"}), 400
    conn = get_erd_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO role (role_name, description)
        OUTPUT INSERTED.role_id
        VALUES (?, ?)
    """, role_name, description)
    new_id = cursor.fetchone()[0]
    conn.commit()
    cursor.execute("SELECT role_id, role_name, description FROM role WHERE role_id = ?", new_id)
    result = row_to_dict(cursor, cursor.fetchone())
    conn.close()
    return jsonify(result), 201

@api_rbac.route("/roles/<int:role_id>", methods=["PUT"])
def update_role(role_id):
    data = request.get_json()
    role_name = data.get("role_name")
    description = data.get("description")
    conn = get_erd_db_connection()
    cursor = conn.cursor()
    if role_name and description is not None:
        cursor.execute("UPDATE role SET role_name = ?, description = ? WHERE role_id = ?", role_name, description, role_id)
    elif role_name:
        cursor.execute("UPDATE role SET role_name = ? WHERE role_id = ?", role_name, role_id)
    elif description is not None:
        cursor.execute("UPDATE role SET description = ? WHERE role_id = ?", description, role_id)
    conn.commit()
    cursor.execute("SELECT role_id, role_name, description FROM role WHERE role_id = ?", role_id)
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Role not found"}), 404
    result = row_to_dict(cursor, row)
    conn.close()
    return jsonify(result)

@api_rbac.route("/roles/<int:role_id>", methods=["DELETE"])
def delete_role(role_id):
    conn = get_erd_db_connection()
    cursor = conn.cursor()
    # Check if role is assigned to users or has permissions
    cursor.execute("SELECT COUNT(*) FROM user_role WHERE role_id = ?", role_id)
    if cursor.fetchone()[0] > 0:
        conn.close()
        return jsonify({"error": "Cannot delete role: still assigned to users"}), 400
    cursor.execute("SELECT COUNT(*) FROM role_permission WHERE role_id = ?", role_id)
    if cursor.fetchone()[0] > 0:
        conn.close()
        return jsonify({"error": "Cannot delete role: still has permissions"}), 400
    cursor.execute("DELETE FROM role WHERE role_id = ?", role_id)
    conn.commit()
    conn.close()
    return jsonify({"message": "Role deleted successfully"}), 200

# ============================
#  PERMISSIONS
# ============================
@api_rbac.route("/permissions", methods=["GET"])
def get_permissions():
    conn = get_erd_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT permission_id, permission_name FROM permission ORDER BY permission_id")
    result = rows_to_list(cursor, cursor.fetchall())
    conn.close()
    return jsonify(result)

@api_rbac.route("/permissions", methods=["POST"])
def create_permission():
    data = request.get_json()
    permission_name = data.get("permission_name")
    if not permission_name:
        return jsonify({"error": "permission_name is required"}), 400
    conn = get_erd_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO permission (permission_name)
        OUTPUT INSERTED.permission_id
        VALUES (?)
    """, permission_name)
    new_id = cursor.fetchone()[0]
    conn.commit()
    cursor.execute("SELECT permission_id, permission_name FROM permission WHERE permission_id = ?", new_id)
    result = row_to_dict(cursor, cursor.fetchone())
    conn.close()
    return jsonify(result), 201

@api_rbac.route("/permissions/<int:permission_id>", methods=["PUT"])
def update_permission(permission_id):
    data = request.get_json()
    permission_name = data.get("permission_name")
    if not permission_name:
        return jsonify({"error": "permission_name is required"}), 400
    conn = get_erd_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE permission SET permission_name = ? WHERE permission_id = ?", permission_name, permission_id)
    conn.commit()
    cursor.execute("SELECT permission_id, permission_name FROM permission WHERE permission_id = ?", permission_id)
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Permission not found"}), 404
    result = row_to_dict(cursor, row)
    conn.close()
    return jsonify(result)

@api_rbac.route("/permissions/<int:permission_id>", methods=["DELETE"])
def delete_permission(permission_id):
    conn = get_erd_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM role_permission WHERE permission_id = ?", permission_id)
    if cursor.fetchone()[0] > 0:
        conn.close()
        return jsonify({"error": "Cannot delete permission: still assigned to roles"}), 400
    cursor.execute("DELETE FROM permission WHERE permission_id = ?", permission_id)
    conn.commit()
    conn.close()
    return jsonify({"message": "Permission deleted successfully"}), 200

# ============================
#  USER ROLES ASSIGNMENT
# ============================
@api_rbac.route("/user-roles", methods=["GET"])
def get_user_roles():
    conn = get_erd_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT ur.user_id, ur.role_id, u.username, r.role_name
        FROM user_role ur
        LEFT JOIN [user] u ON ur.user_id = u.user_id
        LEFT JOIN role r ON ur.role_id = r.role_id
        ORDER BY ur.user_id
    """)
    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()
    result = []
    for row in rows:
        d = {}
        for col, val in zip(columns, row):
            d[col] = val
        result.append(d)
    conn.close()
    return jsonify(result)

@api_rbac.route("/user-roles", methods=["POST"])
def assign_user_role():
    data = request.get_json()
    user_id = data.get("user_id")
    role_id = data.get("role_id")
    if not user_id or not role_id:
        return jsonify({"error": "user_id and role_id are required"}), 400
    conn = get_erd_db_connection()
    cursor = conn.cursor()
    # Check if assignment already exists
    cursor.execute("SELECT COUNT(*) FROM user_role WHERE user_id = ? AND role_id = ?", user_id, role_id)
    if cursor.fetchone()[0] > 0:
        conn.close()
        return jsonify({"error": "User already has this role"}), 400
    cursor.execute("INSERT INTO user_role (user_id, role_id) VALUES (?, ?)", user_id, role_id)
    conn.commit()
    conn.close()
    return jsonify({"message": "Role assigned to user successfully"}), 201

@api_rbac.route("/user-roles", methods=["DELETE"])
def remove_user_role():
    data = request.get_json()
    user_id = data.get("user_id")
    role_id = data.get("role_id")
    if not user_id or not role_id:
        return jsonify({"error": "user_id and role_id are required"}), 400
    conn = get_erd_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM user_role WHERE user_id = ? AND role_id = ?", user_id, role_id)
    conn.commit()
    conn.close()
    return jsonify({"message": "Role removed from user successfully"}), 200

# ============================
#  ROLE PERMISSIONS ASSIGNMENT
# ============================
@api_rbac.route("/role-permissions", methods=["GET"])
def get_role_permissions():
    conn = get_erd_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT rp.role_id, rp.permission_id, rp.function_id, r.role_name, p.permission_name
        FROM role_permission rp
        LEFT JOIN role r ON rp.role_id = r.role_id
        LEFT JOIN permission p ON rp.permission_id = p.permission_id
        ORDER BY rp.role_id, rp.permission_id
    """)
    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()
    result = []
    for row in rows:
        d = {}
        for col, val in zip(columns, row):
            d[col] = val
        result.append(d)
    conn.close()
    return jsonify(result)

@api_rbac.route("/role-permissions", methods=["POST"])
def assign_permission_to_role():
    data = request.get_json()
    role_id = data.get("role_id")
    permission_id = data.get("permission_id")
    function_id = data.get("function_id", 0)  # default maybe 0
    if not role_id or not permission_id:
        return jsonify({"error": "role_id and permission_id are required"}), 400
    conn = get_erd_db_connection()
    cursor = conn.cursor()
    # Check if assignment already exists
    cursor.execute("SELECT COUNT(*) FROM role_permission WHERE role_id = ? AND permission_id = ?", role_id, permission_id)
    if cursor.fetchone()[0] > 0:
        conn.close()
        return jsonify({"error": "Role already has this permission"}), 400
    cursor.execute("INSERT INTO role_permission (role_id, permission_id, function_id) VALUES (?, ?, ?)", role_id, permission_id, function_id)
    conn.commit()
    conn.close()
    return jsonify({"message": "Permission assigned to role successfully"}), 201

@api_rbac.route("/role-permissions", methods=["DELETE"])
def remove_permission_from_role():
    data = request.get_json()
    role_id = data.get("role_id")
    permission_id = data.get("permission_id")
    if not role_id or not permission_id:
        return jsonify({"error": "role_id and permission_id are required"}), 400
    conn = get_erd_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM role_permission WHERE role_id = ? AND permission_id = ?", role_id, permission_id)
    conn.commit()
    conn.close()
    return jsonify({"message": "Permission removed from role successfully"}), 200

# ============================
#  GET USER WITH ROLES AND PERMISSIONS (for admin dashboard)
# ============================
@api_rbac.route("/users-with-roles", methods=["GET"])
def get_users_with_roles():
    conn = get_erd_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.user_id, u.username, u.full_name, u.is_active
        FROM [user] u
        ORDER BY u.user_id
    """)
    users = rows_to_list(cursor, cursor.fetchall())
    # For each user, get roles
    for user in users:
        cursor.execute("""
            SELECT r.role_id, r.role_name
            FROM user_role ur
            JOIN role r ON ur.role_id = r.role_id
            WHERE ur.user_id = ?
        """, user["user_id"])
        roles = rows_to_list(cursor, cursor.fetchall())
        user["roles"] = roles
    conn.close()
    return jsonify(users)

@api_rbac.route("/roles-with-permissions", methods=["GET"])
def get_roles_with_permissions():
    conn = get_erd_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT role_id, role_name, description FROM role ORDER BY role_id")
    roles = rows_to_list(cursor, cursor.fetchall())
    for role in roles:
        cursor.execute("""
            SELECT p.permission_id, p.permission_name
            FROM role_permission rp
            JOIN permission p ON rp.permission_id = p.permission_id
            WHERE rp.role_id = ?
        """, role["role_id"])
        permissions = rows_to_list(cursor, cursor.fetchall())
        role["permissions"] = permissions
    conn.close()
    return jsonify(roles)