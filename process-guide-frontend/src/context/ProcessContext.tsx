import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Process, ProcessStep, StepBranch } from "../types/process";
import * as DB from "../db/apiDatabase";

interface ProcessContextType {
  processes: Process[];
  steps: ProcessStep[];
  branches: StepBranch[];
  addProcess: (
    process: Process,
    processSteps: ProcessStep[],
    processBranches: StepBranch[]
  ) => Promise<void>;
  updateProcess: (
    processId: string,
    process: Process,
    processSteps: ProcessStep[],
    processBranches: StepBranch[]
  ) => Promise<void>;
  deleteProcess: (processId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  loading: boolean;
}

const ProcessContext = createContext<ProcessContextType | undefined>(
  undefined
);

export function ProcessProvider({ children }: { children: ReactNode }) {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [branches, setBranches] = useState<StepBranch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allProcesses = await DB.getAllProcesses();
      setProcesses(allProcesses);

      const details = await Promise.all(
        allProcesses.map((process) => DB.getProcessById(process.id))
      );

      const allSteps: ProcessStep[] = [];
      const allBranches: StepBranch[] = [];

      for (const detail of details) {
        if (!detail) continue;
        allSteps.push(...detail.steps);
        allBranches.push(...detail.branches);
      }

      setSteps(allSteps);
      setBranches(allBranches);
    } catch (error) {
      console.error("Error loading data:", error);
      setProcesses([]);
      setSteps([]);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  const addProcess = async (
    process: Process,
    processSteps: ProcessStep[],
    processBranches: StepBranch[]
  ) => {
    const success = await DB.createProcess(process, processSteps, processBranches);
    if (!success) {
      throw new Error("Failed to create process");
    }
    await refreshData();
  };

  const updateProcess = async (
    processId: string,
    process: Process,
    processSteps: ProcessStep[],
    processBranches: StepBranch[]
  ) => {
    const success = await DB.updateProcess(
      processId,
      process,
      processSteps,
      processBranches
    );
    if (!success) {
      throw new Error("Failed to update process");
    }
    await refreshData();
  };

  const deleteProcess = async (processId: string) => {
    const success = await DB.deleteProcess(processId);
    if (!success) {
      throw new Error("Failed to delete process");
    }
    await refreshData();
  };

  return (
    <ProcessContext.Provider
      value={{
        processes,
        steps,
        branches,
        addProcess,
        updateProcess,
        deleteProcess,
        refreshData,
        loading,
      }}
    >
      {children}
    </ProcessContext.Provider>
  );
}

export function useProcessContext() {
  const context = useContext(ProcessContext);
  if (!context) {
    throw new Error(
      "useProcessContext must be used within ProcessProvider"
    );
  }
  return context;
}
