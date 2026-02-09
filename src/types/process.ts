export interface Process {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessStep {
  id: string;
  processId: string;
  stepNumber: number;
  title: string;
  description: string;
  isDecision: boolean;
}

export interface StepBranch {
  id: string;
  stepId: string;
  condition: string; // 'yes' or 'no'
  nextStepId: string | null;
  description: string;
}
