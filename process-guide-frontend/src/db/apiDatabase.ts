// API Database Service - Connects to MySQL via PHP Backend
// Replace localStorage with MySQL database

import { Process, ProcessStep, StepBranch } from '../types/process';

function getApiBaseUrl(): string {
  const configured = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  if (configured && configured.trim()) {
    return configured.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    const { origin, hostname, pathname, port, protocol } = window.location;

    if (port === '3000') {
      return `${protocol}//${hostname}/processguide/api`;
    }

    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 0 && (parts[0] === 'processguide' || parts[0] === 'process-guide')) {
      return `${origin}/${parts[0]}/api`;
    }

    return `${origin}/api`;
  }

  return 'http://localhost/api';
}

const API_BASE_URL = getApiBaseUrl();

export interface Admin {
  id: string;
  username: string;
  password: string;
  email: string;
  createdAt: string;
}

// ==================== ADMIN OPERATIONS ====================

export async function authenticateAdmin(username: string, password: string): Promise<Admin | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/admins.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password }),
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.success ? data.admin : null;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

// ==================== PROCESS OPERATIONS ====================

export async function getAllProcesses(): Promise<Process[]> {
  try {
    console.log('Fetching processes from:', `${API_BASE_URL}/processes.php`);
    const response = await fetch(`${API_BASE_URL}/processes.php`);
    if (!response.ok) {
      const text = await response.text();
      console.error('Server error:', response.status, text);
      throw new Error('Failed to fetch processes');
    }
    
    const data = await response.json();
    console.log('Processes fetched:', data.length);
    // Map database columns to TypeScript interface
    return data.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching processes:', error);
    return [];
  }
}

export async function getProcessById(id: string): Promise<{ process: Process; steps: ProcessStep[]; branches: StepBranch[] } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/processes.php?id=${id}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    const process: Process = {
      id: data.process.id,
      title: data.process.title,
      description: data.process.description,
      category: data.process.category,
      createdAt: data.process.created_at,
      updatedAt: data.process.updated_at,
    };
    
    const steps: ProcessStep[] = data.steps.map((s: any) => ({
      id: s.id,
      processId: s.process_id,
      stepNumber: parseInt(s.step_number),
      title: s.title,
      description: s.description,
      isDecision: s.is_decision === 1 || s.is_decision === true,
      nextStepId: s.next_step_id,
    }));
    
    const branches: StepBranch[] = data.branches.map((b: any) => ({
      id: b.id,
      stepId: b.step_id,
      condition: b.condition_type,
      nextStepId: b.next_step_id,
      description: b.description,
    }));
    
    return { process, steps, branches };
  } catch (error) {
    console.error('Error fetching process:', error);
    return null;
  }
}

export async function createProcess(
  process: Process,
  steps: ProcessStep[],
  branches: StepBranch[]
): Promise<boolean> {
  try {
    console.log('Creating process at:', `${API_BASE_URL}/processes.php`);
    const response = await fetch(`${API_BASE_URL}/processes.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ process, steps, branches }),
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Server error:', response.status, text);
      throw new Error('Failed to create process');
    }
    return true;
  } catch (error) {
    console.error('Error creating process:', error);
    return false;
  }
}

export async function updateProcess(
  id: string,
  process: Process,
  steps: ProcessStep[],
  branches: StepBranch[]
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/processes.php?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ process, steps, branches }),
    });
    
    if (!response.ok) throw new Error('Failed to update process');
    return true;
  } catch (error) {
    console.error('Error updating process:', error);
    return false;
  }
}

export async function deleteProcess(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/processes.php?id=${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) throw new Error('Failed to delete process');
    return true;
  } catch (error) {
    console.error('Error deleting process:', error);
    return false;
  }
}

// ==================== STEP OPERATIONS ====================

export async function getAllSteps(): Promise<ProcessStep[]> {
  // Steps are fetched with process, this is for compatibility
  return [];
}

export async function getStepsByProcessId(processId: string): Promise<ProcessStep[]> {
  const result = await getProcessById(processId);
  return result?.steps || [];
}

// ==================== BRANCH OPERATIONS ====================

export async function getAllBranches(): Promise<StepBranch[]> {
  // Branches are fetched with process, this is for compatibility
  return [];
}

export async function getBranchesByStepId(stepId: string): Promise<StepBranch[]> {
  // This would need a separate endpoint, for now filter from all
  return [];
}

// ==================== UTILITY OPERATIONS ====================

export async function exportDatabase(): Promise<{ processes: Process[]; steps: ProcessStep[]; branches: StepBranch[] }> {
  const processes = await getAllProcesses();
  const allSteps: ProcessStep[] = [];
  const allBranches: StepBranch[] = [];
  
  for (const process of processes) {
    const result = await getProcessById(process.id);
    if (result) {
      allSteps.push(...result.steps);
      allBranches.push(...result.branches);
    }
  }
  
  return { processes, steps: allSteps, branches: allBranches };
}

// Initialize database (no-op for API, tables should be created via setup_database.php)
export function initializeDatabase(): void {
  console.log('Using MySQL database via API');
}

// Get database stats
export async function getDatabaseStats() {
  const processes = await getAllProcesses();
  let steps = 0;
  let branches = 0;
  
  for (const process of processes) {
    const result = await getProcessById(process.id);
    if (result) {
      steps += result.steps.length;
      branches += result.branches.length;
    }
  }
  
  return {
    admins: 0, // Would need separate endpoint
    processes: processes.length,
    steps,
    branches,
  };
}
