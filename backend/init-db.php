<?php
// Database initialization script
require_once 'config.php';

// Function to execute SQL and log results
function executeSql($conn, $sql, $description) {
    echo "Executing: " . $description . "\n";
    
    if ($conn->query($sql) === TRUE) {
        echo "✓ " . $description . " - SUCCESS\n";
        return true;
    } else {
        echo "✗ " . $description . " - FAILED\n";
        echo "Error: " . $conn->error . "\n";
        return false;
    }
}

// Create database if it doesn't exist
$createDb = "CREATE DATABASE IF NOT EXISTS " . DB_NAME;
$tempConn = new mysqli(DB_HOST, DB_USER, DB_PASS, "", DB_PORT);
$tempConn->query($createDb);
$tempConn->close();

echo "\n=== Process Guide Database Setup ===\n\n";

// Create processes table
$sql_processes = "CREATE TABLE IF NOT EXISTS processes (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    createdAt DATE NOT NULL,
    updatedAt DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

executeSql($conn, $sql_processes, "Create 'processes' table");

// Create process_steps table
$sql_steps = "CREATE TABLE IF NOT EXISTS process_steps (
    id VARCHAR(100) PRIMARY KEY,
    processId VARCHAR(50) NOT NULL,
    stepNumber INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    isDecision BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- FOREIGN KEY (processId) REFERENCES processes(id) ON DELETE CASCADE,
    INDEX idx_processId (processId),
    INDEX idx_stepNumber (stepNumber)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

executeSql($conn, $sql_steps, "Create 'process_steps' table");

// Create step_branches table
$sql_branches = "CREATE TABLE IF NOT EXISTS step_branches (
    id VARCHAR(100) PRIMARY KEY,
    stepId VARCHAR(100) NOT NULL,
    branchCondition VARCHAR(10) NOT NULL,
    nextStepId VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (stepId) REFERENCES process_steps(id) ON DELETE CASCADE,
    INDEX idx_stepId (stepId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

executeSql($conn, $sql_branches, "Create 'step_branches' table");

echo "\n✓ Database setup complete!\n";
echo "\nTo initialize the database:\n";
echo "1. Make sure you have a MySQL server running on localhost\n";
echo "2. Update DB_USER and DB_PASS in config.php if needed\n";
echo "3. Run this file in your browser: http://localhost/process-guide/backend/init-db.php\n";

$conn->close();
?>
