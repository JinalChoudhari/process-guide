<?php
// Steps API endpoints
require_once '../config.php';

$request_method = $_SERVER['REQUEST_METHOD'];
$input = getInput();

// Get all steps
if ($request_method === 'GET' && empty($_GET['processId']) && empty($_GET['id'])) {
    $result = $conn->query("SELECT * FROM process_steps ORDER BY processId, stepNumber");
    
    if ($result) {
        $steps = [];
        while ($row = $result->fetch_assoc()) {
            $steps[] = $row;
        }
        sendResponse(true, $steps, null, 200);
    } else {
        sendResponse(false, null, "Failed to fetch steps: " . $conn->error, 500);
    }
}

// Get steps for a specific process
if ($request_method === 'GET' && !empty($_GET['processId'])) {
    $processId = $conn->real_escape_string($_GET['processId']);
    $result = $conn->query("SELECT * FROM process_steps WHERE processId = '$processId' ORDER BY stepNumber");
    
    if ($result) {
        $steps = [];
        while ($row = $result->fetch_assoc()) {
            $steps[] = $row;
        }
        sendResponse(true, $steps, null, 200);
    } else {
        sendResponse(false, null, "Failed to fetch steps: " . $conn->error, 500);
    }
}

// Get single step
if ($request_method === 'GET' && !empty($_GET['id']) && empty($_GET['processId'])) {
    $id = $conn->real_escape_string($_GET['id']);
    $result = $conn->query("SELECT * FROM process_steps WHERE id = '$id'");
    
    if ($result && $result->num_rows > 0) {
        $step = $result->fetch_assoc();
        sendResponse(true, $step, null, 200);
    } else {
        sendResponse(false, null, "Step not found", 404);
    }
}

// Create new step
if ($request_method === 'POST') {
    if (empty($input['id']) || empty($input['processId']) || empty($input['stepNumber']) || empty($input['title'])) {
        sendResponse(false, null, "Missing required fields: id, processId, stepNumber, title", 400);
    }
    
    $id = $conn->real_escape_string($input['id']);
    $processId = $conn->real_escape_string($input['processId']);
    $stepNumber = (int)$input['stepNumber'];
    $title = $conn->real_escape_string($input['title']);
    $description = $conn->real_escape_string($input['description'] ?? '');
    $isDecision = isset($input['isDecision']) ? (int)$input['isDecision'] : 0;
    
    $sql = "INSERT INTO process_steps (id, processId, stepNumber, title, description, isDecision) 
            VALUES ('$id', '$processId', $stepNumber, '$title', '$description', $isDecision)";
    
    if ($conn->query($sql) === TRUE) {
        sendResponse(true, ['id' => $id], "Step created successfully", 201);
    } else {
        // Check if it's a duplicate key error, if so update instead
        if (strpos($conn->error, 'Duplicate entry') !== false) {
            $sql = "UPDATE process_steps SET processId = '$processId', stepNumber = $stepNumber, 
                    title = '$title', description = '$description', isDecision = $isDecision WHERE id = '$id'";
            
            if ($conn->query($sql) === TRUE) {
                sendResponse(true, ['id' => $id], "Step updated successfully", 200);
            } else {
                sendResponse(false, null, "Failed to update step: " . $conn->error, 500);
            }
        } else {
            sendResponse(false, null, "Failed to create step: " . $conn->error, 500);
        }
    }
}

// Update step
if ($request_method === 'PUT') {
    if (empty($input['id']) || empty($input['processId']) || empty($input['stepNumber']) || empty($input['title'])) {
        sendResponse(false, null, "Missing required fields: id, processId, stepNumber, title", 400);
    }
    
    $id = $conn->real_escape_string($input['id']);
    $processId = $conn->real_escape_string($input['processId']);
    $stepNumber = (int)$input['stepNumber'];
    $title = $conn->real_escape_string($input['title']);
    $description = $conn->real_escape_string($input['description'] ?? '');
    $isDecision = isset($input['isDecision']) ? (int)$input['isDecision'] : 0;
    
    $sql = "UPDATE process_steps SET processId = '$processId', stepNumber = $stepNumber, 
            title = '$title', description = '$description', isDecision = $isDecision WHERE id = '$id'";
    
    if ($conn->query($sql) === TRUE) {
        sendResponse(true, ['id' => $id], "Step updated successfully", 200);
    } else {
        sendResponse(false, null, "Failed to update step: " . $conn->error, 500);
    }
}

// Delete step
if ($request_method === 'DELETE') {
    if (empty($_GET['id'])) {
        sendResponse(false, null, "Missing required parameter: id", 400);
    }
    
    $id = $conn->real_escape_string($_GET['id']);
    
    // This will cascade delete branches
    $sql = "DELETE FROM process_steps WHERE id = '$id'";
    
    if ($conn->query($sql) === TRUE) {
        sendResponse(true, ['id' => $id], "Step deleted successfully", 200);
    } else {
        sendResponse(false, null, "Failed to delete step: " . $conn->error, 500);
    }
}

sendResponse(false, null, "Invalid request method or endpoint", 400);
?>
