<?php
// Test login functionality
require_once 'config.php';

// Test database connection
echo "Database connection: OK<br><br>";

// Check if admins table exists
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'admins'");
    if ($stmt->rowCount() > 0) {
        echo "Admins table: EXISTS<br><br>";
    } else {
        echo "Admins table: NOT FOUND<br><br>";
    }
} catch (PDOException $e) {
    echo "Error checking table: " . $e->getMessage() . "<br><br>";
}

// Check admin users
try {
    $stmt = $pdo->query("SELECT * FROM admins");
    $admins = $stmt->fetchAll();
    
    echo "Admin users found: " . count($admins) . "<br>";
    foreach ($admins as $admin) {
        echo "- ID: " . $admin['id'] . ", Username: " . $admin['username'] . "<br>";
    }
    echo "<br>";
} catch (PDOException $e) {
    echo "Error fetching admins: " . $e->getMessage() . "<br><br>";
}

// Test login
try {
    $username = 'admin';
    $password = 'admin123';
    
    $stmt = $pdo->prepare("SELECT * FROM admins WHERE username = ? AND password = ?");
    $stmt->execute([$username, $password]);
    $admin = $stmt->fetch();
    
    if ($admin) {
        echo "Login test: SUCCESS<br>";
        echo "Admin ID: " . $admin['id'] . "<br>";
    } else {
        echo "Login test: FAILED - Invalid credentials<br>";
    }
} catch (PDOException $e) {
    echo "Login test error: " . $e->getMessage() . "<br>";
}
?>
