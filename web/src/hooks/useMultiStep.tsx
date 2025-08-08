import { useState } from "react";

export type StepComponent<T> = ((props: T) => React.ReactNode) | (() => React.ReactNode);

export default function useMultiStep<T = void>(steps: StepComponent<T>[]) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    function next(): void {
        setCurrentStepIndex(i => {
            if (i >= steps.length - 1) return i;
            return i + 1;
        });
    }

    function back(): void {
        setCurrentStepIndex(i => {
            if (i <= 0) return i;
            return i - 1;
        });
    }

    function goTo(index: number): void {
        setCurrentStepIndex(index);
    }

    return {
        currentStepIndex,
        step: steps[currentStepIndex],
        steps,
        next,
        back,
        goTo,
    }
}