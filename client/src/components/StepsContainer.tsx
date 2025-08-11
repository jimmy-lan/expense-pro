import React, { useMemo } from "react";
import { AppNavbar } from "./AppNavbar";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { Button } from "./ui/Button";

export type StepDefinition = {
  id: string;
  title: string;
};

interface StepsContainerProps {
  steps: StepDefinition[];
  currentStepId: string;
  children: React.ReactNode;
  className?: string;
}

// Utility to extract a step id from arbitrary ReactElement props.
// Supports either `stepId` or `data-step-id` for flexibility.
function getElementStepId(element: React.ReactElement): string | undefined {
  const anyProps = element.props as Record<string, unknown>;
  const byStepId =
    typeof anyProps.stepId === "string"
      ? (anyProps.stepId as string)
      : undefined;
  const byDataAttr =
    typeof anyProps["data-step-id"] === "string"
      ? (anyProps["data-step-id"] as string)
      : undefined;
  return byStepId ?? byDataAttr;
}

const StepsContainer: React.FC<StepsContainerProps> = ({
  steps,
  currentStepId,
  children,
  className = "",
}) => {
  const navigate = useNavigate();
  // Index children by step id for O(1) retrieval, and keep a flat array for fallback
  const { stepIdToChild, childrenArray } = useMemo(() => {
    const map = new Map<string, React.ReactNode>();
    const array = React.Children.toArray(children);
    for (const child of array) {
      if (React.isValidElement(child)) {
        const id = getElementStepId(child);
        if (id) {
          map.set(id, child);
        }
      }
    }
    return { stepIdToChild: map, childrenArray: array };
  }, [children]);

  const activeChild = (stepIdToChild.get(currentStepId) ??
    childrenArray[0] ??
    null) as React.ReactNode;
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <div className={`min-h-screen bg-white ${className}`}>
      <AppNavbar />

      {/* Desktop: responsive sidebar + content; Mobile: content only */}
      <div className="md:flex md:min-h-[calc(100vh-64px)]">
        {/* Left/progress column (desktop only) */}
        <aside className="hidden md:block bg-secondary/10 md:w-64 lg:w-72 xl:w-80 2xl:w-96 shrink-0">
          <div className="px-6 py-10">
            {/* Back link */}
            <Button
              size="md"
              variant="text"
              color="primary"
              className="text-left flex items-center justify-start mb-6 px-2"
              onClick={() => navigate("/my")}
            >
              <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
              Back
            </Button>

            {/* Progress box */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-800 mb-6">
                Your Progress
              </h3>
              <ol className="relative">
                {steps.map((step, idx) => {
                  const isActive = step.id === currentStepId;
                  const isComplete = currentIndex > idx;
                  const isLast = idx === steps.length - 1;
                  return (
                    <li
                      key={step.id}
                      className="relative pl-12 pb-6 last:pb-0 min-h-7"
                    >
                      {/* connector line */}
                      {!isLast && (
                        <span
                          className={`absolute left-3.5 top-7 h-[calc(100%-1.25rem)] w-px ${
                            isComplete ? "bg-secondary" : "bg-gray-300"
                          }`}
                        ></span>
                      )}
                      {/* index bullet */}
                      <span
                        className={`absolute left-0 top-1 inline-grid h-7 w-7 place-items-center rounded-full border-2 text-sm ${
                          isActive
                            ? "bg-secondary border-secondary text-white"
                            : isComplete
                            ? "border-secondary text-secondary"
                            : "border-gray-300 text-gray-400"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div
                        className={`text-sm leading-7 ${
                          isActive
                            ? "font-semibold text-gray-900"
                            : "text-gray-700"
                        }`}
                      >
                        {step.title}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </aside>

        {/* Right/content column - top aligned */}
        <main className="flex-1 p-6 md:p-10 md:h-[calc(100vh-64px)] md:overflow-y-auto">
          <div className="w-full max-w-xl mx-auto">{activeChild}</div>
        </main>
      </div>
    </div>
  );
};

export { StepsContainer };

// Helper component for ergonomics
export const Step: React.FC<
  {
    stepId: string;
    children: React.ReactNode;
  } & React.HTMLAttributes<HTMLDivElement>
> = ({ stepId, children, ...props }) => {
  return (
    <div data-step-id={stepId} {...props}>
      {children}
    </div>
  );
};
