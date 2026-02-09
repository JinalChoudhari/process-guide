import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Process, ProcessStep, StepBranch } from '../types/process';
import { mockProcesses, mockSteps, mockBranches } from '../data/mockData';

interface ProcessContextType {
  processes: Process[];
  steps: ProcessStep[];
  branches: StepBranch[];
  addProcess: (process: Process, processSteps: ProcessStep[], processBranches: StepBranch[]) => Promise<void>;
  updateProcess: (processId: string, process: Process, processSteps: ProcessStep[], processBranches: StepBranch[]) => Promise<void>;
  deleteProcess: (processId: string) => Promise<void>;
  isLoading: boolean;
}

const ProcessContext = createContext<ProcessContextType | undefined>(undefined);

// API Base URL - adjust this to your server
const API_BASE_URL = 'http://localhost/process-guide/backend/api';

// Helper function to check if database is available
async function isDatabaseAvailable(): Promise<boolean> {
  try {
    // Try a simple GET request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${API_BASE_URL}/processes.php`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Check if response is successful and contains valid JSON
    if (response.ok) {
      const data = await response.json();
      return data.success !== undefined;
    }
    return false;
  } catch (error) {
    console.warn('Database connection test failed:', error);
    return false;
  }
}

// Helper function to fetch all data from API
async function fetchAllDataFromAPI() {
  try {
    // Add timeout to each request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const [processesRes, stepsRes, branchesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/processes.php`, { signal: controller.signal }),
      fetch(`${API_BASE_URL}/steps.php`, { signal: controller.signal }),
      fetch(`${API_BASE_URL}/branches.php`, { signal: controller.signal })
    ]);
    
    clearTimeout(timeoutId);

    // Check if all responses are successful
    if (!processesRes.ok || !stepsRes.ok || !branchesRes.ok) {
      throw new Error('One or more API requests failed');
    }

    const processesData = await processesRes.json();
    const stepsData = await stepsRes.json();
    const branchesData = await branchesRes.json();

    // Validate response structure
    if (!processesData.success || !stepsData.success || !branchesData.success) {
      throw new Error('Invalid API response structure');
    }

    return {
      processes: Array.isArray(processesData.data) ? processesData.data : [],
      steps: Array.isArray(stepsData.data) ? stepsData.data : [],
      branches: Array.isArray(branchesData.data) ? branchesData.data : []
    };
  } catch (error) {
    console.error('Error fetching data from API:', error);
    throw error; // Re-throw to be handled by caller
  }
}

export function ProcessProvider({ children }: { children: ReactNode }) {
  const [processes, setProcesses] = useState<Process[]>(mockProcesses);
  const [steps, setSteps] = useState<ProcessStep[]>(mockSteps);
  const [branches, setBranches] = useState<StepBranch[]>(mockBranches);
  const [isLoading, setIsLoading] = useState(true);
  const [useDatabase, setUseDatabase] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const dbAvailable = await isDatabaseAvailable();
        
        if (dbAvailable) {
          try {
            setUseDatabase(true);
            const data = await fetchAllDataFromAPI();
            setProcesses(data.processes);
            setSteps(data.steps);
            setBranches(data.branches);
            console.log('Successfully loaded data from database');
          } catch (apiError) {
            console.error('Failed to fetch data from API, falling back to mock data:', apiError);
            setUseDatabase(false);
            setProcesses(mockProcesses);
            setSteps(mockSteps);
            setBranches(mockBranches);
          }
        } else {
          // Fall back to mock data if database is not available
          console.warn('Database not available, using mock data');
          setUseDatabase(false);
          setProcesses(mockProcesses);
          setSteps(mockSteps);
          setBranches(mockBranches);
        }
      } catch (error) {
        console.error('Error during data loading:', error);
        // Ensure we always have some data
        setProcesses(mockProcesses);
        setSteps(mockSteps);
        setBranches(mockBranches);
        setUseDatabase(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const addProcess = async (process: Process, processSteps: ProcessStep[], processBranches: StepBranch[]) => {
    if (useDatabase) {
      try {
        // Add process
        const processRes = await fetch(`${API_BASE_URL}/processes.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(process)
        });

        if (!processRes.ok) {
          const errorData = await processRes.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to save process');
        }

        // Get the actual process ID from the response
        const processResponseData = await processRes.json();
        const actualProcessId = processResponseData.data?.id || process.id;

        // Update processSteps with the actual process ID
        const updatedProcessSteps = processSteps.map(step => ({
          ...step,
          id: step.id.startsWith('new-') ? `step-${actualProcessId}-${step.stepNumber}` : step.id,
          processId: actualProcessId,
        }));

        // Add steps
        for (const step of updatedProcessSteps) {
          const stepRes = await fetch(`${API_BASE_URL}/steps.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(step)
          });
          if (!stepRes.ok) {
            const errorData = await stepRes.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to save step ${step.title}`);
          }
        }

        // Add branches
        for (const branch of processBranches) {
          const branchRes = await fetch(`${API_BASE_URL}/branches.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...branch,
              condition: branch.condition // Ensure condition field is properly mapped
            })
          });
          if (!branchRes.ok) {
            const errorData = await branchRes.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to save branch for condition ${branch.condition}`);
          }
        }

        // Update local state with the actual process ID
        const updatedProcess = { ...process, id: actualProcessId };
        setProcesses(prev => [...prev, updatedProcess]);
        setSteps(prev => [...prev, ...updatedProcessSteps]);
        setBranches(prev => [...prev, ...processBranches]);
        
        console.log('Process successfully saved to database with ID:', actualProcessId);
        return actualProcessId;
      } catch (error) {
        console.error('Error saving process to database:', error);
        throw error; // Re-throw to let caller handle the error
      }
    } else {
      // Fallback to local state only
      setProcesses(prev => [...prev, process]);
      setSteps(prev => [...prev, ...processSteps]);
      setBranches(prev => [...prev, ...processBranches]);
      console.log('Process saved to local storage (database unavailable)');
      return true;
    }
  };

  const updateProcess = async (processId: string, process: Process, processSteps: ProcessStep[], processBranches: StepBranch[]) => {
    if (useDatabase) {
      try {
        // Update process
        const processRes = await fetch(`${API_BASE_URL}/processes.php`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(process)
        });

        if (!processRes.ok) {
          const errorData = await processRes.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to update process');
        }

        // Get old step IDs to delete
        const oldStepIds = steps.filter(s => s.processId === processId).map(s => s.id);

        // Delete old steps and branches
        for (const stepId of oldStepIds) {
          const deleteRes = await fetch(`${API_BASE_URL}/steps.php?id=${encodeURIComponent(stepId)}`, {
            method: 'DELETE'
          });
          if (!deleteRes.ok) {
            console.warn(`Failed to delete step ${stepId}:`, await deleteRes.text());
          }
        }

        // Add new steps
        for (const step of processSteps) {
          const stepRes = await fetch(`${API_BASE_URL}/steps.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(step)
          });
          if (!stepRes.ok) {
            const errorData = await stepRes.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to save step ${step.title}`);
          }
        }

        // Add new branches
        for (const branch of processBranches) {
          const branchRes = await fetch(`${API_BASE_URL}/branches.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...branch,
              condition: branch.condition
            })
          });
          if (!branchRes.ok) {
            const errorData = await branchRes.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to save branch for condition ${branch.condition}`);
          }
        }

        // Update local state only after successful database operations
        setProcesses(prev => prev.map(p => p.id === processId ? process : p));
        setSteps(prev => [...prev.filter(s => s.processId !== processId), ...processSteps]);
        setBranches(prev => {
          const oldBranchStepIds = steps.filter(s => s.processId === processId).map(s => s.id);
          return [...prev.filter(b => !oldBranchStepIds.includes(b.stepId)), ...processBranches];
        });
        
        console.log('Process successfully updated in database');
        return true;
      } catch (error) {
        console.error('Error updating process in database:', error);
        throw error; // Re-throw to let caller handle the error
      }
    } else {
      // Fallback to local state only
      setProcesses(prev => prev.map(p => p.id === processId ? process : p));
      setSteps(prev => [...prev.filter(s => s.processId !== processId), ...processSteps]);
      setBranches(prev => {
        const oldStepIds = steps.filter(s => s.processId === processId).map(s => s.id);
        return [...prev.filter(b => !oldStepIds.includes(b.stepId)), ...processBranches];
      });
      console.log('Process updated in local storage (database unavailable)');
      return true;
    }
  };

  const deleteProcess = async (processId: string) => {
    if (useDatabase) {
      try {
        const deleteRes = await fetch(`${API_BASE_URL}/processes.php?id=${encodeURIComponent(processId)}`, {
          method: 'DELETE'
        });

        if (!deleteRes.ok) {
          const errorData = await deleteRes.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to delete process');
        }

        // Update local state only after successful database operation
        setProcesses(prev => prev.filter(p => p.id !== processId));
        const stepIdsToRemove = steps.filter(s => s.processId === processId).map(s => s.id);
        setSteps(prev => prev.filter(s => s.processId !== processId));
        setBranches(prev => prev.filter(b => !stepIdsToRemove.includes(b.stepId)));
        
        console.log('Process successfully deleted from database');
        return true;
      } catch (error) {
        console.error('Error deleting process from database:', error);
        throw error; // Re-throw to let caller handle the error
      }
    } else {
      // Fallback to local state only
      setProcesses(prev => prev.filter(p => p.id !== processId));
      const stepIdsToRemove = steps.filter(s => s.processId === processId).map(s => s.id);
      setSteps(prev => prev.filter(s => s.processId !== processId));
      setBranches(prev => prev.filter(b => !stepIdsToRemove.includes(b.stepId)));
      console.log('Process deleted from local storage (database unavailable)');
      return true;
    }
  };

  return (
    <ProcessContext.Provider value={{ processes, steps, branches, addProcess, updateProcess, deleteProcess, isLoading }}>
      {children}
    </ProcessContext.Provider>
  );
}

export function useProcessContext() {
  const context = useContext(ProcessContext);
  if (!context) {
    throw new Error('useProcessContext must be used within ProcessProvider');
  }
  return context;
}
