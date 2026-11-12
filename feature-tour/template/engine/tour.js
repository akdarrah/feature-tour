// The tour runner: coach panel, device frame, task checking, predict cards,
// the "fill the rest" button, the end quiz and the results screen.
// Content packs supply steps, screens, facts and state; this file stays generic.

import { h, clear } from './dom.js';
import { createMachine } from './machine.js';
import { createClock } from './clock.js';
import { browserFrame, phoneFrame, tabletFrame } from './frames.js';

const RESULTS_KEY = 'tour-results';
const FRAMES = { browser: browserFrame, phone: phoneFrame, tablet: tabletFrame };

const normalize = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
const accepts = (task, value) =>
  [].concat(task.accept).some((expected) => normalize(expected) === normalize(value));
// Options are shown in a shuffled but stable order, so the right answer is not
// always in the same place. The seed is the question text.
function displayOrder(question) {
  let seed = 0;
  for (const char of question.question) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  const order = question.options.map((_, index) => index);
  for (let i = order.length - 1; i > 0; i -= 1) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const j = seed % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

const reducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function readResults() {
  try {
    return JSON.parse(localStorage.getItem(RESULTS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveResult(id, result) {
  try {
    const all = readResults();
    all[id] = result;
    localStorage.setItem(RESULTS_KEY, JSON.stringify(all));
  } catch {
    // Storage can be unavailable (private window, file:// in some browsers). The tour still works.
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = h('textarea', { style: { position: 'fixed', opacity: '0' } }, text);
    document.body.append(area);
    area.select();
    const ok = document.execCommand && document.execCommand('copy');
    area.remove();
    return Boolean(ok);
  }
}

/**
 * @param {object} options
 * @param {HTMLElement} options.mount
 * @param {string} options.id            stable id, used to store results
 * @param {string} options.title
 * @param {string} options.banner        text for the fixed strip at the top
 * @param {'browser'|'phone'|'tablet'} options.frame
 * @param {object[]} options.steps       see the Step typedef in the plan
 * @param {object[]} options.quiz
 * @param {Record<string, {text: string, source?: string}>} options.facts  source is shown under the rule when present
 * @param {() => object} options.makeState
 * @param {Record<string, {render: Function, address?: Function}>} options.screens
 * @param {Record<string, Function>} [options.controls]  tour controls, clickable any time via data-tour-free
 * @param {string} options.startTime     ISO time the simulation clock starts at
 * @param {() => void} options.onExit
 */
export function runTour(options) {
  const { mount, steps, facts, screens, controls = {} } = options;
  const machine = createMachine(steps);
  const clock = createClock(options.startTime);
  const state = options.makeState();
  state.form = state.form || {};
  const ctx = { clock, state };
  const startedAt = Date.now();
  const frame = FRAMES[options.frame]();
  let pendingPredict = null;
  let animateNextRender = false;
  let lastRowKeys = new Set();

  clear(mount);
  const coach = h('aside', { class: 'tour-coach' });
  const stage = h('main', { class: 'tour-stage' }, frame.root);
  const body = h('div', { class: 'tour-body' }, coach, stage);
  mount.append(h('div', { class: 'tour-root' }, h('div', { class: 'tour-banner' }, options.banner), body));

  const currentStep = () => steps[machine.state().stepIndex];
  const currentTask = () => {
    const { phase, taskIndex } = machine.state();
    return phase === 'do' ? currentStep().tasks[taskIndex] : null;
  };

  function enterStep() {
    const step = currentStep();
    if (!step) return;
    if (step.clock) clock.set(step.clock);
    if (step.enter) step.enter(state, ctx);
  }

  // ---------- screen ----------

  function screenKey() {
    const step = currentStep();
    if (!step) return null;
    return typeof step.screen === 'function' ? step.screen(state, ctx) : step.screen;
  }

  function renderScreen() {
    const key = screenKey();
    const def = screens[key];
    if (!def) throw new Error(`No screen registered for "${key}"`);
    const previousKeys = lastRowKeys;
    clear(frame.screen);
    frame.screen.append(def.render(state, ctx));
    frame.setTime(clock.format('time'));
    frame.setAddress(def.address ? def.address(state, ctx) : '');
    frame.fit();

    const rows = [...frame.screen.querySelectorAll('[data-row]')];
    lastRowKeys = new Set(rows.map((row) => row.dataset.row));
    if (animateNextRender && !reducedMotion()) {
      rows
        .filter((row) => !previousKeys.has(row.dataset.row))
        .forEach((row, index) => {
          row.classList.add('tour-enter');
          row.style.animationDelay = `${Math.min(index, 12) * 150}ms`;
        });
    }
    animateNextRender = false;
    decorate();
  }

  function decorate() {
    const task = currentTask();
    const target = task ? frame.screen.querySelector(`[data-tour="${task.target}"]`) : null;
    for (const control of frame.screen.querySelectorAll('input, textarea, select')) {
      const allowed = target && (control === target || target.contains(control));
      if (control.tagName === 'SELECT') control.dataset.locked = allowed ? '' : 'yes';
      else control.readOnly = !allowed;
      if (!allowed) control.tabIndex = -1;
    }
    if (!target) return;
    target.classList.add('tour-target');
    if (!target.matches('button, input, select, textarea, a, [tabindex]')) target.tabIndex = 0;
    target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const focusable = target.matches('input, select, textarea') ? target : target.querySelector('input, select, textarea') || target;
    focusable.focus({ preventScroll: true });
  }

  // ---------- interaction ----------

  function completeTask(task, value) {
    if (task.kind !== 'click') state.form[task.target] = value;
    if (task.apply) task.apply(state, ctx, value);
    machine.completeTask(task.id);
    renderAll();
  }

  function runControl(name) {
    const control = controls[name];
    if (!control) return;
    control(state, ctx);
    renderAll();
  }

  function block(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  frame.screen.addEventListener(
    'click',
    (event) => {
      const free = event.target.closest('[data-tour-free]');
      if (free) {
        block(event);
        runControl(free.dataset.tourFree);
        return;
      }
      const task = currentTask();
      const target = task && event.target.closest(`[data-tour="${task.target}"]`);
      if (!target) return block(event);
      if (task.kind === 'click') {
        block(event);
        completeTask(task);
      } else if (task.kind === 'choose') {
        const option = event.target.closest('[data-value]');
        if (option && target.contains(option)) {
          block(event);
          if (accepts(task, option.dataset.value)) completeTask(task, option.dataset.value);
          else showNudge(task);
        }
      }
    },
    true,
  );

  frame.screen.addEventListener(
    'pointerdown',
    (event) => {
      const select = event.target.closest('select');
      if (select && select.dataset.locked === 'yes') block(event);
    },
    true,
  );

  function onValue(event) {
    const task = currentTask();
    if (!task || (task.kind !== 'type' && task.kind !== 'choose')) return;
    const target = event.target.closest(`[data-tour="${task.target}"]`);
    if (!target) return;
    if (accepts(task, event.target.value)) completeTask(task, event.target.value);
  }
  frame.screen.addEventListener('input', onValue);
  frame.screen.addEventListener('change', onValue);

  frame.screen.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const task = currentTask();
    if (task && task.kind === 'click' && event.target.closest(`[data-tour="${task.target}"]`)) {
      block(event);
      completeTask(task);
    }
  });

  function showNudge(task) {
    const nudge = coach.querySelector('.tour-hint');
    if (nudge) nudge.textContent = `Not quite. ${hintFor(task)}`;
  }

  function hintFor(task) {
    if (task.kind === 'type') return `Type “${[].concat(task.accept)[0]}”.`;
    if (task.kind === 'choose') return `Choose “${[].concat(task.accept)[0]}”.`;
    return '';
  }

  // ---------- coach panel ----------

  function ruleCards(ids) {
    return ids
      .filter((id) => facts[id])
      .map((id) =>
        h(
          'div',
          { class: 'tour-rule' },
          h('div', { class: 'tour-rule-label' }, 'The rule'),
          h('p', null, facts[id].text),
          facts[id].source && h('small', null, facts[id].source),
        ),
      );
  }

  function questionCard(question, onAnswer, answered) {
    const order = displayOrder(question);
    return h(
      'div',
      { class: 'tour-predict' },
      h('div', { class: 'tour-predict-label' }, answered ? 'Your answer' : 'What do you think?'),
      h('p', { class: 'tour-question' }, question.question),
      h(
        'div',
        { class: 'tour-options' },
        order.map((index) => {
          const option = question.options[index];
          let cls = 'tour-option';
          if (answered) {
            if (index === question.answer) cls += ' is-right';
            else if (index === answered.choice) cls += ' is-wrong';
          }
          return h('button', { class: cls, disabled: Boolean(answered), onclick: () => onAnswer(index) }, option);
        }),
      ),
      answered &&
        h(
          'div',
          { class: 'tour-why' },
          h('strong', { class: answered.right ? 'is-right' : 'is-wrong' }, answered.right ? 'Right. ' : 'Not quite. '),
          question.why,
        ),
      answered && ruleCards(question.facts || []),
    );
  }

  function renderCoach() {
    clear(coach);
    const step = currentStep();
    const { phase, taskIndex, stepIndex } = machine.state();
    const total = steps.length;

    coach.append(
      h('div', { class: 'tour-role' }, options.title),
      h(
        'div',
        { class: 'tour-progress' },
        h('span', null, `Step ${stepIndex + 1} of ${total}`),
        h('div', { class: 'tour-segments' }, steps.map((_, i) => h('i', { class: i < stepIndex ? 'is-done' : i === stepIndex ? 'is-current' : '' }))),
      ),
      h('h2', { class: 'tour-step-title' }, step.title),
      h('p', { class: 'tour-coach-text' }, step.coach),
    );

    if (step.tasks.length) {
      coach.append(
        h(
          'ol',
          { class: 'tour-tasks' },
          step.tasks.map((task, index) => {
            const done = index < taskIndex || (phase !== 'do' && index <= taskIndex);
            const current = phase === 'do' && index === taskIndex;
            return h(
              'li',
              { class: `tour-task${done ? ' is-done' : ''}${current ? ' is-current' : ''}` },
              h('span', { class: 'tour-mark' }, done ? '✓' : current ? '→' : ''),
              h(
                'div',
                null,
                task.instruction,
                current && hintFor(task) && h('div', { class: 'tour-hint' }, hintFor(task)),
              ),
            );
          }),
        ),
      );
    }

    if (pendingPredict) {
      coach.append(
        questionCard(step.predict, () => {}, pendingPredict),
        h('button', { class: 'tour-primary', onclick: () => ((pendingPredict = null), renderAll()) }, 'Continue'),
      );
    } else if (phase === 'predict') {
      coach.append(
        questionCard(step.predict, (choice) => {
          const right = machine.answerPredict(choice);
          pendingPredict = { choice, right };
          renderAll();
        }),
      );
    } else if (phase === 'fill') {
      coach.append(
        h('p', { class: 'tour-fill-note' }, step.fill.note || 'You did the first one by hand. Now let the tour do the rest.'),
        h(
          'button',
          {
            class: 'tour-primary tour-fill',
            onclick: () => {
              step.fill.apply(state, ctx);
              machine.fill();
              animateNextRender = true;
              renderAll();
            },
          },
          step.fill.label,
        ),
      );
    }

    if (phase === 'done' && !pendingPredict) {
      coach.append(...ruleCards(step.facts));
      const last = stepIndex === total - 1;
      coach.append(
        h(
          'button',
          {
            class: 'tour-primary tour-next',
            onclick: () => {
              machine.next();
              if (machine.progress().complete) return startQuiz();
              enterStep();
              renderAll();
            },
          },
          last ? 'Finish: take the quiz' : 'Next',
        ),
      );
    }

    coach.append(h('button', { class: 'tour-exit', onclick: options.onExit }, 'Exit to menu'));
  }

  function renderAll() {
    renderScreen();
    renderCoach();
    const next = coach.querySelector('.tour-next, .tour-fill, .tour-primary');
    if (next && !currentTask()) next.focus({ preventScroll: true });
  }

  // ---------- quiz and results ----------

  function startQuiz() {
    const quiz = options.quiz || [];
    const answers = [];
    let index = 0;
    let answered = null;

    function renderQuiz() {
      clear(body);
      if (index >= quiz.length) return showResults(answers);
      const question = quiz[index];
      body.append(
        h(
          'div',
          { class: 'tour-center' },
          h('div', { class: 'tour-role' }, `${options.title} · Quiz`),
          h('div', { class: 'tour-progress' }, h('span', null, `Question ${index + 1} of ${quiz.length}`)),
          questionCard(
            question,
            (choice) => {
              answered = { choice, right: choice === question.answer };
              answers.push({ question, ...answered });
              renderQuiz();
            },
            answered,
          ),
          answered &&
            h(
              'button',
              { class: 'tour-primary', onclick: () => ((answered = null), (index += 1), renderQuiz()) },
              index === quiz.length - 1 ? 'See my results' : 'Next question',
            ),
        ),
      );
    }
    renderQuiz();
  }

  function showResults(answers) {
    const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    const predictions = Object.values(machine.state().predictions);
    const predictRight = predictions.filter(Boolean).length;
    const quizRight = answers.filter((answer) => answer.right).length;
    const missed = answers.filter((answer) => !answer.right);
    saveResult(options.id, { quizScore: quizRight, quizTotal: answers.length, minutes });

    const summary = [
      `${options.title}`,
      `Time: ${minutes} min`,
      `Predictions right: ${predictRight} of ${predictions.length}`,
      `Quiz: ${quizRight} of ${answers.length}`,
      ...missed.map((answer) => `Missed: ${answer.question.question}`),
    ].join('\n');

    const copied = h('span', { class: 'tour-copied' });
    clear(body);
    body.append(
      h(
        'div',
        { class: 'tour-center tour-results' },
        h('div', { class: 'tour-role' }, options.title),
        h('h2', null, `You finished the ${options.title} tour`),
        h(
          'div',
          { class: 'tour-scores' },
          h('div', null, h('b', null, `${minutes} min`), h('span', null, 'time taken')),
          h('div', null, h('b', null, `${predictRight} of ${predictions.length}`), h('span', null, 'predictions right')),
          h('div', null, h('b', null, `${quizRight} of ${answers.length}`), h('span', null, 'quiz')),
        ),
        missed.length > 0 &&
          h(
            'div',
            { class: 'tour-missed' },
            h('h3', null, 'Worth another look'),
            missed.map((answer) =>
              h('div', { class: 'tour-why' }, h('strong', null, answer.question.question), h('p', null, answer.question.why)),
            ),
          ),
        h(
          'div',
          { class: 'tour-actions' },
          h(
            'button',
            {
              class: 'tour-secondary',
              onclick: async () => {
                copied.textContent = (await copyText(summary)) ? 'Copied' : 'Copy failed';
              },
            },
            'Copy my results',
          ),
          copied,
          h('button', { class: 'tour-primary', onclick: options.onExit }, 'Back to menu'),
        ),
      ),
    );
  }

  enterStep();
  renderAll();
}
