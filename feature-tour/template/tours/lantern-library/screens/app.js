// Mock screens for the made-up Lantern Library staff app. In a real tour, each
// screen copies the real product's layout, labels and styles.

import { h } from '../../../engine/dom.js';
import { BOOKS, MEMBERS, available, dueDate, longDate, fineFor, daysLate, money } from '../scenario.js';

const NAV = [
  ['catalog', 'Catalog'],
  ['desk', 'Check out'],
  ['returns', 'Returns'],
];

function shell(active, { actions, overlay, toast }, ...content) {
  return h(
    'div',
    { class: 'll-app' },
    h(
      'header',
      { class: 'll-top' },
      h('span', { class: 'll-logo' }, '◐ Lantern Library'),
      h('nav', null, NAV.map(([key, label]) => h('span', { class: key === active ? 'is-active' : '' }, label))),
    ),
    h('main', { class: 'll-page' }, h('div', { class: 'll-head' }, h('h1', null, NAV.find(([k]) => k === active)[1]), actions), content),
    overlay,
    toast && h('div', { class: 'll-toast' }, toast),
  );
}

const input = (tour, value, placeholder) =>
  h('input', { class: 'll-input', dataset: { tour }, value: value ?? '', placeholder, autocomplete: 'off', 'data-1p-ignore': '' });

function select(tour, options, value, placeholder) {
  return h(
    'select',
    { class: 'll-input', dataset: { tour } },
    h('option', { value: '' }, placeholder),
    options.map((o) => h('option', { value: o, selected: o === value }, o)),
  );
}

const button = (label, tour, primary) => h('button', { class: `ll-btn${primary ? ' primary' : ''}`, dataset: tour ? { tour } : undefined }, label);
const field = (label, control) => h('label', { class: 'll-field' }, h('span', null, label), control);

export const catalog = {
  address: () => 'library.example/staff/catalog',
  render(state) {
    const modal =
      state.ui.modal === 'book' &&
      h(
        'div',
        { class: 'll-overlay' },
        h(
          'div',
          { class: 'll-modal' },
          h('h2', null, 'Add a book'),
          field('Title', input('book-title', state.form['book-title'])),
          field('Copies', input('book-copies', state.form['book-copies'])),
          h('div', { class: 'll-actions' }, button('Cancel'), button('Save', 'book-save', true)),
        ),
      );
    return shell(
      'catalog',
      { actions: button('Add book', 'add-book', true), overlay: modal, toast: state.ui.toast },
      h(
        'table',
        { class: 'll-table' },
        h('thead', null, h('tr', null, h('th', null, 'Title'), h('th', null, 'Author'), h('th', null, 'Copies'), h('th', null, 'On the shelf'))),
        h(
          'tbody',
          null,
          state.books.length === 0
            ? h('tr', null, h('td', { colspan: 4, class: 'll-muted' }, 'No books yet.'))
            : state.books.map((b) => h('tr', { dataset: { row: b.id } }, h('td', null, b.title), h('td', null, b.author), h('td', null, b.copies), h('td', null, available(state, b.id)))),
        ),
      ),
    );
  },
};

export const desk = {
  address: () => 'library.example/staff/check-out',
  render(state, ctx) {
    const today = ctx.clock.now().toLocaleDateString('en-CA');
    return shell(
      'desk',
      { toast: state.ui.toast },
      h(
        'div',
        { class: 'll-card' },
        field('Member', select('loan-member', MEMBERS.map((m) => m.name), state.form['loan-member'], 'Choose a member')),
        field('Book', select('loan-book', state.books.map((b) => b.title), state.form['loan-book'], 'Choose a book')),
        h('p', { class: 'll-muted' }, `Due back ${longDate(dueDate(today))} if checked out today.`),
        button('Check out', 'loan-save', true),
      ),
      h(
        'table',
        { class: 'll-table' },
        h('thead', null, h('tr', null, h('th', null, 'Member'), h('th', null, 'Book'), h('th', null, 'Checked out'), h('th', null, 'Due'))),
        h(
          'tbody',
          null,
          state.loans.map((l) =>
            h(
              'tr',
              { dataset: { row: l.id } },
              h('td', null, MEMBERS.find((m) => m.id === l.member).name),
              h('td', null, BOOKS.find((b) => b.id === l.book).title),
              h('td', null, longDate(l.out)),
              h('td', null, longDate(l.due)),
            ),
          ),
        ),
      ),
    );
  },
};

export const returns = {
  address: () => 'library.example/staff/returns',
  render(state, ctx) {
    const today = ctx.clock.now().toLocaleDateString('en-CA');
    return shell(
      'returns',
      { toast: state.ui.toast },
      h('p', { class: 'll-muted' }, `Today is ${longDate(today)}.`),
      h(
        'table',
        { class: 'll-table' },
        h('thead', null, h('tr', null, h('th', null, 'Member'), h('th', null, 'Book'), h('th', null, 'Due'), h('th', null, 'Days late'), h('th', null, 'Fine'), h('th'))),
        h(
          'tbody',
          null,
          state.loans.map((l) => {
            const late = daysLate(l.due, l.returned || today);
            return h(
              'tr',
              { dataset: { row: `${l.id}-${Boolean(l.returned)}` } },
              h('td', null, MEMBERS.find((m) => m.id === l.member).name),
              h('td', null, BOOKS.find((b) => b.id === l.book).title),
              h('td', null, longDate(l.due)),
              h('td', null, late || '—'),
              h('td', null, late ? money(fineFor(l.due, l.returned || today)) : '—'),
              h('td', null, l.returned ? h('span', { class: 'll-muted' }, 'Returned') : button('Return', `return-${l.id}`)),
            );
          }),
        ),
      ),
    );
  },
};
