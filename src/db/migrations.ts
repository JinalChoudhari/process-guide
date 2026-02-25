// Database Migration Scripts
import * as DB from './database';

/**
 * Migration: Remove Step 5 and update NO branch to end directly
 * This updates the sample College Admission Process
 */
export function migrateRemoveStep5(): boolean {
  try {
    const processId = 'process-sample-1';
    const step5Id = 'step-sample-1-5';
    const step2Id = 'step-sample-1-2';
    
    // Check if Step 5 exists
    const step5 = DB.getStepById(step5Id);
    if (!step5) {
      console.log('Step 5 does not exist, migration not needed');
      return false;
    }

    console.log('Starting migration: Removing Step 5...');

    // 1. Delete Step 5
    DB.deleteStep(step5Id);
    console.log('✓ Deleted Step 5');

    // 2. Update NO branch of Step 2 to point to null
    const branches = DB.getBranchesByStepId(step2Id);
    const noBranch = branches.find(b => b.condition === 'no');
    
    if (noBranch) {
      DB.updateBranch(noBranch.id, {
        nextStepId: null,
        description: 'Student does not meet eligibility criteria - Application ends here'
      });
      console.log('✓ Updated NO branch to end directly');
    }

    console.log('✅ Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

/**
 * Run all pending migrations
 */
export function runMigrations(): void {
  console.log('Running database migrations...');
  migrateRemoveStep5();
  console.log('All migrations completed.');
}
