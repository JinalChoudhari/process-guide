<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get all processes or single process
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM processes WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $process = $stmt->fetch();
            
            if ($process) {
                // Get steps
                $stmt = $pdo->prepare("SELECT * FROM steps WHERE process_id = ? ORDER BY step_number");
                $stmt->execute([$_GET['id']]);
                $steps = $stmt->fetchAll();
                
                // Get branches for all steps
                $stepIds = array_column($steps, 'id');
                $branches = [];
                if (!empty($stepIds)) {
                    $placeholders = implode(',', array_fill(0, count($stepIds), '?'));
                    $stmt = $pdo->prepare("SELECT * FROM branches WHERE step_id IN ($placeholders)");
                    $stmt->execute($stepIds);
                    $branches = $stmt->fetchAll();
                }
                
                echo json_encode([
                    'process' => $process,
                    'steps' => $steps,
                    'branches' => $branches
                ]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Process not found']);
            }
        } else {
            $stmt = $pdo->query("SELECT * FROM processes ORDER BY created_at DESC");
            echo json_encode($stmt->fetchAll());
        }
        break;
        
    case 'POST':
        // Create new process
        $data = json_decode(file_get_contents('php://input'), true);
        
        try {
            $pdo->beginTransaction();
            
            // Insert process
            $stmt = $pdo->prepare("INSERT INTO processes (id, title, description, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['process']['id'],
                $data['process']['title'],
                $data['process']['description'],
                $data['process']['category'],
                $data['process']['createdAt'],
                $data['process']['updatedAt']
            ]);
            
            // Insert steps
            if (!empty($data['steps'])) {
                $stmt = $pdo->prepare("INSERT INTO steps (id, process_id, step_number, title, description, is_decision, next_step_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
                foreach ($data['steps'] as $step) {
                    $stmt->execute([
                        $step['id'],
                        $step['processId'],
                        $step['stepNumber'],
                        $step['title'],
                        $step['description'],
                        $step['isDecision'] ? 1 : 0,
                        $step['nextStepId'] ?? null
                    ]);
                }
            }
            
            // Insert branches
            if (!empty($data['branches'])) {
                $stmt = $pdo->prepare("INSERT INTO branches (id, step_id, condition_type, next_step_id, description) VALUES (?, ?, ?, ?, ?)");
                foreach ($data['branches'] as $branch) {
                    $stmt->execute([
                        $branch['id'],
                        $branch['stepId'],
                        $branch['condition'],
                        $branch['nextStepId'],
                        $branch['description']
                    ]);
                }
            }
            
            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Process created']);
            
        } catch (PDOException $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    case 'PUT':
        // Update process
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Process ID required']);
            break;
        }
        
        try {
            $pdo->beginTransaction();
            
            // Update process
            $stmt = $pdo->prepare("UPDATE processes SET title = ?, description = ?, category = ?, updated_at = ? WHERE id = ?");
            $stmt->execute([
                $data['process']['title'],
                $data['process']['description'],
                $data['process']['category'],
                $data['process']['updatedAt'],
                $id
            ]);
            
            // Delete old steps and branches
            $stmt = $pdo->prepare("DELETE FROM steps WHERE process_id = ?");
            $stmt->execute([$id]);
            
            // Insert new steps
            if (!empty($data['steps'])) {
                $stmt = $pdo->prepare("INSERT INTO steps (id, process_id, step_number, title, description, is_decision, next_step_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
                foreach ($data['steps'] as $step) {
                    $stmt->execute([
                        $step['id'],
                        $step['processId'],
                        $step['stepNumber'],
                        $step['title'],
                        $step['description'],
                        $step['isDecision'] ? 1 : 0,
                        $step['nextStepId'] ?? null
                    ]);
                }
            }
            
            // Insert new branches
            if (!empty($data['branches'])) {
                $stmt = $pdo->prepare("INSERT INTO branches (id, step_id, condition_type, next_step_id, description) VALUES (?, ?, ?, ?, ?)");
                foreach ($data['branches'] as $branch) {
                    $stmt->execute([
                        $branch['id'],
                        $branch['stepId'],
                        $branch['condition'],
                        $branch['nextStepId'],
                        $branch['description']
                    ]);
                }
            }
            
            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Process updated']);
            
        } catch (PDOException $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    case 'DELETE':
        // Delete process
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Process ID required']);
            break;
        }
        
        try {
            $stmt = $pdo->prepare("DELETE FROM processes WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Process deleted']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
}
?>
