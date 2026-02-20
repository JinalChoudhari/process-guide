<?php
// Run this file once to create the database tables
require_once 'config.php';

$sql = "
-- Create processes table
CREATE TABLE IF NOT EXISTS processes (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    created_at DATE DEFAULT CURRENT_DATE,
    updated_at DATE DEFAULT CURRENT_DATE
);

-- Create steps table
CREATE TABLE IF NOT EXISTS steps (
    id VARCHAR(50) PRIMARY KEY,
    process_id VARCHAR(50) NOT NULL,
    step_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_decision BOOLEAN DEFAULT FALSE,
    next_step_id VARCHAR(50) DEFAULT NULL,
    FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE
);

-- Create branches table
CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(50) PRIMARY KEY,
    step_id VARCHAR(50) NOT NULL,
    condition_type VARCHAR(10) NOT NULL,
    next_step_id VARCHAR(50) DEFAULT NULL,
    description TEXT,
    FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE CASCADE
);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
";

try {
    $pdo->exec($sql);
    echo "Database tables created successfully!\n";
    
    // Insert default admin
    $stmt = $pdo->prepare("INSERT IGNORE INTO admins (id, username, password, email) VALUES (?, ?, ?, ?)");
    $stmt->execute(['admin-1', 'admin', 'admin123', 'admin@processguide.com']);
    echo "Default admin created (username: admin, password: admin123)\n";
    
} catch (PDOException $e) {
    echo "Error creating tables: " . $e->getMessage();
}
?>
