<?php
// Add default admin user
require_once 'config.php';

try {
    // Check if admin already exists
    $stmt = $pdo->prepare("SELECT * FROM admins WHERE username = ?");
    $stmt->execute(['admin']);
    $existing = $stmt->fetch();
    
    if ($existing) {
        echo "Admin user already exists!<br>";
        echo "Username: admin<br>";
        echo "Password: admin123<br>";
    } else {
        // Insert default admin
        $stmt = $pdo->prepare("INSERT INTO admins (id, username, password, email) VALUES (?, ?, ?, ?)");
        $stmt->execute(['admin-1', 'admin', 'admin123', 'admin@processguide.com']);
        echo "Default admin created successfully!<br>";
        echo "Username: admin<br>";
        echo "Password: admin123<br>";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
