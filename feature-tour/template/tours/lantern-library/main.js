// Entry point: a role menu, then the chosen role's tour.

import { runTour } from '../../engine/tour.js';
import { showMenu } from '../../engine/menu.js';
import { h } from '../../engine/dom.js';
import { FACTS, STAMP } from './facts.js';
import { ROLES } from './roles.js';
import { makeState } from './scenario.js';
import { catalog, desk, returns } from './screens/app.js';

const SCREENS = { catalog, desk, returns };
const BANNER = `A made-up app. Nothing you do here is saved. Rules as of ${STAMP.date}.`;
const mount = document.getElementById('app');

function menu() {
  showMenu({
    mount,
    brand: h('span', { class: 'll-brand' }, '🏮 Lantern Library'),
    title: 'Learn Lantern Library by doing it',
    intro: 'A hands-on practice run of a made-up library app. Pick a role to see it from that side of the desk.',
    banner: BANNER,
    roles: ROLES,
    onStart: start,
  });
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
    onExit: menu,
  });
}

menu();
