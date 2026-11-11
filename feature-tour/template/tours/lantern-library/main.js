// Entry point: a role menu, then the chosen role's tour.

import { runTour, readResults } from '../../engine/tour.js';
import { h, clear } from '../../engine/dom.js';
import { FACTS, STAMP } from './facts.js';
import { ROLES } from './roles.js';
import { makeState } from './scenario.js';
import { catalog, desk, returns } from './screens/app.js';

const SCREENS = { catalog, desk, returns };
const BANNER = `Training simulation of a made-up app. Rules as of ${STAMP.date}.`;
const mount = document.getElementById('app');

function showMenu() {
  clear(mount);
  const results = readResults();
  mount.append(
    h(
      'div',
      { class: 'tour-root' },
      h('div', { class: 'tour-banner' }, BANNER),
      h(
        'div',
        { class: 'tour-menu' },
        h('h1', null, 'Learn Lantern Library by doing it'),
        h('p', null, 'Pick a role. You do the first example of every step, then the rest fills in.'),
        ROLES.map((role) =>
          h(
            'button',
            { class: 'tour-menu-card', onclick: () => start(role) },
            h('b', null, role.question),
            h('span', null, role.summary),
            h('small', null, `${role.minutes} min`, results[role.id] ? ` · ✓ Quiz ${results[role.id].quizScore} of ${results[role.id].quizTotal}` : ''),
          ),
        ),
      ),
    ),
  );
}

function start(role) {
  runTour({
    mount,
    id: role.id,
    title: role.title,
    banner: BANNER,
    frame: role.frame,
    startTime: role.startTime,
    steps: role.steps,
    quiz: role.quiz,
    facts: FACTS,
    makeState,
    screens: SCREENS,
    onExit: showMenu,
  });
}

showMenu();
