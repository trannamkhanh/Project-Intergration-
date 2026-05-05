# Security & Authorization Design Document

**Course:** System Integration Practices  
**Project Title:** Integrated HR & Payroll Dashboard System for Company X  
**Case Study:** 4 (Security & Role-Based Authorization Integration)  
**Version:** 1.0  
**Date:** 5/4/2026  

**Group:** Nhóm 4  
**Semester:** 2 – Academic Year 2024–2025  
**Instructor:** MSc. Nguyen Dang Quang Huy  

**Team Members:**

| Name | Student ID |
|------|-----------|
| Huy, Nguyen Bao | 29211154038 |
| Kiet, Nguyen Quang | 29211121546 |
| Nhan, Tran Phuoc | 29211159621 |
| Khanh, Tran Nam | 29211357872 |
| Thanh, Dang Thi Phuong | 29201159386 |

---

## 1. Introduction

### 1.1 Purpose of the Document
This document defines the design and integration of RESTful APIs used in the Integrated HR & Payroll Dashboard System for Company X. It describes how APIs interact with the HUMAN (SQL Server) and PAYROLL (MySQL) databases to provide seamless data synchronization, access control, and reporting functionalities.

This document is intended for:
- **Developers:** To implement API endpoints and manage integration logic.
- **Testers:** To validate data synchronization and security functionality.
- **Project Manager / Instructor:** To review technical design and ensure consistency across case studies.

### 1.2 Scope
The API design covers backend services for:
- Employee, Department, and Position Management (SQL Server - HUMAN)
- Payroll and Attendance Integration (MySQL - PAYROLL)
- Reporting and Alerts
- **Authentication and Role-based Authorization (RBAC) using ERD DB (SQL Server)**

The APIs provide secure, standardized interfaces for communication between frontend (Dashboard UI) and backend data sources.

### 1.3 References
- IEEE Std 1016-2009 – Software Design Description
- IEEE Std 830-1998 – Software Requirements Specification
- Case Study 3 & 4 Documents (System Integration Practices, 2025)
- Flask RESTful Documentation (2024)
- JWT Authentication Standard (RFC 7519)
- **Project Implementation Documentation (2026)**

---

## 2. System Overview

### 2.1 System Context
The backend API serves as a bridge between:
- **Frontend:** React Dashboard (Vite + Material UI)
- **Databases:**
  - **HUMAN** – Employees, Departments, Positions, Dividends (SQL Server)
  - **PAYROLL** – Salaries, Attendance (MySQL)
  - **ERD DB** – User, Role, Permission, User_Role, Role_Permission (SQL Server) for RBAC

**Data flow:**  
Frontend ⇄ API Gateway (Flask) ⇄ Database Layer (HUMAN + PAYROLL + ERD DB)

### 2.2 Architecture Overview
The API follows a three-layer architecture:

1. **Presentation Layer:** Receives HTTP requests and sends JSON responses via REST API endpoints (Flask).
2. **Business Logic Layer:** Handles validation, synchronization, authentication, and authorization.
3. **Data Access Layer:** Connects to SQL Server (HUMAN & ERD DB) and MySQL (PAYROLL) using pyodbc and pymysql.

**Frameworks Used:**
- **Backend:** Python Flask, Flask-JWT-Extended, Flask-SQLAlchemy (optional)
- **Frontend:** React, React Router, Material UI, Axios

---

## 3. API Design Specification

### 3.1 API Naming Convention
All endpoints follow RESTful naming principles:
- `GET` for retrieval
- `POST` for creation
- `PUT` for update
- `DELETE` for deletion

Resource names are plural (e.g., `/employees`, `/roles`).

**Base URL:** `http://127.0.0.1:5000/api`

### 3.2 Authentication & Authorization

#### Authentication: JWT (JSON Web Token)
- **Login Endpoint:** `POST /api/auth/login`
- **Request:** `{ "username": "admin", "password": "admin123" }`
- **Response:** `{ "token": "<jwt>", "user": { "id": 1, "username": "admin", "fullName": "System Administrator", "roles": [{ "role_id": 1, "role_name": "Admin" }] }`
- All subsequent requests must include:  
  `Authorization: Bearer <token>`

#### Authorization: Role-Based Access Control (RBAC)
Implemented using **ERD DB** database with the following tables:
- `user` – user_id, username, password (hashed), full_name, is_active
- `role` – role_id, role_name, description
- `permission` – permission_id, permission_name
- `user_role` – user_id, role_id (many-to-many)
- `role_permission` – role_id, permission_id, function_id (many-to-many)

**Roles Created:**
1. **Admin** – Full access to all functions
2. **HR Manager** – Manages HR functions (employees, departments, positions)
3. **Payroll Manager** – Manages payroll functions (salaries, attendance)
4. **Employee** – View personal information only

**Permissions:**
- `view_dashboard` – View dashboard
- `manage_users` – Manage users (HR Manager)
- `manage_roles` – Manage roles and permissions (Admin)
- `manage_employees` – Manage employees (HR Manager)
- `manage_payroll` – Manage payroll (Payroll Manager)
- `view_reports` – View reports

**Permission Assignment:**
- Admin: All permissions
- HR Manager: view_dashboard, manage_employees, manage_users
- Payroll Manager: view_dashboard, manage_payroll
- Employee: view_dashboard only

---

## 4. API Endpoint Specifications

| No. | Endpoint | Method | Description | Request Parameters | Response (Success) | Authorization |
|-----|----------|--------|-------------|-------------------|---------------------|---------------|
| 1 | /auth/login | POST | Authenticate user and issue JWT token | `{ "username": "user", "password": "pass" }` | `{ "token": "<jwt>", "user": {...} }` | Public |
| 2 | /employees | GET | Retrieve employee list | None | HR, Admin |
| 3 | /employees/{id} | GET | Get employee by ID | emp_id | Employee JSON | HR, Admin, Employee (self) |
| 4 | /employees | POST | Add a new employee (sync with PAYROLL) | JSON Employee Object | `{ "message": "Employee added successfully" }` | HR, Admin |
| 5 | /employees/{id} | PUT | Update employee info | JSON Employee Object | `{ "message": "Employee updated" }` | HR, Admin |
| 6 | /employees/{id} | DELETE | Delete employee (validate constraints) | emp_id | `{ "message": "Employee deleted" }` | Admin |
| 7 | /payroll | GET | Retrieve payroll list | None | Payroll JSON array | Payroll, Admin |
| 8 | /payroll/{id} | PUT | Update salary info | JSON Payroll Object | `{ "message": "Payroll updated" }` | Payroll, Admin |
| 9 | /attendance | GET | Get attendance records | Optional filters | Attendance JSON | Payroll, Admin |
| 10 | /reports/dashboard | GET | Generate HR/Payroll reports | type=monthly | Report JSON | HR, Payroll, Admin |
| 11 | /alerts | GET | Get alerts (leave, anniversary, discrepancy) | None | Alerts JSON | HR, Admin |
| 12 | **/rbac/roles** | GET | Get all roles | None | Roles JSON | **Admin** |
| 13 | **/rbac/roles** | POST | Create new role | `{ "role_name": "Role", "description": "..." }` | Role JSON | **Admin** |
| 14 | **/rbac/roles/{id}** | PUT | Update role | `{ "role_name": "Role", "description": "..." }` | Role JSON | **Admin** |
| 15 | **/rbac/roles/{id}** | DELETE | Delete role | role_id | `{ "message": "Role deleted" }` | **Admin** |
| 16 | **/rbac/permissions** | GET | Get all permissions | None | Permissions JSON | **Admin** |
| 17 | **/rbac/permissions** | POST | Create permission | `{ "permission_name": "perm" }` | Permission JSON | **Admin** |
| 18 | **/rbac/user-roles** | POST | Assign role to user | `{ "user_id": 1, "role_id": 2 }` | `{ "message": "User role assigned" }` | **Admin** |
| 19 | **/rbac/user-roles** | DELETE | Remove role from user | `{ "user_id": 1, "role_id": 2 }` | `{ "message": "User role removed" }` | **Admin** |
| 20 | **/rbac/role-permissions** | POST | Assign permission to role | `{ "role_id": 1, "permission_id": 3 }` | `{ "message": "Permission assigned" }` | **Admin** |
| 21 | **/rbac/role-permissions** | DELETE | Remove permission from role | `{ "role_id": 1, "permission_id": 3 }` | `{ "message": "Permission removed" }` | **Admin** |

---

## 5. Data Synchronization Logic

### 5.1 Synchronization Scenarios
**Add Employee:**
1. Validate mandatory fields (FullName, DateOfBirth, Gender, etc.)
2. Insert data into HUMAN (SQL Server) → `Employees` table
3. Synchronize to PAYROLL (MySQL) → `employees_payroll` table
4. Rollback if PAYROLL insertion fails

**Update Employee:**
- Update name, position, department in both databases
- If salary structure changes, update PAYROLL salary record

**Delete Employee:**
- Allowed only if employee has no payroll, dividend, or attendance data
- Delete from both databases or none (transaction safety)

### 5.2 Example Workflow
**POST /api/employees**
1. Validate input JSON
2. Insert into SQL Server (HUMAN) with `OUTPUT INSERTED.EmployeeID`
3. Use returned ID to insert into MySQL (PAYROLL)
4. If error in step 3 → rollback SQL Server transaction
5. Return created employee JSON

---

## 6. Error Handling & Logging

| Error Code | Description | Example Response |
|------------|-------------|-----------------|
| 400 | Bad Request – Missing fields | `{ "error": "Missing required data" }` |
| 401 | Unauthorized – Invalid token | `{ "error": "Invalid token" }` |
| 403 | Forbidden – Insufficient permission | `{ "error": "Access denied" }` |
| 404 | Not Found – Resource missing | `{ "error": "Employee not found" }` |
| 409 | Conflict – Duplicate record | `{ "error": "Employee ID already exists" }` |
| 500 | Internal Server Error | `{ "error": "Database connection failed" }` |

**Logs are stored in:**
- Flask console output (development)
- Can be extended to `/logs/api.log` for application errors
- `/logs/security.log` for failed authentications

---

## 7. Integration and Deployment

### 7.1 API Gateway & Security
- Backend runs on Flask development server (can be deployed with Gunicorn/uWSGI)
- HTTPS enforced in production
- JWT tokens validated by Flask-JWT-Extended
- CORS enabled for frontend communication

### 7.2 Environment Setup

| Environment | Description |
|-------------|-------------|
| Local | Development on localhost (Flask port 5000, Vite port 5173) |
| Test | Deployed on test server for integration |
| Production | Final deployment after validation |

### 7.3 Database Configuration
**Files:**
- `backend/config.py` – Database connections
- `backend/.env` – Environment variables (from `.env.example`)
- `backend/erd_db_schema.sql` – SQL script to create ERD DB tables
- `backend/seed_erd_db.py` – Seeds roles, permissions, and users

**Environment Variables (.env):**
```
SQLSERVER_DRIVER=ODBC Driver 17 for SQL Server
SQLSERVER_SERVER=localhost
SQLSERVER_DATABASE=HUMAN
ERD_DB_DATABASE=ERD DB
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=PAYROLL
MYSQL_USER=root
MYSQL_PASSWORD=your_password
JWT_SECRET_KEY=your_secret_key
```

---

## 8. Testing and Validation

**API Testing Tool:** Postman, curl  

**Unit Testing:** Pytest (backend), Jest (frontend)  

**Integration Testing:** Validate HR ↔ Payroll synchronization  

**Security Testing:** Token expiry, access control, SQL injection prevention  

**Performance Testing:** Simulate concurrent requests  

### Example Test Case:
- **Test:** POST /api/auth/login
- **Input:** Valid credentials (admin/admin123)
- **Expected Result:** Returns JWT token and user with roles
- **Actual Result:** ✅ Pass (tested 5/4/2026)

### Test Users (Seeded):
| Username | Password | Role | Permissions |
|----------|----------|------|-------------|
| admin | admin123 | Admin | All permissions |
| hr_manager | hr123 | HR Manager | view_dashboard, manage_employees, manage_users |
| payroll_manager | payroll123 | Payroll Manager | view_dashboard, manage_payroll |
| employee1 | emp123 | Employee | view_dashboard only |

---

## 9. Appendix

### A. Glossary
| Term | Meaning |
|------|---------|
| API | Application Programming Interface |
| JWT | JSON Web Token |
| RBAC | Role-Based Access Control |
| ORM | Object-Relational Mapping |

### B. References
- IEEE 1016 – Software Design Description (2009)
- Case Study 3–4 Requirements (System Integration Practices, 2025)
- Flask RESTful Documentation (2024)
- OWASP API Security Top 10 (2024)
- **Project GitHub Repository:** https://github.com/trannamkhanh/Project-Intergration-

### C. Project File Structure
```
Project-Intergration-/
├── backend/
│   ├── app.py              # Flask app factory
│   ├── config.py            # Database configurations
│   ├── service.py           # Main API endpoints
│   ├── rbac_service.py      # RBAC API endpoints
│   ├── seed_erd_db.py      # Seed RBAC data
│   ├── erd_db_schema.sql   # SQL schema for ERD DB
│   ├── requirements.txt
│   └── .env.example
├── hr-payroll-dashboard/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   └── rbac/
│   │   │       └── RbacManagement.jsx  # RBAC UI
│   │   ├── services/
│   │   │   └── api.js               # API service with rbacService
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx      # Auth context with RBAC
│   │   └── App.jsx
│   └── package.json
└── Security_Authorization_Design_Document.md
```

---

**Document Approval:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Mentor | Huy, Nguyen Dang Quang | | |
| Team Member | Kiet, Nguyen Quang | | |
| Team Member | Huy, Nguyen Bao | | |
| Team Member | Nhan, Tran Phuoc | | |
| Team Member | Khanh, Tran Nam | | |
| Team Member | Thanh, Dang Thi Phuong | | |

---

**Approved by:**  
MSc Huy, Nguyen Dang Quang  

**Group Project - Instructor:**  
Date: 5/4/2026  

**Project Acronym:** HRD  
**Project Title:** Company X – Integrated HR & Payroll Management Dashboard  
**Start Date:** 17 April 2025  
**End Date:** 20 August 2026  
**Lead Institution:** International School, Duy Tan University