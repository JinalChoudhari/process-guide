import { ArrowLeft, GitBranch, ArrowRight, CheckCircle, AlertCircle, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useProcessContext } from '../../context/ProcessContext';
import { useState } from 'react';

interface FullProcessViewProps {
  processId: string;
  onBack: () => void;
}

export function FullProcessView({ processId, onBack }: FullProcessViewProps) {
  const { processes, steps: allSteps, branches: allBranches } = useProcessContext();

  // Zoom state
  const [zoom, setZoom] = useState(100);

  const process = processes.find(p => p.id === processId);
  const steps = allSteps
    .filter(s => s.processId === processId)
    .sort((a, b) => a.stepNumber - b.stepNumber);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  const handleZoomReset = () => {
    setZoom(100);
  };

  if (!process) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Process not found</p>
        </div>
      </div>
    );
  }

  const getBranchesByStepId = (stepId: string) => {
    return allBranches.filter(b => b.stepId === stepId);
  };

  const getStepById = (stepId: string | null | undefined) => {
    if (!stepId) return null;
    return steps.find(s => s.id === stepId);
  };

  const getNextStepInfo = (step: typeof steps[0]) => {
    const branches = getBranchesByStepId(step.id);
    
    if (step.isDecision && branches.length > 0) {
      return { type: 'decision', branches };
    } else if (step.nextStepId !== undefined) {
      if (step.nextStepId === null) {
        return { type: 'end', nextStep: null };
      } else {
        return { type: 'custom', nextStep: getStepById(step.nextStepId) };
      }
    } else {
      // Default: next numeric step
      return { type: 'sequential', nextStep: steps.find(s => s.stepNumber === step.stepNumber + 1) };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Zoom Controls - Sticky Position */}
      <div className="sticky top-4 z-50 flex justify-end mb-4">
        <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg p-2 flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5 text-gray-700" />
          </button>
          
          <button
            onClick={handleZoomReset}
            className="px-3 py-1 hover:bg-gray-100 rounded transition-colors"
            title="Reset Zoom"
          >
            <span className="text-sm font-semibold text-gray-700">{zoom}%</span>
          </button>
          
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5 text-gray-700" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          <button
            onClick={handleZoomReset}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Fit to Screen"
          >
            <Maximize2 className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Zoomable Content Wrapper */}
      <div 
        style={{ 
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
          transition: 'transform 0.2s ease-out'
        }}
      >
        {/* Header */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Process Info Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-8 mb-8 border border-blue-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{process.title}</h1>
              <p className="text-lg text-gray-700 mb-4">{process.description}</p>
              <div className="flex items-center gap-4">
                <span className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium">
                  {process.category}
                </span>
                <span className="text-sm text-gray-600">
                  Total Steps: <strong className="text-gray-900">{steps.length}</strong>
                </span>
                <span className="text-sm text-gray-600">
                  Decisions: <strong className="text-gray-900">{steps.filter(s => s.isDecision).length}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Process Steps</h2>

          {steps.map((step, index) => {
            const nextInfo = getNextStepInfo(step);
            const isDecision = step.isDecision;

            return (
              <div
                key={step.id}
                className="bg-white rounded-lg shadow-md border-2 border-gray-200 overflow-hidden"
              >
                {/* Step Header */}
                <div className={`p-6 ${isDecision ? 'bg-yellow-50 border-b-2 border-yellow-200' : 'bg-blue-50 border-b-2 border-blue-200'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      isDecision ? 'bg-yellow-500' : 'bg-blue-600'
                    }`}>
                      {step.stepNumber}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                        {isDecision && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-semibold">
                            <GitBranch className="w-3 h-3" />
                            DECISION
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </div>

                {/* Step Body */}
                <div className="p-6">
                  {/* Decision Branches */}
                  {nextInfo.type === 'decision' && nextInfo.branches && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <GitBranch className="w-5 h-5 text-yellow-600" />
                        Decision Paths:
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {nextInfo.branches.map((branch) => {
                          const targetStep = getStepById(branch.nextStepId);
                          const isYes = branch.condition === 'yes';

                          return (
                            <div
                              key={branch.id}
                              className={`p-4 rounded-lg border-2 ${
                                isYes 
                                  ? 'bg-green-50 border-green-300' 
                                  : 'bg-red-50 border-red-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-3 py-1 rounded-md text-white text-sm font-bold ${
                                  isYes ? 'bg-green-600' : 'bg-red-600'
                                }`}>
                                  {branch.condition.toUpperCase()}
                                </span>
                                <ArrowRight className="w-4 h-4 text-gray-500" />
                              </div>
                              
                              <p className={`text-sm font-medium mb-2 ${
                                isYes ? 'text-green-900' : 'text-red-900'
                              }`}>
                                {branch.description}
                              </p>

                              {targetStep ? (
                                <div className="mt-3 p-2 bg-white rounded border border-gray-200">
                                  <p className="text-xs text-gray-600 mb-1">Next Step:</p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    Step {targetStep.stepNumber}: {targetStep.title}
                                  </p>
                                </div>
                              ) : (
                                <div className="mt-3 p-2 bg-gray-100 rounded border border-gray-300">
                                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    End of Process
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Regular Step Next */}
                  {nextInfo.type === 'custom' && nextInfo.nextStep && (
                    <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                      <div className="flex items-center gap-3">
                        <ArrowRight className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-blue-800 font-medium mb-1">Custom Connection:</p>
                          <p className="text-base font-semibold text-blue-900">
                            → Step {nextInfo.nextStep.stepNumber}: {nextInfo.nextStep.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {nextInfo.type === 'sequential' && nextInfo.nextStep && (
                    <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded">
                      <div className="flex items-center gap-3">
                        <ArrowRight className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm text-gray-600 font-medium mb-1">Next Step:</p>
                          <p className="text-base font-semibold text-gray-900">
                            → Step {nextInfo.nextStep.stepNumber}: {nextInfo.nextStep.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {nextInfo.type === 'end' && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-600 p-4 rounded">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-base font-semibold text-green-900">
                            Process Ends Here
                          </p>
                          <p className="text-sm text-green-700">This is the final step of the process.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {nextInfo.type === 'sequential' && !nextInfo.nextStep && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-600 p-4 rounded">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-base font-semibold text-green-900">
                            Process Ends Here
                          </p>
                          <p className="text-sm text-green-700">This is the last step (no more steps after this).</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Process Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Total Steps</p>
              <p className="text-2xl font-bold text-blue-600">{steps.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Decision Points</p>
              <p className="text-2xl font-bold text-yellow-600">{steps.filter(s => s.isDecision).length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Regular Steps</p>
              <p className="text-2xl font-bold text-green-600">{steps.filter(s => !s.isDecision).length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}