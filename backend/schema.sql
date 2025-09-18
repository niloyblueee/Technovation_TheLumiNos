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
    campus_id VARCHAR(50) UNIQUE,
    role ENUM('citizen', 'admin') DEFAULT 'citizen',
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

-- Admins table (for government authority-specific information)
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    department VARCHAR(100),
    admin_level ENUM('super', 'regular') DEFAULT 'regular',
    permissions JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_campus_id ON users(campus_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_citizens_user_id ON citizens(user_id);
CREATE INDEX idx_admins_user_id ON admins(user_id);

-- Insert sample admin user (password: admin123)
INSERT INTO users (firstName, lastName, email, password, campus_id, role) 
VALUES ('Admin', 'User', 'admin@technovation.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5K5K.', 'ADMIN001', 'admin')
ON DUPLICATE KEY UPDATE email=email;

-- Insert sample citizen user (password: citizen123)
INSERT INTO users (firstName, lastName, email, password, campus_id, role) 
VALUES ('John', 'Doe', 'citizen@technovation.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5K5K.', 'CIT001', 'citizen')
ON DUPLICATE KEY UPDATE email=email;

-- Insert admin record for the sample admin
INSERT INTO admins (user_id, department, admin_level)
SELECT id, 'Public Works', 'super' 
FROM users WHERE email = 'admin@technovation.com'
ON DUPLICATE KEY UPDATE department = department;

-- Insert citizen record for the sample citizen
INSERT INTO citizens (user_id, address, phone_number)
SELECT id, '123 Main Street, City', '+1234567890' 
FROM users WHERE email = 'citizen@technovation.com'
ON DUPLICATE KEY UPDATE address = address;
