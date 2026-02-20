import { Process, ProcessStep, StepBranch } from '../types/process';

export const mockProcesses: Process[] = [
  {
    id: '1',
    title: 'College Admission Process',
    description: 'Complete guide for new student admission procedure',
    category: 'Academic',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
  },
  {
    id: '2',
    title: 'Employee Onboarding',
    description: 'Step-by-step HR onboarding workflow for new employees',
    category: 'HR',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18',
  },
  {
    id: '3',
    title: 'IT Troubleshooting Guide',
    description: 'Common IT issues and their resolution steps',
    category: 'IT Support',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-25',
  },
  {
    id: '4',
    title: 'Customer Service Workflow',
    description: 'Standard operating procedure for handling customer queries',
    category: 'Customer Service',
    createdAt: '2024-01-12',
    updatedAt: '2024-01-22',
  },
];

export const mockSteps: ProcessStep[] = [
  // College Admission Process
  {
    id: 's1',
    processId: '1',
    stepNumber: 1,
    title: 'Check Eligibility',
    description: 'Verify if the student meets the minimum eligibility criteria (12th pass with 60% marks)',
    isDecision: true,
  },
  {
    id: 's2',
    processId: '1',
    stepNumber: 2,
    title: 'Fill Application Form',
    description: 'Complete the online application form with personal and academic details',
    isDecision: false,
  },
  {
    id: 's3',
    processId: '1',
    stepNumber: 3,
    title: 'Upload Documents',
    description: 'Upload required documents: 10th marksheet, 12th marksheet, ID proof, and photograph',
    isDecision: false,
  },
  {
    id: 's4',
    processId: '1',
    stepNumber: 4,
    title: 'Pay Application Fee',
    description: 'Pay the application fee of ₹500 through online payment gateway',
    isDecision: false,
  },
  {
    id: 's5',
    processId: '1',
    stepNumber: 5,
    title: 'Attend Entrance Test',
    description: 'Appear for the entrance examination on the scheduled date',
    isDecision: true,
  },
  {
    id: 's6',
    processId: '1',
    stepNumber: 6,
    title: 'Complete Admission',
    description: 'Submit original documents and complete the admission process',
    isDecision: false,
  },
  {
    id: 's7',
    processId: '1',
    stepNumber: 7,
    title: 'Application Rejected',
    description: 'Student does not meet eligibility criteria. Application cannot proceed.',
    isDecision: false,
  },
  {
    id: 's8',
    processId: '1',
    stepNumber: 8,
    title: 'Not Qualified',
    description: 'Student did not pass the entrance test. Better luck next time!',
    isDecision: false,
  },

  // Employee Onboarding
  {
    id: 's9',
    processId: '2',
    stepNumber: 1,
    title: 'Offer Letter Acceptance',
    description: 'Candidate accepts the offer letter and signs the employment agreement',
    isDecision: false,
  },
  {
    id: 's10',
    processId: '2',
    stepNumber: 2,
    title: 'Submit Documents',
    description: 'Submit educational certificates, experience letters, ID proof, and address proof',
    isDecision: false,
  },
  {
    id: 's11',
    processId: '2',
    stepNumber: 3,
    title: 'Background Verification',
    description: 'HR initiates background verification process',
    isDecision: true,
  },
  {
    id: 's12',
    processId: '2',
    stepNumber: 4,
    title: 'IT Setup',
    description: 'IT department sets up email, laptop, and access credentials',
    isDecision: false,
  },
  {
    id: 's13',
    processId: '2',
    stepNumber: 5,
    title: 'Orientation Program',
    description: 'Attend company orientation and training sessions',
    isDecision: false,
  },
  {
    id: 's14',
    processId: '2',
    stepNumber: 6,
    title: 'Verification Failed',
    description: 'Background verification failed. Offer rescinded.',
    isDecision: false,
  },

  // IT Troubleshooting
  {
    id: 's15',
    processId: '3',
    stepNumber: 1,
    title: 'Check Internet Connection',
    description: 'Verify if the device is connected to WiFi or ethernet',
    isDecision: true,
  },
  {
    id: 's16',
    processId: '3',
    stepNumber: 2,
    title: 'Restart Router',
    description: 'Power off the router, wait 30 seconds, and power it back on',
    isDecision: false,
  },
  {
    id: 's17',
    processId: '3',
    stepNumber: 3,
    title: 'Test Connection',
    description: 'Try accessing websites and check if connection is restored',
    isDecision: true,
  },
  {
    id: 's18',
    processId: '3',
    stepNumber: 4,
    title: 'Contact ISP',
    description: 'Contact your Internet Service Provider for further assistance',
    isDecision: false,
  },
  {
    id: 's19',
    processId: '3',
    stepNumber: 5,
    title: 'Connection Restored',
    description: 'Internet connection is working properly',
    isDecision: false,
  },
  {
    id: 's20',
    processId: '3',
    stepNumber: 6,
    title: 'Check Network Settings',
    description: 'Verify network adapter settings and IP configuration',
    isDecision: false,
  },
];

export const mockBranches: StepBranch[] = [
  // College Admission
  {
    id: 'b1',
    stepId: 's1',
    condition: 'yes',
    nextStepId: 's2',
    description: 'Student is eligible',
  },
  {
    id: 'b2',
    stepId: 's1',
    condition: 'no',
    nextStepId: 's7',
    description: 'Student is not eligible',
  },
  {
    id: 'b3',
    stepId: 's5',
    condition: 'yes',
    nextStepId: 's6',
    description: 'Passed entrance test',
  },
  {
    id: 'b4',
    stepId: 's5',
    condition: 'no',
    nextStepId: 's8',
    description: 'Failed entrance test',
  },

  // Employee Onboarding
  {
    id: 'b5',
    stepId: 's11',
    condition: 'yes',
    nextStepId: 's12',
    description: 'Verification successful',
  },
  {
    id: 'b6',
    stepId: 's11',
    condition: 'no',
    nextStepId: 's14',
    description: 'Verification failed',
  },

  // IT Troubleshooting
  {
    id: 'b7',
    stepId: 's15',
    condition: 'yes',
    nextStepId: 's16',
    description: 'Connected but not working',
  },
  {
    id: 'b8',
    stepId: 's15',
    condition: 'no',
    nextStepId: 's20',
    description: 'Not connected',
  },
  {
    id: 'b9',
    stepId: 's17',
    condition: 'yes',
    nextStepId: 's19',
    description: 'Connection working',
  },
  {
    id: 'b10',
    stepId: 's17',
    condition: 'no',
    nextStepId: 's18',
    description: 'Still not working',
  },
];

// Helper function to get process by ID
export const getProcessById = (id: string): Process | undefined => {
  return mockProcesses.find(p => p.id === id);
};

// Helper function to get steps for a process
export const getStepsByProcessId = (processId: string): ProcessStep[] => {
  return mockSteps
    .filter(s => s.processId === processId)
    .sort((a, b) => a.stepNumber - b.stepNumber);
};

// Helper function to get branches for a step
export const getBranchesByStepId = (stepId: string): StepBranch[] => {
  return mockBranches.filter(b => b.stepId === stepId);
};
