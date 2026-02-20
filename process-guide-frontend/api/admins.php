<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get all admins
        $stmt = $pdo->query("SELECT id, username, email, created_at FROM admins");
        echo json_encode($stmt->fetchAll());
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Authenticate admin
        if (isset($data['action']) && $data['action'] === 'login') {
            $stmt = $pdo->prepare("SELECT * FROM admins WHERE username = ? AND password = ?");
            $stmt->execute([$data['username'], $data['password']]);
            $admin = $stmt->fetch();
            
            if ($admin) {
                echo json_encode([
                    'success' => true,
                    'admin' => [
                        'id' => $admin['id'],
                        'username' => $admin['username'],
                        'email' => $admin['email']
                    ]
                ]);
            } else {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid credentials']);
            }
        }
        break;
}
?>
