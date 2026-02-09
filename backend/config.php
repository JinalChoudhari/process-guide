<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'process_guide');
define('DB_PORT', 3306);

// Enable error reporting for development
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Set response headers for API
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Create database connection
try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }
    
    $conn->set_charset("utf8mb4");
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit();
}

// Helper function to send JSON response
function sendResponse($success, $data = null, $message = null, $statusCode = 200) {
    http_response_code($statusCode);
    $response = [
        'success' => $success,
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    if ($message !== null) {
        $response['message'] = $message;
    }
    
    echo json_encode($response);
    exit();
}

// Helper function to get JSON input
function getInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true);
}
?>
