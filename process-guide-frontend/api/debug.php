<?php
// Debug script to check database and admin
require_once 'config.php';

echo "=== DATABASE DEBUG ===<br><br>";

// Check connection
echo "1. Database Connection: OK<br><br>";

// List all tables
echo "2. Tables in database:<br>";
$stmt = $pdo->query("SHOW TABLES");
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
foreach ($tables as $table) {
    echo "   - $table<br>";
}
echo "<br>";

// Check admins table
echo "3. Admins table data:<br>";
$stmt = $pdo->query("SELECT * FROM admins");
$admins = $stmt->fetchAll();
echo "   Found " . count($admins) . " admin(s)<br>";
foreach ($admins as $admin) {
    echo "   - ID: {$admin['id']}, Username: {$admin['username']}, Password: {$admin['password']}<br>";
}
echo "<br>";

// Test login manually
echo "4. Testing login with admin/admin123:<br>";
$stmt = $pdo->prepare("SELECT * FROM admins WHERE username = ? AND password = ?");
$stmt->execute(['admin', 'admin123']);
$result = $stmt->fetch();
if ($result) {
    echo "   SUCCESS! Login works.<br>";
} else {
    echo "   FAILED! Login doesn't work.<br>";
    
    // Try to insert admin
    echo "<br>5. Attempting to insert admin...<br>";
    try {
        $stmt = $pdo->prepare("INSERT INTO admins (id, username, password, email) VALUES (?, ?, ?, ?)");
        $stmt->execute(['admin-1', 'admin', 'admin123', 'admin@processguide.com']);
        echo "   Admin inserted successfully!<br>";
    } catch (PDOException $e) {
        echo "   Error: " . $e->getMessage() . "<br>";
    }
}
?>
