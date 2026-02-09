<?php
// Branches API endpoints
require_once '../config.php';

$request_method = $_SERVER['REQUEST_METHOD'];
$input = getInput();

// Get all branches
if ($request_method === 'GET' && empty($_GET['stepId']) && empty($_GET['id'])) {
    $result = $conn->query("SELECT * FROM step_branches ORDER BY stepId");
    
    if ($result) {
        $branches = [];
        while ($row = $result->fetch_assoc()) {
            $branches[] = $row;
        }
        sendResponse(true, $branches, null, 200);
    } else {
        sendResponse(false, null, "Failed to fetch branches: " . $conn->error, 500);
    }
}

// Get branches for a specific step
if ($request_method === 'GET' && !empty($_GET['stepId'])) {
    $stepId = $conn->real_escape_string($_GET['stepId']);
    $result = $conn->query("SELECT * FROM step_branches WHERE stepId = '$stepId'");
    
    if ($result) {
        $branches = [];
        while ($row = $result->fetch_assoc()) {
            $branches[] = $row;
        }
        sendResponse(true, $branches, null, 200);
    } else {
        sendResponse(false, null, "Failed to fetch branches: " . $conn->error, 500);
    }
}

// Get single branch
if ($request_method === 'GET' && !empty($_GET['id']) && empty($_GET['stepId'])) {
    $id = $conn->real_escape_string($_GET['id']);
    $result = $conn->query("SELECT * FROM step_branches WHERE id = '$id'");
    
    if ($result && $result->num_rows > 0) {
        $branch = $result->fetch_assoc();
        sendResponse(true, $branch, null, 200);
    } else {
        sendResponse(false, null, "Branch not found", 404);
    }
}

// Create new branch
if ($request_method === 'POST') {
    if (empty($input['id']) || empty($input['stepId']) || empty($input['condition'])) {
        sendResponse(false, null, "Missing required fields: id, stepId, condition", 400);
    }
    
    $id = $conn->real_escape_string($input['id']);
    $stepId = $conn->real_escape_string($input['stepId']);
    $condition = $conn->real_escape_string($input['condition']);
    $nextStepId = !empty($input['nextStepId']) ? $conn->real_escape_string($input['nextStepId']) : null;
    $description = $conn->real_escape_string($input['description'] ?? '');
    
    $nextStepIdSql = $nextStepId ? "'$nextStepId'" : "NULL";
    
    $sql = "INSERT INTO step_branches (id, stepId, branchCondition, nextStepId, description) 
            VALUES ('$id', '$stepId', '$condition', $nextStepIdSql, '$description')";
    
    if ($conn->query($sql) === TRUE) {
        sendResponse(true, ['id' => $id], "Branch created successfully", 201);
    } else {
        // Check if it's a duplicate key error, if so update instead
        if (strpos($conn->error, 'Duplicate entry') !== false) {
            $sql = "UPDATE step_branches SET stepId = '$stepId', branchCondition = '$condition', 
                    nextStepId = $nextStepIdSql, description = '$description' WHERE id = '$id'";
            
            if ($conn->query($sql) === TRUE) {
                sendResponse(true, ['id' => $id], "Branch updated successfully", 200);
            } else {
                sendResponse(false, null, "Failed to update branch: " . $conn->error, 500);
            }
        } else {
            sendResponse(false, null, "Failed to create branch: " . $conn->error, 500);
        }
    }
}

// Update branch
if ($request_method === 'PUT') {
    if (empty($input['id']) || empty($input['stepId']) || empty($input['condition'])) {
        sendResponse(false, null, "Missing required fields: id, stepId, condition", 400);
    }
    
    $id = $conn->real_escape_string($input['id']);
    $stepId = $conn->real_escape_string($input['stepId']);
    $condition = $conn->real_escape_string($input['condition']);
    $nextStepId = !empty($input['nextStepId']) ? $conn->real_escape_string($input['nextStepId']) : null;
    $description = $conn->real_escape_string($input['description'] ?? '');
    
    $nextStepIdSql = $nextStepId ? "'$nextStepId'" : "NULL";
    
    $sql = "UPDATE step_branches SET stepId = '$stepId', branchCondition = '$condition', 
            nextStepId = $nextStepIdSql, description = '$description' WHERE id = '$id'";
    
    if ($conn->query($sql) === TRUE) {
        sendResponse(true, ['id' => $id], "Branch updated successfully", 200);
    } else {
        sendResponse(false, null, "Failed to update branch: " . $conn->error, 500);
    }
}

// Delete branch
if ($request_method === 'DELETE') {
    if (empty($_GET['id'])) {
        sendResponse(false, null, "Missing required parameter: id", 400);
    }
    
    $id = $conn->real_escape_string($_GET['id']);
    
    $sql = "DELETE FROM step_branches WHERE id = '$id'";
    
    if ($conn->query($sql) === TRUE) {
        sendResponse(true, ['id' => $id], "Branch deleted successfully", 200);
    } else {
        sendResponse(false, null, "Failed to delete branch: " . $conn->error, 500);
    }
}

sendResponse(false, null, "Invalid request method or endpoint", 400);
?>
