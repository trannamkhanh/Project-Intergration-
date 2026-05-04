import pyodbc
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv('backend/.env')

server = os.getenv('SQLSERVER_SERVER', 'localhost')
driver = os.getenv('SQLSERVER_DRIVER', 'ODBC Driver 17 for SQL Server')
database = 'ERD DB'

def get_connection():
    return pyodbc.connect(
        f"DRIVER={{{driver}}};"
        f"SERVER={server};"
        f"DATABASE={database};"
        f"Trusted_Connection=yes;"
    )

conn = get_connection()
cursor = conn.cursor()

# 1. Insert roles (4 roles as requested)
print("Inserting roles...")
roles = [
    ('Admin', 'Administrator with full access'),
    ('HR Manager', 'Manages HR functions'),
    ('Payroll Manager', 'Manages payroll functions'),
    ('Employee', 'Regular employee with limited access'),
]
role_ids = {}
for role_name, desc in roles:
    cursor.execute("SELECT role_id FROM role WHERE role_name = ?", role_name)
    row = cursor.fetchone()
    if not row:
        cursor.execute("INSERT INTO role (role_name, description) VALUES (?, ?)", role_name, desc)
        cursor.execute("SELECT role_id FROM role WHERE role_name = ?", role_name)
        row = cursor.fetchone()
        role_id = row[0]
        print(f"  Inserted role: {role_name} (ID: {role_id})")
    else:
        role_id = row[0]
        print(f"  Role already exists: {role_name} (ID: {role_id})")
    role_ids[role_name] = role_id
conn.commit()

# 2. Insert permissions
print("\nInserting permissions...")
permissions = [
    ('view_dashboard',),
    ('manage_users',),
    ('manage_roles',),
    ('manage_employees',),
    ('manage_payroll',),
    ('view_reports',),
]
perm_ids = {}
for perm_name in permissions:
    cursor.execute("SELECT permission_id FROM permission WHERE permission_name = ?", perm_name)
    row = cursor.fetchone()
    if not row:
        cursor.execute("INSERT INTO permission (permission_name) VALUES (?)", perm_name)
        cursor.execute("SELECT permission_id FROM permission WHERE permission_name = ?", perm_name)
        row = cursor.fetchone()
        perm_id = row[0]
        print(f"  Inserted permission: {perm_name} (ID: {perm_id})")
    else:
        perm_id = row[0]
        print(f"  Permission already exists: {perm_name} (ID: {perm_id})")
    perm_ids[perm_name] = perm_id
conn.commit()

# 3. Insert users (one per role)
print("\nInserting users...")
users = [
    ('admin', 'admin123', 'System Administrator', 1, 'Admin'),
    ('hr_manager', 'hr123', 'HR Manager User', 1, 'HR Manager'),
    ('payroll_manager', 'payroll123', 'Payroll Manager User', 1, 'Payroll Manager'),
    ('employee1', 'emp123', 'Employee User', 1, 'Employee'),
]
user_ids = {}
for username, password, full_name, is_active, role_name in users:
    cursor.execute("SELECT user_id FROM [user] WHERE username = ?", username)
    row = cursor.fetchone()
    if not row:
        password_hash = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO [user] (username, password, full_name, is_active) VALUES (?, ?, ?, ?)",
            username, password_hash, full_name, is_active
        )
        cursor.execute("SELECT user_id FROM [user] WHERE username = ?", username)
        row = cursor.fetchone()
        user_id = row[0]
        print(f"  Inserted user: {username} (ID: {user_id})")
        # Assign role
        role_id = role_ids.get(role_name)
        if role_id:
            cursor.execute("SELECT COUNT(*) FROM user_role WHERE user_id = ? AND role_id = ?", user_id, role_id)
            if cursor.fetchone()[0] == 0:
                cursor.execute("INSERT INTO user_role (user_id, role_id) VALUES (?, ?)", user_id, role_id)
                print(f"    Assigned role {role_name} to user {username}")
        user_ids[username] = user_id
    else:
        user_id = row[0]
        print(f"  User already exists: {username} (ID: {user_id})")
        user_ids[username] = user_id
conn.commit()

# 4. Assign permissions to roles
print("\nAssigning permissions to roles...")

# Admin gets all permissions
admin_role_id = role_ids.get('Admin')
if admin_role_id:
    for perm_name, perm_id in perm_ids.items():
        cursor.execute("SELECT COUNT(*) FROM role_permission WHERE role_id = ? AND permission_id = ?", admin_role_id, perm_id)
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO role_permission (role_id, permission_id, function_id) VALUES (?, ?, 0)", admin_role_id, perm_id)
            print(f"  Assigned {perm_name} to Admin")

# HR Manager gets view_dashboard, manage_employees, manage_users
hr_role_id = role_ids.get('HR Manager')
if hr_role_id:
    hr_perm_names = ['view_dashboard', 'manage_employees', 'manage_users']
    for perm_name in hr_perm_names:
        perm_id = perm_ids.get(perm_name)
        if perm_id:
            cursor.execute("SELECT COUNT(*) FROM role_permission WHERE role_id = ? AND permission_id = ?", hr_role_id, perm_id)
            if cursor.fetchone()[0] == 0:
                cursor.execute("INSERT INTO role_permission (role_id, permission_id, function_id) VALUES (?, ?, 0)", hr_role_id, perm_id)
                print(f"  Assigned {perm_name} to HR Manager")

# Payroll Manager gets view_dashboard, manage_payroll
pr_role_id = role_ids.get('Payroll Manager')
if pr_role_id:
    pr_perm_names = ['view_dashboard', 'manage_payroll']
    for perm_name in pr_perm_names:
        perm_id = perm_ids.get(perm_name)
        if perm_id:
            cursor.execute("SELECT COUNT(*) FROM role_permission WHERE role_id = ? AND permission_id = ?", pr_role_id, perm_id)
            if cursor.fetchone()[0] == 0:
                cursor.execute("INSERT INTO role_permission (role_id, permission_id, function_id) VALUES (?, ?, 0)", pr_role_id, perm_id)
                print(f"  Assigned {perm_name} to Payroll Manager")

# Employee gets view_dashboard
emp_role_id = role_ids.get('Employee')
if emp_role_id:
    perm_id = perm_ids.get('view_dashboard')
    if perm_id:
        cursor.execute("SELECT COUNT(*) FROM role_permission WHERE role_id = ? AND permission_id = ?", emp_role_id, perm_id)
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO role_permission (role_id, permission_id, function_id) VALUES (?, ?, 0)", emp_role_id, perm_id)
            print(f"  Assigned view_dashboard to Employee")

conn.commit()

print("\nSeeding completed.")
conn.close()