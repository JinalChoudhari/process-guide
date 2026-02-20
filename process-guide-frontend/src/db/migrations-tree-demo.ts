import { ProcessStep, StepBranch } from '../types/process';
import * as DB from './database';

/**
 * Migration: Add nested decision steps to demonstrate tree structure
 * 
 * This creates a more complex workflow:
 * Step 1: Fill Application
 * Step 2: Check Eligibility (DECISION)
 *   YES → Step 3: Submit Documents (DECISION)
 *           YES → Step 4: Pay Fee
 *           NO → Step 5: Request Document Help (DECISION)
 *                  YES → Step 3 (loop back)
 *                  NO → END
 *   NO → END
 * Step 4: Pay Fee
 * Step 5: Request Document Help
 */

export function migrateToTreeDemo() {
  console.log('Starting tree demo migration...');

  // Get the sample process
  const process = DB.getProcessById('process-sample-1');
  if (!process) {
    console.error('Sample process not found');
    return;
  }

  // Define new steps
  const newSteps: ProcessStep[] = [
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
      isDecision: true, // Now a decision step
    },
    {
      id: 'step-sample-1-4',
      processId: 'process-sample-1',
      stepNumber: 4,
      title: 'Pay Application Fee',
      description: 'Complete the payment of application fee through online payment gateway (Debit/Credit card, Net Banking, or UPI).',
      isDecision: false,
      nextStepId: null, // Ends here
    },
    {
      id: 'step-sample-1-5',
      processId: 'process-sample-1',
      stepNumber: 5,
      title: 'Request Document Help',
      description: 'Contact the admission office for help with document requirements. They can guide you on what documents are needed.',
      isDecision: true,
    },
  ];

  // Define branches for the decision tree
  const newBranches: StepBranch[] = [
    // Step 2: Check Eligibility
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
      description: 'Student does not meet eligibility - Application ends',
    },
    
    // Step 3: Submit Documents (nested decision)
    {
      id: 'branch-step-sample-1-3-yes',
      stepId: 'step-sample-1-3',
      condition: 'yes',
      nextStepId: 'step-sample-1-4',
      description: 'All documents submitted successfully',
    },
    {
      id: 'branch-step-sample-1-3-no',
      stepId: 'step-sample-1-3',
      condition: 'no',
      nextStepId: 'step-sample-1-5',
      description: 'Documents incomplete or incorrect',
    },
    
    // Step 5: Request Document Help (nested decision)
    {
      id: 'branch-step-sample-1-5-yes',
      stepId: 'step-sample-1-5',
      condition: 'yes',
      nextStepId: 'step-sample-1-3',
      description: 'Try submitting documents again',
    },
    {
      id: 'branch-step-sample-1-5-no',
      stepId: 'step-sample-1-5',
      condition: 'no',
      nextStepId: null,
      description: 'Give up - Application ends',
    },
  ];

  // Delete all existing steps and branches for this process
  const allSteps = DB.getAllSteps();
  const filteredSteps = allSteps.filter(s => s.processId !== 'process-sample-1');
  
  const allBranches = DB.getAllBranches();
  const filteredBranches = allBranches.filter(b => {
    const step = allSteps.find(s => s.id === b.stepId);
    return !step || step.processId !== 'process-sample-1';
  });

  // Save new data
  localStorage.setItem('db_steps', JSON.stringify([...filteredSteps, ...newSteps]));
  localStorage.setItem('db_branches', JSON.stringify([...filteredBranches, ...newBranches]));

  console.log('✅ Tree demo migration completed!');
  console.log('Created 5 steps with nested decision tree structure');
  
  return {
    success: true,
    message: 'Successfully created nested decision tree demo',
  };
}
