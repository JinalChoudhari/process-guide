<?php
// Simple database check
$host = 'localhost';
$dbname = 'process_guide';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Database connection: SUCCESS<br><br>";
    
    // Check if admins table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'admins'");
    if ($stmt->rowCount() > 0) {
        echo "Admins table: EXISTS<br><br>";
        
        // Count admins
        $stmt = $pdo->query("SELECT COUNT(*) FROM admins");
        $count = $stmt->fetchColumn();
        echo "Number of admins: $count<br><br>";
        
        if ($count == 0) {
            // Insert admin
            $stmt = $pdo->prepare("INSERT INTO admins (id, username, password, email) VALUES (?, ?, ?, ?)");
            $stmt->execute(['admin-1', 'admin', 'admin123', 'admin@processguide.com']);
            echo "Admin INSERTED successfully!<br>";
            echo "Username: admin<br>";
            echo "Password: admin123<br>";
        } else {
            // Show existing admins
            $stmt = $pdo->query("SELECT id, username, password FROM admins");
            $admins = $stmt->fetchAll();
            echo "Existing admins:<br>";
            foreach ($admins as $admin) {
                echo "- ID: {$admin['id']}, Username: {$admin['username']}, Password: {$admin['password']}<br>";
            }
        }
    } else {
        echo "Admins table: NOT FOUND - Running setup...<br>";
        
        // Create tables
        $sql = "
        CREATE TABLE IF NOT EXISTS processes (
            id VARCHAR(50) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100),
            created_at DATE DEFAULT CURRENT_DATE,
            updated_at DATE DEFAULT CURRENT_DATE
        );
        
        CREATE TABLE IF NOT EXISTS steps (
            id VARCHAR(50) PRIMARY KEY,
            process_id VARCHAR(50) NOT NULL,
            step_number INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            is_decision BOOLEAN DEFAULT FALSE,
            next_step_id VARCHAR(50) DEFAULT NULL
        );
        
        CREATE TABLE IF NOT EXISTS branches (
            id VARCHAR(50) PRIMARY KEY,
            step_id VARCHAR(50) NOT NULL,
            condition_type VARCHAR(10) NOT NULL,
            next_step_id VARCHAR(50) DEFAULT NULL,
            description TEXT
        );
        
        CREATE TABLE IF NOT EXISTS admins (
            id VARCHAR(50) PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ";
        $pdo->exec($sql);
        echo "Tables created!<br>";
        
        // Insert admin
        $stmt = $pdo->prepare("INSERT INTO admins (id, username, password, email) VALUES (?, ?, ?, ?)");
        $stmt->execute(['admin-1', 'admin', 'admin123', 'admin@processguide.com']);
        echo "Admin created!<br>";
    }
    
} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage();
}
?>
