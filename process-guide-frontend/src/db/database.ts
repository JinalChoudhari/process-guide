// Local Database using localStorage
// Simulates a relational database with tables for admins, processes, steps, and branches

import { Process, ProcessStep, StepBranch } from '../types/process';

// Database Schema
export interface Admin {
  id: string;
  username: string;
  password: string;
  email: string;
  createdAt: string;
}

export interface DBSchema {
  admins: Admin[];
  processes: Process[];
  steps: ProcessStep[];
  branches: StepBranch[];
}

// Database Keys
const DB_KEYS = {
  ADMINS: 'db_admins',
  PROCESSES: 'db_processes',
  STEPS: 'db_steps',
  BRANCHES: 'db_branches',
  INITIALIZED: 'db_initialized',
};

// Initialize Database with default data
export function initializeDatabase(): void {
  const isInitialized = localStorage.getItem(DB_KEYS.INITIALIZED);
  
  if (!isInitialized) {
    // Create default admin account
    const defaultAdmin: Admin = {
      id: 'admin-1',
      username: 'admin',
      password: 'admin123', // In production, this should be hashed
      email: 'admin@processguide.com',
      createdAt: new Date().toISOString(),
    };
    
    // Create sample process
    const sampleProcess: Process = {
      id: 'process-sample-1',
      title: 'College Admission Process',
      description: 'Complete step-by-step guide for college admission procedure including application, document verification, and enrollment',
      category: 'Academic',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15',
    };

    // Create sample steps
    const sampleSteps: ProcessStep[] = [
      {
        id: 'step-sample-1-1',
        processId: 'process-sample-1',
        stepNumber: 1,
        title: 'Fill Application Form',
        description: 'Visit the college website and complete the online application form with personal details, academic records, and contact information.',
        isDecision: false,
      },
      {
        id: 'step-sample-1-2',
        processId: 'process-sample-1',
        stepNumber: 2,
        title: 'Check Eligibility',
        description: 'Verify if the applicant meets the minimum eligibility criteria including marks, age, and required qualifications.',
        isDecision: true,
      },
      {
        id: 'step-sample-1-3',
        processId: 'process-sample-1',
        stepNumber: 3,
        title: 'Submit Documents',
        description: 'Upload required documents: 10th & 12th marksheets, transfer certificate, migration certificate, passport photos, and ID proof.',
        isDecision: false,
      },
      {
        id: 'step-sample-1-4',
        processId: 'process-sample-1',
        stepNumber: 4,
        title: 'Pay Application Fee',
        description: 'Complete the payment of application fee through online payment gateway (Debit/Credit card, Net Banking, or UPI).',
        isDecision: false,
      },
    ];

    // Create sample branches for decision step
    const sampleBranches: StepBranch[] = [
      {
        id: 'branch-step-sample-1-2-yes',
        stepId: 'step-sample-1-2',
        condition: 'yes',
        nextStepId: 'step-sample-1-3',
        description: 'Student meets eligibility criteria',
      },
      {
        id: 'branch-step-sample-1-2-no',
        stepId: 'step-sample-1-2',
        condition: 'no',
        nextStepId: null,
        description: 'Student does not meet eligibility criteria - Application ends here',
      },
    ];
    
    localStorage.setItem(DB_KEYS.ADMINS, JSON.stringify([defaultAdmin]));
    localStorage.setItem(DB_KEYS.PROCESSES, JSON.stringify([sampleProcess]));
    localStorage.setItem(DB_KEYS.STEPS, JSON.stringify(sampleSteps));
    localStorage.setItem(DB_KEYS.BRANCHES, JSON.stringify(sampleBranches));
    localStorage.setItem(DB_KEYS.INITIALIZED, 'true');
    
    console.log('Database initialized successfully with sample data');
  }
}

// Generic CRUD Operations
function getTable<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setTable<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ==================== ADMIN OPERATIONS ====================

export function getAllAdmins(): Admin[] {
  return getTable<Admin>(DB_KEYS.ADMINS);
}

export function getAdminByUsername(username: string): Admin | null {
  const admins = getAllAdmins();
  return admins.find(admin => admin.username === username) || null;
}

export function authenticateAdmin(username: string, password: string): Admin | null {
  const admin = getAdminByUsername(username);
  if (admin && admin.password === password) {
    return admin;
  }
  return null;
}

export function createAdmin(admin: Omit<Admin, 'id' | 'createdAt'>): Admin {
  const admins = getAllAdmins();
  const newAdmin: Admin = {
    ...admin,
    id: `admin-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  admins.push(newAdmin);
  setTable(DB_KEYS.ADMINS, admins);
  return newAdmin;
}

export function updateAdmin(id: string, updates: Partial<Admin>): Admin | null {
  const admins = getAllAdmins();
  const index = admins.findIndex(a => a.id === id);
  if (index === -1) return null;
  
  admins[index] = { ...admins[index], ...updates };
  setTable(DB_KEYS.ADMINS, admins);
  return admins[index];
}

export function deleteAdmin(id: string): boolean {
  const admins = getAllAdmins();
  const filtered = admins.filter(a => a.id !== id);
  if (filtered.length === admins.length) return false;
  
  setTable(DB_KEYS.ADMINS, filtered);
  return true;
}

// ==================== PROCESS OPERATIONS ====================

export function getAllProcesses(): Process[] {
  return getTable<Process>(DB_KEYS.PROCESSES);
}

export function getProcessById(id: string): Process | null {
  const processes = getAllProcesses();
  return processes.find(p => p.id === id) || null;
}

export function createProcess(process: Process): Process {
  const processes = getAllProcesses();
  processes.push(process);
  setTable(DB_KEYS.PROCESSES, processes);
  return process;
}

export function updateProcess(id: string, updates: Partial<Process>): Process | null {
  const processes = getAllProcesses();
  const index = processes.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  processes[index] = { ...processes[index], ...updates, updatedAt: new Date().toISOString().split('T')[0] };
  setTable(DB_KEYS.PROCESSES, processes);
  return processes[index];
}

export function deleteProcess(id: string): boolean {
  const processes = getAllProcesses();
  const filtered = processes.filter(p => p.id !== id);
  if (filtered.length === processes.length) return false;
  
  // Also delete related steps and branches
  deleteStepsByProcessId(id);
  
  setTable(DB_KEYS.PROCESSES, filtered);
  return true;
}

// ==================== STEP OPERATIONS ====================

export function getAllSteps(): ProcessStep[] {
  return getTable<ProcessStep>(DB_KEYS.STEPS);
}

export function getStepById(id: string): ProcessStep | null {
  const steps = getAllSteps();
  return steps.find(s => s.id === id) || null;
}

export function getStepsByProcessId(processId: string): ProcessStep[] {
  const steps = getAllSteps();
  return steps.filter(s => s.processId === processId).sort((a, b) => a.stepNumber - b.stepNumber);
}

export function createStep(step: ProcessStep): ProcessStep {
  const steps = getAllSteps();
  steps.push(step);
  setTable(DB_KEYS.STEPS, steps);
  return step;
}

export function createSteps(newSteps: ProcessStep[]): ProcessStep[] {
  const steps = getAllSteps();
  steps.push(...newSteps);
  setTable(DB_KEYS.STEPS, steps);
  return newSteps;
}

export function updateStep(id: string, updates: Partial<ProcessStep>): ProcessStep | null {
  const steps = getAllSteps();
  const index = steps.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  steps[index] = { ...steps[index], ...updates };
  setTable(DB_KEYS.STEPS, steps);
  return steps[index];
}

export function deleteStep(id: string): boolean {
  const steps = getAllSteps();
  const filtered = steps.filter(s => s.id !== id);
  if (filtered.length === steps.length) return false;
  
  // Also delete related branches
  deleteBranchesByStepId(id);
  
  setTable(DB_KEYS.STEPS, filtered);
  return true;
}

export function deleteStepsByProcessId(processId: string): void {
  const steps = getAllSteps();
  const stepIds = steps.filter(s => s.processId === processId).map(s => s.id);
  
  // Delete branches for these steps
  stepIds.forEach(stepId => deleteBranchesByStepId(stepId));
  
  // Delete steps
  const filtered = steps.filter(s => s.processId !== processId);
  setTable(DB_KEYS.STEPS, filtered);
}

export function replaceStepsForProcess(processId: string, newSteps: ProcessStep[]): void {
  deleteStepsByProcessId(processId);
  createSteps(newSteps);
}

// ==================== BRANCH OPERATIONS ====================

export function getAllBranches(): StepBranch[] {
  return getTable<StepBranch>(DB_KEYS.BRANCHES);
}

export function getBranchById(id: string): StepBranch | null {
  const branches = getAllBranches();
  return branches.find(b => b.id === id) || null;
}

export function getBranchesByStepId(stepId: string): StepBranch[] {
  const branches = getAllBranches();
  return branches.filter(b => b.stepId === stepId);
}

export function createBranch(branch: StepBranch): StepBranch {
  const branches = getAllBranches();
  branches.push(branch);
  setTable(DB_KEYS.BRANCHES, branches);
  return branch;
}

export function createBranches(newBranches: StepBranch[]): StepBranch[] {
  const branches = getAllBranches();
  branches.push(...newBranches);
  setTable(DB_KEYS.BRANCHES, branches);
  return newBranches;
}

export function updateBranch(id: string, updates: Partial<StepBranch>): StepBranch | null {
  const branches = getAllBranches();
  const index = branches.findIndex(b => b.id === id);
  if (index === -1) return null;
  
  branches[index] = { ...branches[index], ...updates };
  setTable(DB_KEYS.BRANCHES, branches);
  return branches[index];
}

export function deleteBranch(id: string): boolean {
  const branches = getAllBranches();
  const filtered = branches.filter(b => b.id !== id);
  if (filtered.length === branches.length) return false;
  
  setTable(DB_KEYS.BRANCHES, filtered);
  return true;
}

export function deleteBranchesByStepId(stepId: string): void {
  const branches = getAllBranches();
  const filtered = branches.filter(b => b.stepId !== stepId);
  setTable(DB_KEYS.BRANCHES, filtered);
}

export function replaceBranchesForProcess(processId: string, newBranches: StepBranch[]): void {
  const steps = getStepsByProcessId(processId);
  const stepIds = steps.map(s => s.id);
  
  // Delete old branches
  const branches = getAllBranches();
  const filtered = branches.filter(b => !stepIds.includes(b.stepId));
  
  // Add new branches
  filtered.push(...newBranches);
  setTable(DB_KEYS.BRANCHES, filtered);
}

// ==================== UTILITY OPERATIONS ====================

export function exportDatabase(): DBSchema {
  return {
    admins: getAllAdmins(),
    processes: getAllProcesses(),
    steps: getAllSteps(),
    branches: getAllBranches(),
  };
}

export function importDatabase(schema: DBSchema): void {
  setTable(DB_KEYS.ADMINS, schema.admins);
  setTable(DB_KEYS.PROCESSES, schema.processes);
  setTable(DB_KEYS.STEPS, schema.steps);
  setTable(DB_KEYS.BRANCHES, schema.branches);
}

export function clearDatabase(): void {
  localStorage.removeItem(DB_KEYS.ADMINS);
  localStorage.removeItem(DB_KEYS.PROCESSES);
  localStorage.removeItem(DB_KEYS.STEPS);
  localStorage.removeItem(DB_KEYS.BRANCHES);
  localStorage.removeItem(DB_KEYS.INITIALIZED);
}

export function resetDatabase(): void {
  clearDatabase();
  initializeDatabase();
}

// ==================== STATISTICS ====================

export function getDatabaseStats() {
  return {
    admins: getAllAdmins().length,
    processes: getAllProcesses().length,
    steps: getAllSteps().length,
    branches: getAllBranches().length,
  };
}