<?php
// Processes API endpoints
require_once '../config.php';

$request_method = $_SERVER['REQUEST_METHOD'];
$input = getInput();

// Get all processes
if ($request_method === 'GET' && empty($_GET['id'])) {
    $result = $conn->query("SELECT process_id as id, title, description, category, DATE(created_at) as createdAt, DATE(created_at) as updatedAt FROM processes ORDER BY created_at DESC");
    
    if ($result) {
        $processes = [];
        while ($row = $result->fetch_assoc()) {
            $processes[] = $row;
        }
        sendResponse(true, $processes, null, 200);
    } else {
        sendResponse(false, null, "Failed to fetch processes: " . $conn->error, 500);
    }
}

// Get single process
if ($request_method === 'GET' && !empty($_GET['id'])) {
    $id = $conn->real_escape_string($_GET['id']);
    $result = $conn->query("SELECT process_id as id, title, description, category, DATE(created_at) as createdAt, DATE(created_at) as updatedAt FROM processes WHERE process_id = '$id'");
    
    if ($result && $result->num_rows > 0) {
        $process = $result->fetch_assoc();
        sendResponse(true, $process, null, 200);
    } else {
        sendResponse(false, null, "Process not found", 404);
    }
}

// Create new process
if ($request_method === 'POST') {
    // Validate input
    if (empty($input['id']) || empty($input['title']) || empty($input['description']) || empty($input['category'])) {
        sendResponse(false, null, "Missing required fields: id, title, description, category", 400);
    }
    
    $id = $conn->real_escape_string($input['id'] ?? '');
    $title = $conn->real_escape_string($input['title']);
    $description = $conn->real_escape_string($input['description']);
    $category = $conn->real_escape_string($input['category']);
    
    $sql = "INSERT INTO processes (process_id, title, description, category) 
            VALUES ('$id', '$title', '$description', '$category')";
    
    if ($conn->query($sql) === TRUE) {
        sendResponse(true, ['id' => $id], "Process created successfully", 201);
    } else {
        // Check if it's a duplicate key error, if so update instead
        if (strpos($conn->error, 'Duplicate entry') !== false) {
            // Process already exists, try update
            $sql = "UPDATE processes SET title = '$title', description = '$description', 
                    category = '$category' WHERE process_id = '$id'";
            
            if ($conn->query($sql) === TRUE) {
                sendResponse(true, ['id' => $id], "Process updated successfully", 200);
            } else {
                sendResponse(false, null, "Failed to update process: " . $conn->error, 500);
            }
        } else {
            sendResponse(false, null, "Failed to create process: " . $conn->error, 500);
        }
    }
}

// Update process
if ($request_method === 'PUT') {
    if (empty($input['id']) || empty($input['title']) || empty($input['description']) || empty($input['category'])) {
        sendResponse(false, null, "Missing required fields: id, title, description, category", 400);
    }
    
    $id = $conn->real_escape_string($input['id']);
    $title = $conn->real_escape_string($input['title']);
    $description = $conn->real_escape_string($input['description']);
    $category = $conn->real_escape_string($input['category']);
    
    $sql = "UPDATE processes SET title = '$title', description = '$description', 
            category = '$category' WHERE process_id = '$id'";
    
    if ($conn->query($sql) === TRUE) {
        sendResponse(true, ['id' => $id], "Process updated successfully", 200);
    } else {
        sendResponse(false, null, "Failed to update process: " . $conn->error, 500);
    }
}

// Delete process
if ($request_method === 'DELETE') {
    if (empty($_GET['id'])) {
        sendResponse(false, null, "Missing required parameter: id", 400);
    }
    
    $id = $conn->real_escape_string($_GET['id']);
    
    // This will cascade delete steps and branches
    $sql = "DELETE FROM processes WHERE process_id = '$id'";
    
    if ($conn->query($sql) === TRUE) {
        sendResponse(true, ['id' => $id], "Process deleted successfully", 200);
    } else {
        sendResponse(false, null, "Failed to delete process: " . $conn->error, 500);
    }
}

sendResponse(false, null, "Invalid request method or endpoint", 400);
?>
