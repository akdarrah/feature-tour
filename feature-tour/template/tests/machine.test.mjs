import { test } from 'node:test';
import assert from 'node:assert/strict';
import { phasesFor, createMachine } from '../engine/machine.js';

const task = (id) => ({ id, instruction: id, target: id, kind: 'click' });
const predict = { question: 'q', options: ['a', 'b'], answer: 1, why: 'w', facts: [] };
const fill = { label: 'Fill', apply() {} };

test('phases follow the order do, predict, fill, done', () => {
  assert.deepEqual(phasesFor({ tasks: [task('a')], predict, fill }), ['do', 'predict', 'fill', 'done']);
  assert.deepEqual(phasesFor({ tasks: [task('a')] }), ['do', 'done']);
  assert.deepEqual(phasesFor({ tasks: [], fill }), ['fill', 'done']);
});

test('tasks must be completed in order', () => {
  const machine = createMachine([{ id: 's1', tasks: [task('a'), task('b')] }]);
  assert.equal(machine.completeTask('b'), false, 'b is not the current task');
  assert.equal(machine.state().phase, 'do');
  assert.equal(machine.completeTask('a'), true);
  assert.equal(machine.state().taskIndex, 1);
  assert.equal(machine.completeTask('b'), true);
  assert.equal(machine.state().phase, 'done');
});

test('predict records whether the first answer was right and then moves on', () => {
  const machine = createMachine([{ id: 's1', tasks: [task('a')], predict, fill }]);
  machine.completeTask('a');
  assert.equal(machine.state().phase, 'predict');
  assert.equal(machine.answerPredict(0), false);
  assert.equal(machine.state().phase, 'fill');
  assert.deepEqual(machine.state().predictions, { s1: false });
});

test('next is refused until the step is done, then advances', () => {
  const machine = createMachine([
    { id: 's1', tasks: [task('a')], fill },
    { id: 's2', tasks: [task('b')] },
  ]);
  assert.equal(machine.next(), false);
  machine.completeTask('a');
  assert.equal(machine.next(), false, 'fill not pressed yet');
  machine.fill();
  assert.equal(machine.state().phase, 'done');
  assert.equal(machine.next(), true);
  assert.equal(machine.state().stepIndex, 1);
  assert.equal(machine.state().phase, 'do');
});

test('progress counts finished steps and reports the end', () => {
  const machine = createMachine([{ id: 's1', tasks: [task('a')] }]);
  assert.deepEqual(machine.progress(), { finished: 0, total: 1, complete: false });
  machine.completeTask('a');
  machine.next();
  assert.deepEqual(machine.progress(), { finished: 1, total: 1, complete: true });
});
