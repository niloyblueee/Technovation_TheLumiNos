-- Technovation TheLumiNos Database Schema - SDG11 Project

CREATE DATABASE IF NOT EXISTS technovation_luminos;
USE technovation_luminos;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    national_id VARCHAR(20) UNIQUE,
    sex ENUM('male', 'female', 'other') NOT NULL,
    role ENUM('admin', 'govt_authority', 'citizen') DEFAULT 'citizen',
    status ENUM('active', 'pending', 'rejected') DEFAULT 'active',
    profileImage VARCHAR(255),
    googleId VARCHAR(100) UNIQUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Citizens table (for citizen-specific information)
CREATE TABLE IF NOT EXISTS citizens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    address TEXT,
    phone_number VARCHAR(20),
    location_coordinates JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Government Authorities table
CREATE TABLE IF NOT EXISTS govt_authorities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    department VARCHAR(100) NOT NULL,
    region ENUM('dhaka_north', 'dhaka_south') NOT NULL,
    admin_level ENUM('super', 'regular') DEFAULT 'regular',
    permissions JSON,
    approved_by INT,
    approved_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Admins table (fixed single admin)
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    admin_level ENUM('super') DEFAULT 'super',
    permissions JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS issues (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone_number VARCHAR(20),
        coordinate VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        photo VARCHAR(255),
        emergency BOOLEAN DEFAULT FALSE,
        status ENUM('pending', 'in_progress', 'resolved', 'rejected') DEFAULT 'pending'
      )

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_national_id ON users(national_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_citizens_user_id ON citizens(user_id);
CREATE INDEX idx_govt_authorities_user_id ON govt_authorities(user_id);
CREATE INDEX idx_admins_user_id ON admins(user_id);

-- Insert fixed admin user (password: admin123)
INSERT INTO users (firstName, lastName, email, password, national_id, sex, role, status) 
VALUES ('System', 'Admin', 'admin@technovation.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5K5K.', 'ADMIN001', 'male', 'admin', 'active')
ON DUPLICATE KEY UPDATE email=email;

-- Insert sample citizen user (password: citizen123)
INSERT INTO users (firstName, lastName, email, password, national_id, sex, role, status) 
VALUES ('John', 'Doe', 'citizen@technovation.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5K5K.', '1234567890123', 'male', 'citizen', 'active')
ON DUPLICATE KEY UPDATE email=email;

-- Insert sample government authority (pending approval)
INSERT INTO users (firstName, lastName, email, password, national_id, sex, role, status) 
VALUES ('Jane', 'Smith', 'govt@technovation.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5K5K.', '9876543210987', 'female', 'govt_authority', 'pending')
ON DUPLICATE KEY UPDATE email=email;

-- Insert admin record for the fixed admin
INSERT INTO admins (user_id, admin_level)
SELECT id, 'super' 
FROM users WHERE email = 'admin@technovation.com'
ON DUPLICATE KEY UPDATE admin_level = admin_level;

-- Insert citizen record for the sample citizen
INSERT INTO citizens (user_id, address, phone_number)
SELECT id, '123 Main Street, Dhaka', '+8801234567890' 
FROM users WHERE email = 'citizen@technovation.com'
ON DUPLICATE KEY UPDATE address = address;

-- Insert government authority record (pending approval)
INSERT INTO govt_authorities (user_id, department, region)
SELECT id, 'Public Works', 'dhaka_north' 
FROM users WHERE email = 'govt@technovation.com'
ON DUPLICATE KEY UPDATE department = department;
