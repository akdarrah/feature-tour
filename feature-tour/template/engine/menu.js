// The role menu every tour opens on: product mark, headline, how the tour works,
// and one card per role listing the steps it covers.

import { h, clear } from './dom.js';
import { readResults } from './tour.js';

const HOW = [
  ['Do it yourself', 'Each step starts with one real action on a copy of the screen.'],
  ['Predict', 'Guess what the product does next before you see it.'],
  ['Learn the rule', 'Read the exact rule behind it, checked against the code.'],
];

/**
 * @param {object} options
 * @param {HTMLElement} options.mount
 * @param {string|Node} [options.brand]  product wordmark shown above the headline
 * @param {string} options.title
 * @param {string} options.intro
 * @param {string} options.banner
 * @param {object[]} options.roles       each { id, title, question, summary, minutes, steps, quiz }
 * @param {(role: object) => void} options.onStart
 */
export function showMenu({ mount, brand, title, intro, banner, roles, onStart }) {
  clear(mount);
  const results = readResults();
  mount.append(
    h(
      'div',
      { class: 'tour-root' },
      h('div', { class: 'tour-banner' }, banner),
      h(
        'main',
        { class: 'tour-menu' },
        h(
          'header',
          { class: 'tour-menu-hero' },
          brand && h('div', { class: 'tour-menu-brand' }, brand),
          h('h1', null, title),
          h('p', { class: 'tour-menu-intro' }, intro),
          h(
            'ol',
            { class: 'tour-how' },
            HOW.map(([name, text]) => h('li', null, h('b', null, name), h('span', null, text))),
          ),
        ),
        h(
          'div',
          { class: 'tour-roles' },
          roles.map((role) => {
            const done = results[role.id];
            return h(
              'article',
              { class: 'tour-role-card' },
              h('div', { class: 'tour-role-card-head' }, h('h2', null, role.title), h('span', { class: 'tour-role-time' }, `${role.minutes} min`)),
              h('p', { class: 'tour-role-question' }, role.question),
              h('p', { class: 'tour-role-summary' }, role.summary),
              h(
                'ol',
                { class: 'tour-role-steps' },
                role.steps.map((step) => h('li', null, step.title)),
                role.quiz.length > 0 && h('li', { class: 'is-quiz' }, `Quiz, ${role.quiz.length} questions`),
              ),
              h(
                'div',
                { class: 'tour-role-foot' },
                h('button', { class: 'tour-primary', onclick: () => onStart(role) }, done ? `Take the ${role.title} tour again` : `Start the ${role.title} tour`),
                done && h('span', { class: 'tour-role-done' }, `✓ Quiz ${done.quizScore} of ${done.quizTotal}`),
              ),
            );
          }),
        ),
      ),
    ),
  );
}
