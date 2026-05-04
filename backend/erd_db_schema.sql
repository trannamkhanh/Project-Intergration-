-- SQL Server ERD DB Schema Creation Script
-- Run this in SQL Server Management Studio or via sqlcmd
-- Make sure to create database ERD DB first: CREATE DATABASE [ERD DB];

USE [ERD DB];
GO

-- Create user table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user')
BEGIN
    CREATE TABLE [user] (
        user_id numeric(18,0) IDENTITY(1,1) PRIMARY KEY,
        username varchar(50) NOT NULL UNIQUE,
        password varchar(255) NOT NULL,
        full_name nvarchar(100) NULL,
        is_active bit NULL DEFAULT 1
    );
    PRINT 'Created table: user';
END
ELSE
    PRINT 'Table already exists: user';

-- Create role table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'role')
BEGIN
    CREATE TABLE [role] (
        role_id numeric(18,0) IDENTITY(1,1) PRIMARY KEY,
        role_name nvarchar(50) NOT NULL UNIQUE,
        description nvarchar(255) NULL
    );
    PRINT 'Created table: role';
END
ELSE
    PRINT 'Table already exists: role';

-- Create permission table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'permission')
BEGIN
    CREATE TABLE [permission] (
        permission_id numeric(18,0) IDENTITY(1,1) PRIMARY KEY,
        permission_name nvarchar(100) NOT NULL UNIQUE
    );
    PRINT 'Created table: permission';
END
ELSE
    PRINT 'Table already exists: permission';

-- Create user_role table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_role')
BEGIN
    CREATE TABLE [user_role] (
        user_id numeric(18,0) NOT NULL,
        role_id numeric(18,0) NOT NULL,
        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES [user](user_id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES [role](role_id) ON DELETE CASCADE
    );
    PRINT 'Created table: user_role';
END
ELSE
    PRINT 'Table already exists: user_role';

-- Create role_permission table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'role_permission')
BEGIN
    CREATE TABLE [role_permission] (
        role_id numeric(18,0) NOT NULL,
        permission_id numeric(18,0) NOT NULL,
        function_id numeric(18,0) NULL,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES [role](role_id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES [permission](permission_id) ON DELETE CASCADE
    );
    PRINT 'Created table: role_permission';
END
ELSE
    PRINT 'Table already exists: role_permission';

PRINT 'ERD DB schema creation completed.';
GO