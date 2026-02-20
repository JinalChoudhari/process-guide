import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ArrowLeft, GitBranch, MoveUp, MoveDown, Edit2, FileText } from 'lucide-react';
import { ProcessStep, Process, StepBranch } from '../../types/process';
import { useProcessContext } from '../../context/ProcessContext';
import * as DB from '../../db/apiDatabase';

interface ProcessEditorProps {
  processId: string | null;
  onBack: () => void;
}

interface StepForm {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  notes: string;
  isDecision: boolean;
  nextStepNumber?: number | null; // For regular steps: which step comes next (null = end)
  yesDetails?: string;
  yesNextStep?: number | null; // null = end of process
  noDetails?: string;
  noNextStep?: number | null; // null = end of process
}

type EditorMode = 'initial' | 'steps' | 'edit-mode-select' | 'edit-steps' | 'add-delete-steps';

export function ProcessEditor({ processId, onBack }: ProcessEditorProps) {
  const { addProcess, updateProcess } = useProcessContext();
  const [editorMode, setEditorMode] = useState<EditorMode>('initial');
  const [processTitle, setProcessTitle] = useState('');
  const [processDescription, setProcessDescription] = useState('');
  const [processCategory, setProcessCategory] = useState('');
  const [numberOfSteps, setNumberOfSteps] = useState('');
  const [steps, setSteps] = useState<StepForm[]>([]);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  
  // Add/Delete Steps form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStepPosition, setNewStepPosition] = useState('');
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepDescription, setNewStepDescription] = useState('');
  const [newStepNotes, setNewStepNotes] = useState('');

  // Load existing process data for editing
  useEffect(() => {
    const loadProcessData = async () => {
      if (processId) {
        const result = await DB.getProcessById(processId);
        
        if (result && result.steps.length > 0) {
          const { process: existingProcess, steps: existingSteps, branches } = result;
          
          setProcessTitle(existingProcess.title);
          setProcessDescription(existingProcess.description);
          setProcessCategory(existingProcess.category);
          setNumberOfSteps(existingSteps.length.toString());

          // Convert database steps to form steps
          const formSteps: StepForm[] = existingSteps.map((step) => {
            const stepBranches = branches.filter(b => b.stepId === step.id);
            const yesBranch = stepBranches.find(b => b.condition === 'yes');
            const noBranch = stepBranches.find(b => b.condition === 'no');

            // Find the step numbers from the nextStepId
            const yesStepNumber = yesBranch?.nextStepId 
              ? existingSteps.find(s => s.id === yesBranch.nextStepId)?.stepNumber 
              : (yesBranch ? null : undefined);
            const noStepNumber = noBranch?.nextStepId 
              ? existingSteps.find(s => s.id === noBranch.nextStepId)?.stepNumber 
              : (noBranch ? null : undefined);

            // For regular steps, find nextStepNumber
            const nextStepNumber = step.nextStepId
              ? existingSteps.find(s => s.id === step.nextStepId)?.stepNumber
              : undefined;

            return {
              id: step.id,
              stepNumber: step.stepNumber,
              title: step.title,
              description: step.description,
              notes: '',
              isDecision: step.isDecision,
              nextStepNumber: nextStepNumber,
              yesDetails: yesBranch?.description || '',
              yesNextStep: yesStepNumber,
              noDetails: noBranch?.description || '',
              noNextStep: noStepNumber,
            };
          });

          setSteps(formSteps);
          setEditorMode('edit-mode-select');
        }
      }
    };
    
    loadProcessData();
  }, [processId]);

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numSteps = parseInt(numberOfSteps);
    if (numSteps > 0) {
      // Create empty step forms based on number
      const newSteps: StepForm[] = Array.from({ length: numSteps }, (_, i) => ({
        id: `step-${i + 1}`,
        stepNumber: i + 1,
        title: '',
        description: '',
        notes: '',
        isDecision: false,
      }));
      setSteps(newSteps);
      setEditorMode('steps');
    }
  };

  const addStep = () => {
    const newStep: StepForm = {
      id: `new-${Date.now()}`,
      stepNumber: steps.length + 1,
      title: '',
      description: '',
      notes: '',
      isDecision: false,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    if (confirm('Are you sure you want to delete this step?')) {
      const newSteps = steps.filter((_, i) => i !== index);
      // Renumber all steps
      newSteps.forEach((step, idx) => {
        step.stepNumber = idx + 1;
      });
      setSteps(newSteps);
    }
  };

  const updateStep = (index: number, field: keyof StepForm, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSave = () => {
    // Validation
    if (!processTitle || !processDescription || !processCategory) {
      alert('Please fill in all process details');
      return;
    }
    
    if (steps.length === 0) {
      alert('Please add at least one step');
      return;
    }

    // Validate all steps have titles and descriptions
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].title.trim() || !steps[i].description.trim()) {
        alert(`Please fill in title and details for Step ${i + 1}`);
        return;
      }
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const newProcessId = processId || `process-${Date.now()}`;

    // Create Process object
    const processData: Process = {
      id: newProcessId,
      title: processTitle,
      description: processDescription,
      category: processCategory,
      createdAt: currentDate,
      updatedAt: currentDate,
    };

    // Create ProcessStep objects
    const processSteps: ProcessStep[] = steps.map(step => {
      // Find nextStepId for regular steps
      let nextStepId: string | null | undefined = undefined;
      
      if (!step.isDecision && step.nextStepNumber !== undefined) {
        if (step.nextStepNumber === null) {
          // Explicitly set to end
          nextStepId = null;
        } else {
          // Find the target step by its step number
          const targetStepIndex = steps.findIndex(s => s.stepNumber === step.nextStepNumber);
          if (targetStepIndex !== -1) {
            const targetStepId = steps[targetStepIndex].id.startsWith('new-') 
              ? `step-${newProcessId}-${steps[targetStepIndex].stepNumber}` 
              : steps[targetStepIndex].id;
            nextStepId = targetStepId;
          }
        }
      }

      return {
        id: step.id.startsWith('new-') ? `step-${newProcessId}-${step.stepNumber}` : step.id,
        processId: newProcessId,
        stepNumber: step.stepNumber,
        title: step.title,
        description: step.description,
        isDecision: step.isDecision,
        nextStepId: nextStepId,
      };
    });

    // Create StepBranch objects for decision steps
    const processBranches: StepBranch[] = [];
    steps.forEach((step, index) => {
      if (step.isDecision) {
        const stepId = processSteps[index].id;
        
        if (step.yesDetails || step.yesNextStep) {
          // Parse step number from string to number
          const yesStepNumber = typeof step.yesNextStep === 'string' ? parseInt(step.yesNextStep) : step.yesNextStep;
          const yesTargetStep = yesStepNumber ? processSteps.find(s => s.stepNumber === yesStepNumber) : null;
          
          processBranches.push({
            id: `branch-${stepId}-yes`,
            stepId: stepId,
            condition: 'yes',
            nextStepId: yesTargetStep ? yesTargetStep.id : null,
            description: step.yesDetails || '',
          });
        }
        
        if (step.noDetails || step.noNextStep) {
          // Parse step number from string to number
          const noStepNumber = typeof step.noNextStep === 'string' ? parseInt(step.noNextStep) : step.noNextStep;
          const noTargetStep = noStepNumber ? processSteps.find(s => s.stepNumber === noStepNumber) : null;
          
          processBranches.push({
            id: `branch-${stepId}-no`,
            stepId: stepId,
            condition: 'no',
            nextStepId: noTargetStep ? noTargetStep.id : null,
            description: step.noDetails || '',
          });
        }
      }
    });

    // Save to context
    const saveProcess = async () => {
      if (processId) {
        await updateProcess(processId, processData, processSteps, processBranches);
        alert('Process updated successfully!');
      } else {
        await addProcess(processData, processSteps, processBranches);
        alert('Process created successfully!');
      }
      onBack();
    };
    
    saveProcess();
  };

  // Initial Form - Process Details
  if (editorMode === 'initial') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Create New Process</h2>
          
          <form onSubmit={handleInitialSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Process Title *
              </label>
              <input
                type="text"
                value={processTitle}
                onChange={(e) => setProcessTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., College Admission Process"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description of the Process *
              </label>
              <textarea
                value={processDescription}
                onChange={(e) => setProcessDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                placeholder="Brief description of what this process covers"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <input
                type="text"
                value={processCategory}
                onChange={(e) => setProcessCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Academic, HR, IT Support"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Steps in the Process *
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={numberOfSteps}
                onChange={(e) => setNumberOfSteps(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter number of steps (e.g., 5)"
                required
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Continue to Steps
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Edit Mode Selection (for existing processes)
  if (editorMode === 'edit-mode-select') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Edit Process</h2>
          <p className="text-gray-600 mb-8">{processTitle}</p>
          
          <div className="space-y-4">
            <button
              onClick={() => setEditorMode('edit-steps')}
              className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Edit2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Edit Details at Any Step</h3>
                  <p className="text-sm text-gray-600">
                    Modify the title, description, notes, or decision paths of existing steps
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setEditorMode('add-delete-steps')}
              className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Add or Delete Steps</h3>
                  <p className="text-sm text-gray-600">
                    Add new steps to the process or remove existing steps
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Steps Editor (for both new processes and edit details mode)
  if (editorMode === 'steps' || editorMode === 'edit-steps') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => {
            if (processId) {
              setEditorMode('edit-mode-select');
            } else {
              onBack();
            }
          }}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          {processId ? 'Back to Edit Options' : 'Back to Dashboard'}
        </button>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {editorMode === 'edit-steps' ? 'Edit Step Details' : 'Define Process Steps'}
          </h2>
          <p className="text-gray-600">{processTitle}</p>
        </div>

        <div className="space-y-6 mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-semibold">
                    {step.stepNumber}
                  </span>
                  <h3 className="font-semibold text-gray-900">Step {step.stepNumber}</h3>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Step Title *
                  </label>
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => updateStep(index, 'title', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Fill Application Form"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Step Details *
                  </label>
                  <textarea
                    value={step.description}
                    onChange={(e) => updateStep(index, 'description', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                    placeholder="Detailed description of what needs to be done in this step"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={step.notes}
                    onChange={(e) => updateStep(index, 'notes', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
                    placeholder="Additional notes, tips, or important information"
                  />
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id={`decision-${step.id}`}
                      checked={step.isDecision}
                      onChange={(e) => updateStep(index, 'isDecision', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={`decision-${step.id}`} className="font-medium text-gray-900 flex items-center gap-2">
                      <GitBranch className="w-5 h-5" />
                      This step has deviation (Yes/No branching)
                    </label>
                  </div>

                  {/* Regular Step - Next Step Selector */}
                  {!step.isDecision && (
                    <div className="ml-7 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-3">Step Navigation</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Go to Next Step
                        </label>
                        <select
                          value={step.nextStepNumber === null ? 'end' : step.nextStepNumber || ''}
                          onChange={(e) => {
                            const value = e.target.value === 'end' ? null : parseInt(e.target.value);
                            updateStep(index, 'nextStepNumber', value);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Select next step...</option>
                          {steps.map((s) => (
                            <option key={s.id} value={s.stepNumber}>
                              Step {s.stepNumber}: {s.title || 'Untitled'}
                            </option>
                          ))}
                          <option value="end">🏁 End of Process</option>
                        </select>
                        <p className="text-xs text-gray-600 mt-2">
                          Choose which step to display after this one. Leave empty to go to next numeric step.
                        </p>
                      </div>
                    </div>
                  )}

                  {step.isDecision && (
                    <div className="ml-7 p-5 bg-gray-50 rounded-lg space-y-5">
                      {/* YES Path */}
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                          <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">YES</span>
                          If Yes Condition
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Details for YES path
                            </label>
                            <input
                              type="text"
                              value={step.yesDetails || ''}
                              onChange={(e) => updateStep(index, 'yesDetails', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              placeholder="e.g., Student is eligible"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Next Step After YES
                            </label>
                            <select
                              value={step.yesNextStep === null ? 'end' : step.yesNextStep || ''}
                              onChange={(e) => {
                                const value = e.target.value === 'end' ? null : parseInt(e.target.value);
                                updateStep(index, 'yesNextStep', value);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                              <option value="">Select next step...</option>
                              {steps.map((s) => (
                                <option key={s.id} value={s.stepNumber}>
                                  Step {s.stepNumber}: {s.title || 'Untitled'}
                                </option>
                              ))}
                              <option value="end">🏁 End of Process</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* NO Path */}
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-medium text-red-900 mb-3 flex items-center gap-2">
                          <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">NO</span>
                          If No Condition
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Details for NO path
                            </label>
                            <input
                              type="text"
                              value={step.noDetails || ''}
                              onChange={(e) => updateStep(index, 'noDetails', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              placeholder="e.g., Student is not eligible"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Next Step After NO
                            </label>
                            <select
                              value={step.noNextStep === null ? 'end' : step.noNextStep || ''}
                              onChange={(e) => {
                                const value = e.target.value === 'end' ? null : parseInt(e.target.value);
                                updateStep(index, 'noNextStep', value);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                              <option value="">Select next step...</option>
                              {steps.map((s) => (
                                <option key={s.id} value={s.stepNumber}>
                                  Step {s.stepNumber}: {s.title || 'Untitled'}
                                </option>
                              ))}
                              <option value="end">🏁 End of Process</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            onClick={() => {
              if (processId) {
                setEditorMode('edit-mode-select');
              } else {
                onBack();
              }
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Save className="w-5 h-5" />
            Save Process
          </button>
        </div>
      </div>
    );
  }

  // Add/Delete Steps Mode
  if (editorMode === 'add-delete-steps') {
    const handleAddStepAtPosition = () => {
      const position = parseInt(newStepPosition);
      
      if (isNaN(position) || position < 1 || position > steps.length + 1) {
        alert(`Please enter a valid position between 1 and ${steps.length + 1}`);
        return;
      }

      if (!newStepTitle.trim() || !newStepDescription.trim()) {
        alert('Please fill in step title and details');
        return;
      }

      const newStep: StepForm = {
        id: `new-${Date.now()}`,
        stepNumber: position,
        title: newStepTitle,
        description: newStepDescription,
        notes: newStepNotes,
        isDecision: false,
      };

      // Insert at position and renumber
      const newSteps = [...steps];
      newSteps.splice(position - 1, 0, newStep);
      
      // Renumber all steps
      newSteps.forEach((step, idx) => {
        step.stepNumber = idx + 1;
      });

      setSteps(newSteps);
      
      // Reset form
      setNewStepPosition('');
      setNewStepTitle('');
      setNewStepDescription('');
      setNewStepNotes('');
      setShowAddForm(false);
      
      alert(`Step added at position ${position}. All subsequent steps have been moved forward.`);
    };

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => setEditorMode('edit-mode-select')}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Edit Options
        </button>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Add or Delete Steps</h2>
              <p className="text-gray-600">{processTitle}</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {showAddForm ? 'Cancel' : 'Add New Step'}
            </button>
          </div>
        </div>

        {/* Add Step Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Step</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insert at Position (Step Number) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={steps.length + 1}
                  value={newStepPosition}
                  onChange={(e) => setNewStepPosition(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Enter position (1 to ${steps.length + 1})`}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current steps will shift forward from this position
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Step Title *
                </label>
                <input
                  type="text"
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Document Verification"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Step Details *
                </label>
                <textarea
                  value={newStepDescription}
                  onChange={(e) => setNewStepDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                  placeholder="Detailed description of the step"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={newStepNotes}
                  onChange={(e) => setNewStepNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
                  placeholder="Additional notes or tips"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewStepPosition('');
                    setNewStepTitle('');
                    setNewStepDescription('');
                    setNewStepNotes('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStepAtPosition}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Insert Step
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Steps List */}
        <div className="space-y-4 mb-6">
          {steps.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">No steps available. Add your first step above.</p>
            </div>
          ) : (
            steps.map((step, index) => (
              <div key={step.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-semibold">
                      {step.stepNumber}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {step.title || `Step ${step.stepNumber}`}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {step.description || 'No description'}
                      </p>
                      {step.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          Note: {step.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeStep(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Step"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            onClick={() => setEditorMode('edit-mode-select')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Done
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  return null;
}