import { createContext, ReactNode, useContext, useState } from "react";
import Joyride, { Step } from "react-joyride";

const TourContext = createContext<{
  startTour: (steps: Step[]) => void;
  stopTour: () => void;
}>({
  startTour: () => {},
  stopTour: () => {},
});

export function useTour() {
  return useContext(TourContext);
}

export default function TourProvider(props: { children?: ReactNode }) {
  const [run, setRun] = useState<boolean>(false);
  const [steps, setSteps] = useState<Step[]>([]);

  function startTour(steps: Step[]) {
    setSteps(steps);
    setRun(true);
  }

  function stopTour() {
    setRun(false);
    setSteps([]);
  }

  return (
    <TourContext.Provider value={{ startTour, stopTour }}>
      {props.children}
      <Joyride steps={steps} run={run} disableScrollParentFix />
    </TourContext.Provider>
  );
}
