import { useState } from "react";
import {
  CheckCircle2,
  GitBranch,
  ArrowRight,
  Circle,
  AlertCircle,
} from "lucide-react";
import { useProcessContext } from "../../context/ProcessContext";
import { ProcessStep } from "../../types/process";

interface ProcessViewerProps {
  processId: string;
}

export function ProcessViewer({
  processId,
}: ProcessViewerProps) {
  const {
    processes,
    steps: allSteps,
    branches: allBranches,
  } = useProcessContext();

  const process = processes.find((p) => p.id === processId);
  const steps = allSteps
    .filter((s) => s.processId === processId)
    .sort((a, b) => a.stepNumber - b.stepNumber);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<
    Set<number>
  >(new Set());
  const [viewMode, setViewMode] = useState<
    "step-by-step" | "full-view"
  >("step-by-step");

  const getBranchesByStepId = (stepId: string) => {
    return allBranches.filter((b) => b.stepId === stepId);
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

  const currentStep = steps[currentStepIndex];
  const branches = currentStep
    ? getBranchesByStepId(currentStep.id)
    : [];

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCompletedSteps(
        new Set(completedSteps).add(currentStepIndex),
      );
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleDecision = (decision: "yes" | "no") => {
    const branch = branches.find(
      (b) => b.condition === decision,
    );
    if (branch && branch.nextStepId) {
      const nextStepIndex = steps.findIndex(
        (s) => s.id === branch.nextStepId,
      );
      if (nextStepIndex !== -1) {
        setCompletedSteps(
          new Set(completedSteps).add(currentStepIndex),
        );
        setCurrentStepIndex(nextStepIndex);
      }
    }
  };

  const resetProgress = () => {
    setCurrentStepIndex(0);
    setCompletedSteps(new Set());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Process Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-3xl font-semibold text-gray-900 mb-2">
              {process.title}
            </h2>
            <p className="text-gray-600 mb-4">
              {process.description}
            </p>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {process.category}
              </span>
              <span className="text-sm text-gray-600">
                {steps.length}{" "}
                {steps.length === 1 ? "Step" : "Steps"}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("step-by-step")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === "step-by-step"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Step-by-Step
            </button>
            <button
              onClick={() => setViewMode("full-view")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === "full-view"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Full View
            </button>
          </div>
        </div>
      </div>

      {viewMode === "step-by-step" ? (
        <>
          {/* Progress Bar */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress
              </span>
              <span className="text-sm text-gray-600">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* All Steps Up to Current */}
          <div className="space-y-6 mb-6">
            {steps
              .slice(0, currentStepIndex + 1)
              .map((step, index) => {
                const stepBranches = getBranchesByStepId(
                  step.id,
                );
                const isCurrentStep =
                  index === currentStepIndex;

                return (
                  <div
                    key={step.id}
                    className={`bg-white rounded-lg shadow p-8 transition-all ${
                      isCurrentStep
                        ? "ring-2 ring-blue-500"
                        : "opacity-75"
                    }`}
                  >
                    <div className="flex items-start gap-4 mb-6">
                      <div className="flex-shrink-0">
                        {isCurrentStep ? (
                          <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                            {step.stepNumber}
                          </div>
                        ) : (
                          <CheckCircle2 className="w-12 h-12 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-2xl font-semibold text-gray-900">
                            {step.title}
                          </h3>
                          {!isCurrentStep && (
                            <span className="text-sm text-green-600 font-medium">
                              ✓ Completed
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Decision Buttons - Only show for current step */}
                    {isCurrentStep &&
                      step.isDecision &&
                      stepBranches.length > 0 && (
                        <div className="mt-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-4">
                            <GitBranch className="w-5 h-5 text-yellow-700" />
                            <span className="font-semibold text-yellow-900">
                              Decision Point
                            </span>
                          </div>
                          <p className="text-yellow-800 mb-4">
                            Choose your path:
                          </p>
                          <div className="flex gap-4">
                            {stepBranches.map((branch) => (
                              <button
                                key={branch.id}
                                onClick={() =>
                                  handleDecision(
                                    branch.condition as
                                      | "yes"
                                      | "no",
                                  )
                                }
                                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                                  branch.condition === "yes"
                                    ? "bg-green-600 text-white hover:bg-green-700"
                                    : "bg-red-600 text-white hover:bg-red-700"
                                }`}
                              >
                                {branch.condition.toUpperCase()}
                                {branch.description && (
                                  <span className="block text-sm mt-1 opacity-90">
                                    {branch.description}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Show decision made for previous steps */}
                    {!isCurrentStep &&
                      step.isDecision &&
                      stepBranches.length > 0 && (
                        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <GitBranch className="w-4 h-4" />
                            <span className="font-medium">
                              Decision Point - Path chosen
                            </span>
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
          </div>

          {/* Navigation Buttons */}
          {currentStep && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePreviousStep}
                  disabled={currentStepIndex === 0}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <button
                  onClick={resetProgress}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Reset
                </button>

                {!currentStep.isDecision && (
                  <button
                    onClick={handleNextStep}
                    disabled={
                      currentStepIndex === steps.length - 1
                    }
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {currentStepIndex === steps.length - 1
                      ? "Complete"
                      : "Next Step"}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Full View Mode */
        <div className="bg-white rounded-lg shadow p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Complete Workflow
          </h3>
          <div className="space-y-4">
            {steps.map((step, index) => {
              const stepBranches = getBranchesByStepId(step.id);
              const isCompleted = completedSteps.has(index);

              return (
                <div key={step.id} className="relative">
                  <div
                    className={`border rounded-lg p-6 transition-all ${
                      index === currentStepIndex &&
                      viewMode === "step-by-step"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 className="w-8 h-8 text-green-600" />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center font-semibold">
                            {step.stepNumber}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {step.title}
                        </h4>
                        <p className="text-gray-600 text-sm">
                          {step.description}
                        </p>

                        {step.isDecision &&
                          stepBranches.length > 0 && (
                            <div className="mt-3 flex items-center gap-2">
                              <GitBranch className="w-4 h-4 text-yellow-600" />
                              <span className="text-sm font-medium text-yellow-700">
                                Decision Point
                              </span>
                            </div>
                          )}
                      </div>
                    </div>

                    {step.isDecision &&
                      stepBranches.length > 0 && (
                        <div className="mt-4 ml-12 space-y-2">
                          {stepBranches.map((branch) => {
                            const nextStep = steps.find(
                              (s) => s.id === branch.nextStepId,
                            );
                            return (
                              <div
                                key={branch.id}
                                className={`flex items-center gap-2 text-sm p-2 rounded ${
                                  branch.condition === "yes"
                                    ? "bg-green-50 text-green-800"
                                    : "bg-red-50 text-red-800"
                                }`}
                              >
                                <ArrowRight className="w-4 h-4" />
                                <span className="font-medium">
                                  {branch.condition.toUpperCase()}
                                  :
                                </span>
                                <span>
                                  {branch.description}
                                  {nextStep &&
                                    ` → ${nextStep.title}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center my-2">
                      <div className="w-0.5 h-6 bg-gray-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}