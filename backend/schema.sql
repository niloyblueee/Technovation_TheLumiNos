-- Technovation TheLumiNos Database Schema

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
    role ENUM('student', 'admin', 'manager') DEFAULT 'student',
    profileImage VARCHAR(255),
    googleId VARCHAR(100) UNIQUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Students table (for student-specific information)
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    department VARCHAR(100),
    year_of_study INT,
    student_id VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Admins table (for admin-specific information)
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    admin_level ENUM('super', 'regular') DEFAULT 'regular',
    permissions JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_campus_id ON users(campus_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_admins_user_id ON admins(user_id);

-- Insert sample admin user (password: admin123)
INSERT INTO users (firstName, lastName, email, password, campus_id, role) 
VALUES ('Admin', 'User', 'admin@technovation.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5K5K.', 'ADMIN001', 'admin')
ON DUPLICATE KEY UPDATE email=email;

-- Insert sample student user (password: student123)
INSERT INTO users (firstName, lastName, email, password, campus_id, role) 
VALUES ('John', 'Doe', 'student@technovation.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5K5K.', 'STU001', 'student')
ON DUPLICATE KEY UPDATE email=email;

-- Insert student record for the sample student
INSERT INTO students (user_id, department, year_of_study, student_id)
SELECT id, 'Computer Science & Engineering', 3, 'STU001' 
FROM users WHERE email = 'student@technovation.com'
ON DUPLICATE KEY UPDATE department = department;
