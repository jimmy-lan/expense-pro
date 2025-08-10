import React, { useMemo } from "react";
import { Logo } from "./Logo";
import { useBreakpoint } from "../hooks";

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
// Supports either `id` or `data-step-id` for flexibility.
function getElementStepId(element: React.ReactElement): string | undefined {
  const anyProps = element.props as Record<string, unknown>;
  const byStepId =
    typeof anyProps.id === "string" ? (anyProps.id as string) : undefined;
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
  const isMobile = useBreakpoint("sm");

  // Index children by step id for O(1) retrieval.
  const stepIdToChild = useMemo(() => {
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
    return map;
  }, [children]);

  const activeChild = stepIdToChild.get(currentStepId) ?? null;
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <div
      className={`flex flex-col pb-12 md:h-screen md:overflow-hidden bg-white md:grid md:grid-cols-5 md:pb-0 ${className}`}
    >
      <div className="px-4 pt-12 pb-10 mb-14 bg-primary md:bg-transparent md:absolute md:top-6 md:left-6 md:p-0 md:mb-0">
        <Logo
          iconSize={isMobile ? "2xl" : "lg"}
          textClassName={isMobile ? "text-2xl text-white" : ""}
          iconClassName={isMobile ? "text-white pr-1" : ""}
        />
      </div>

      {/* Left/progress column */}
      <div className="hidden md:block md:col-span-2 bg-secondary/10">
        <div className="h-full w-full px-6 py-10">
          <h3 className="text-sm font-semibold text-gray-700 mb-6">
            Your Progress:
          </h3>
          <ol className="space-y-4">
            {steps.map((step, idx) => {
              const isActive = step.id === currentStepId;
              const isComplete = currentIndex > idx;
              return (
                <li key={step.id} className="flex items-start">
                  <div
                    className={`mt-0.5 flex items-center justify-center h-6 w-6 rounded-full border-2 ${
                      isActive
                        ? "bg-secondary border-secondary text-white"
                        : isComplete
                        ? "border-secondary text-secondary"
                        : "border-secondary/40 text-secondary/40"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="ml-3">
                    <div
                      className={`text-sm ${
                        isActive
                          ? "font-semibold text-gray-900"
                          : isComplete
                          ? "text-gray-700"
                          : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Right/content column */}
      <div className="flex items-center justify-center p-6 pt-0 md:pt-6 md:p-10 md:overflow-y-auto md:h-screen md:col-span-3">
        <div className="w-full max-w-md">{activeChild}</div>
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
