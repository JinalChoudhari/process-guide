import { useState } from "react";
import {
  CheckCircle2,
  GitBranch,
  ArrowRight,
  AlertCircle,
  RotateCcw,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { useProcessContext } from "../../context/ProcessContext";
import { ProcessStep } from "../../types/process";

interface ProcessViewerProps {
  processId: string;
}

type PathProgress = {
  [pathId: string]: number; // Maps path ID to current step index in that path, -1 means END reached
};

export function ProcessViewer({ processId }: ProcessViewerProps) {
  const {
    processes,
    steps: allSteps,
    branches: allBranches,
  } = useProcessContext();

  const process = processes.find((p) => p.id === processId);
  const steps = allSteps
    .filter((s) => s.processId === processId)
    .sort((a, b) => a.stepNumber - b.stepNumber);

  // Track progress for each path (YES and NO branches)
  const [pathProgress, setPathProgress] = useState<PathProgress>({ main: 0 });
  
  // Zoom state
  const [zoom, setZoom] = useState(100);

  const getBranchesByStepId = (stepId: string) => {
    return allBranches.filter((b) => b.stepId === stepId);
  };
  
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  const handleZoomReset = () => {
    setZoom(100);
  };

  if (!process || steps.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Process not found</p>
        </div>
      </div>
    );
  }

  const handleNextStep = (pathId: string, pathSteps: ProcessStep[], currentIndex: number) => {
    const currentStep = pathSteps[currentIndex];
    const nextIndex = currentIndex + 1;
    
    // Check if next step exists in the path array
    if (nextIndex >= pathSteps.length) {
      // Check if this leads to END
      let nextStepId: string | null | undefined;
      if (currentStep.nextStepId !== undefined) {
        nextStepId = currentStep.nextStepId;
      } else {
        const nextStep = steps.find(s => s.stepNumber === currentStep.stepNumber + 1);
        nextStepId = nextStep?.id;
      }
      
      if (nextStepId === null) {
        // Show end message by setting progress to -1
        setPathProgress(prev => ({
          ...prev,
          [pathId]: -1 // -1 indicates END reached
        }));
        return;
      }
    }
    
    setPathProgress(prev => ({
      ...prev,
      [pathId]: nextIndex
    }));
  };

  const handleDecisionClick = (pathId: string, condition: 'yes' | 'no', stepId: string) => {
    // Initialize both paths from this decision point
    const yesBranch = allBranches.find(b => b.stepId === stepId && b.condition === 'yes');
    const noBranch = allBranches.find(b => b.stepId === stepId && b.condition === 'no');

    setPathProgress(prev => ({
      ...prev,
      [`${pathId}-yes`]: 0,
      [`${pathId}-no`]: 0,
    }));
  };

  const resetProcess = () => {
    setPathProgress({ main: 0 });
  };

  // Build path from a starting step
  const buildPath = (startStepId: string | null | undefined, visitedIds = new Set<string>()): ProcessStep[] => {
    if (!startStepId) return [];
    
    const step = steps.find(s => s.id === startStepId);
    if (!step || visitedIds.has(step.id)) return [];
    
    visitedIds.add(step.id);
    
    const path: ProcessStep[] = [step];
    
    // Check if this step has a custom next step
    let nextStepId: string | null | undefined;
    
    if (step.nextStepId !== undefined) {
      nextStepId = step.nextStepId;
    } else {
      // Default: next sequential step
      const nextStep = steps.find(s => s.stepNumber === step.stepNumber + 1);
      nextStepId = nextStep?.id;
    }
    
    if (nextStepId) {
      path.push(...buildPath(nextStepId, visitedIds));
    }
    
    return path;
  };

  // Render a single step card
  const renderStepCard = (
    step: ProcessStep,
    pathId: string,
    currentIndex: number,
    isVisible: boolean,
    pathType: 'main' | 'yes' | 'no',
    pathSteps: ProcessStep[],
    depth: number = 0
  ) => {
    const branches = getBranchesByStepId(step.id);
    const isDecision = step.isDecision && branches.length > 0;
    const yesBranch = branches.find(b => b.condition === 'yes');
    const noBranch = branches.find(b => b.condition === 'no');

    const hasYesPath = pathProgress[`${pathId}-yes`] !== undefined;
    const hasNoPath = pathProgress[`${pathId}-no`] !== undefined;
    const bothPathsVisible = hasYesPath && hasNoPath;

    const borderColor = pathType === 'yes' 
      ? 'border-green-500' 
      : pathType === 'no' 
      ? 'border-red-500' 
      : 'border-blue-500';

    const bgColor = pathType === 'yes'
      ? 'bg-green-50'
      : pathType === 'no'
      ? 'bg-red-50'
      : 'bg-white';

    if (!isVisible) return null;

    return (
      <div key={`${pathId}-${step.id}`} className="mb-6 animate-fadeIn">
        <div className={`border-2 ${borderColor} ${bgColor} rounded-lg p-6 shadow-lg transition-all hover:shadow-xl`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 ${
                pathType === 'yes' ? 'bg-green-600' : pathType === 'no' ? 'bg-red-600' : 'bg-blue-600'
              } text-white rounded-full flex items-center justify-center font-semibold text-lg`}>
                {step.stepNumber}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {step.description}
              </p>

              {isDecision && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <GitBranch className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-700">
                    Decision Point - View both paths below
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Decision - Show buttons to view both paths */}
          {isDecision && !bothPathsVisible && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Click to view both decision paths simultaneously:
              </p>
              <button
                onClick={() => handleDecisionClick(pathId, 'yes', step.id)}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all shadow-md hover:shadow-lg"
              >
                View YES and NO Paths Side-by-Side
              </button>
            </div>
          )}

          {/* Regular step - Next button */}
          {!isDecision && (
            <div className="mt-6">
              <button
                onClick={() => handleNextStep(pathId, pathSteps, currentIndex)}
                className={`w-full px-6 py-3 ${
                  pathType === 'yes' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : pathType === 'no' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2`}
              >
                Next Step
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* If decision was clicked, show both YES and NO paths side-by-side */}
        {isDecision && bothPathsVisible && (
          <div className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* YES Path (Left) */}
              <div className="border-l-4 border-green-500 pl-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="px-4 py-2 bg-green-600 text-white rounded-md font-bold">
                    ✓ YES PATH
                  </div>
                  <div className="text-sm text-gray-600">
                    {yesBranch?.description || 'Yes option'}
                  </div>
                </div>
                {renderPath(`${pathId}-yes`, yesBranch?.nextStepId, 'yes', depth + 1)}
              </div>

              {/* NO Path (Right) */}
              <div className="border-l-4 border-red-500 pl-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="px-4 py-2 bg-red-600 text-white rounded-md font-bold">
                    ✗ NO PATH
                  </div>
                  <div className="text-sm text-gray-600">
                    {noBranch?.description || 'No option'}
                  </div>
                </div>
                {renderPath(`${pathId}-no`, noBranch?.nextStepId, 'no', depth + 1)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render a path of steps
  const renderPath = (
    pathId: string,
    startStepId: string | null | undefined,
    pathType: 'main' | 'yes' | 'no',
    depth: number = 0
  ) => {
    if (startStepId === null) {
      // End of process
      return (
        <div className="bg-gradient-to-br from-blue-50 to-green-50 border-2 border-gray-300 rounded-lg p-6 text-center animate-fadeIn">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h4 className="text-lg font-semibold text-gray-900 mb-1">End of Process</h4>
          <p className="text-sm text-gray-600">This path is complete.</p>
        </div>
      );
    }

    if (!startStepId) return null;

    const pathSteps = buildPath(startStepId);
    const currentProgress = pathProgress[pathId];

    // Check if END was reached
    if (currentProgress === -1) {
      return (
        <div className="bg-gradient-to-br from-blue-50 to-green-50 border-2 border-gray-300 rounded-lg p-6 text-center animate-fadeIn">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h4 className="text-lg font-semibold text-gray-900 mb-1">End of Process</h4>
          <p className="text-sm text-gray-600">This path is complete.</p>
        </div>
      );
    }

    if (pathSteps.length === 0) {
      return (
        <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 text-center text-gray-600">
          <p className="text-sm">No steps in this path</p>
        </div>
      );
    }

    return (
      <div>
        {pathSteps.map((step, index) => {
          const isVisible = index <= (currentProgress || 0);
          return renderStepCard(step, pathId, index, isVisible, pathType, pathSteps, depth);
        })}
      </div>
    );
  };

  const hasStarted = Object.keys(pathProgress).length > 1 || pathProgress.main > 0;

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
        {/* Process Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-3xl font-semibold text-gray-900 mb-2">
                {process.title}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {process.description}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {process.category}
                </span>
                <span className="text-sm text-gray-500">
                  Total Steps: {steps.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>How it works:</strong> Click "Next Step" to progress through regular steps. 
            At decision points, both YES and NO paths will appear side-by-side so you can explore both options simultaneously.
          </p>
        </div>

        {/* Process Flow */}
        <div className="bg-gray-50 rounded-lg p-6 min-h-[400px]">
          {steps.length > 0 && renderPath('main', steps[0].id, 'main', 0)}
        </div>

        {/* Reset Button */}
        {hasStarted && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={resetProcess}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-lg hover:shadow-xl"
            >
              <RotateCcw className="w-5 h-5" />
              Start Over
            </button>
          </div>
        )}
      </div>

      {/* Add CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
