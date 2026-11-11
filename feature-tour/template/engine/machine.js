// Pure step state machine. Knows nothing about the DOM.
// A step moves through phases in this order: do (hands-on tasks), predict,
// fill (the "fill the rest" button), done. Phases a step does not use are skipped.

export function phasesFor(step) {
  const phases = [];
  if (step.tasks && step.tasks.length > 0) phases.push('do');
  if (step.predict) phases.push('predict');
  if (step.fill) phases.push('fill');
  phases.push('done');
  return phases;
}

export function createMachine(steps) {
  let stepIndex = 0;
  let phaseIndex = 0;
  let taskIndex = 0;
  let finished = 0;
  const predictions = {};

  const step = () => steps[stepIndex];
  const phases = () => phasesFor(step());
  const phase = () => (stepIndex >= steps.length ? 'complete' : phases()[phaseIndex]);
  const advancePhase = () => {
    phaseIndex += 1;
  };

  return {
    state() {
      return { stepIndex, phase: phase(), taskIndex, predictions: { ...predictions } };
    },
    completeTask(taskId) {
      if (phase() !== 'do') return false;
      const current = step().tasks[taskIndex];
      if (!current || current.id !== taskId) return false;
      taskIndex += 1;
      if (taskIndex >= step().tasks.length) advancePhase();
      return true;
    },
    answerPredict(optionIndex) {
      if (phase() !== 'predict') return null;
      const right = optionIndex === step().predict.answer;
      predictions[step().id] = right;
      advancePhase();
      return right;
    },
    fill() {
      if (phase() !== 'fill') return false;
      advancePhase();
      return true;
    },
    next() {
      if (phase() !== 'done') return false;
      finished += 1;
      stepIndex += 1;
      phaseIndex = 0;
      taskIndex = 0;
      return true;
    },
    progress() {
      return { finished, total: steps.length, complete: stepIndex >= steps.length };
    },
  };
}
