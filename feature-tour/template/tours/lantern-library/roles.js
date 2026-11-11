// The example role: a librarian at the front desk. Three steps, each with a
// hands-on task, a "what do you think?" question and a rule from facts.js.

import { fact } from './facts.js';
import { BOOKS, MEMBERS, dueDate, longDate, fineFor, daysLate, money } from './scenario.js';

const value = (id) => fact(id).value;
const START = '2026-03-02T10:00:00';
const RETURN_DAY = '2026-03-25T10:00:00';
const ORCHARD = BOOKS.find((b) => b.id === 'orchard');
const ADA = MEMBERS.find((m) => m.id === 'ada');

const loan = (id, member, book, out) => ({ id, member, book, out, due: dueDate(out), returned: null });
const adaDue = dueDate(START);
const adaFine = fineFor(adaDue, RETURN_DAY);

const librarian = {
  id: 'librarian',
  title: 'Librarian',
  question: 'What is it like to run the front desk?',
  frame: 'browser',
  minutes: 5,
  summary: 'Add a book, lend it, and take it back late.',
  startTime: START,
  steps: [
    {
      id: 'catalog',
      title: 'Add a book',
      coach: 'Everything at the desk starts with the catalog. A title can have several copies.',
      screen: 'catalog',
      tasks: [
        { id: 'open', instruction: 'Click "Add book".', target: 'add-book', kind: 'click', apply: (s) => (s.ui.modal = 'book') },
        { id: 'title', instruction: `Title: ${ORCHARD.title}.`, target: 'book-title', kind: 'type', accept: ORCHARD.title },
        { id: 'copies', instruction: 'Copies: 3.', target: 'book-copies', kind: 'type', accept: '3' },
        {
          id: 'save',
          instruction: 'Click Save.',
          target: 'book-save',
          kind: 'click',
          apply: (s) => {
            s.books.push({ ...ORCHARD });
            s.ui.modal = null;
            s.ui.toast = 'Book added.';
          },
        },
      ],
      predict: {
        question: 'Two of the three copies are out. Can a member still borrow this title?',
        options: ['Yes. One copy is still on the shelf.', 'No. The title is out.', 'Only with a librarian’s override'],
        answer: 0,
        why: 'Copies of a title are counted together, so it stays available while any copy is on the shelf.',
        facts: ['copies_shared'],
      },
      fill: {
        label: 'Add the other 4 books',
        apply: (s) => {
          s.ui.toast = null;
          for (const book of BOOKS.filter((b) => b.id !== 'orchard')) s.books.push({ ...book });
        },
      },
      facts: ['copies_shared'],
    },
    {
      id: 'desk',
      title: 'Lend a book',
      coach: 'Pick the member and the book. The due date is set for you.',
      screen: 'desk',
      enter: (s) => (s.ui.toast = null),
      tasks: [
        { id: 'member', instruction: `Member: ${ADA.name}.`, target: 'loan-member', kind: 'choose', accept: ADA.name },
        { id: 'book', instruction: `Book: ${ORCHARD.title}.`, target: 'loan-book', kind: 'choose', accept: ORCHARD.title },
        {
          id: 'save',
          instruction: 'Click "Check out".',
          target: 'loan-save',
          kind: 'click',
          apply: (s) => {
            s.loans.push(loan('ada-orchard', 'ada', 'orchard', START.slice(0, 10)));
            s.ui.toast = `Checked out. Due back ${longDate(adaDue)}.`;
          },
        },
      ],
      predict: {
        question: `Ada wants to keep the book longer. How many times can she renew it?`,
        options: [`${value('renew_limit')} times`, 'As many as she likes', 'Never'],
        answer: 0,
        why: `${fact('renew_limit').text} ${fact('hold_blocks_renewal').text}`,
        facts: ['renew_limit', 'hold_blocks_renewal'],
      },
      fill: {
        label: 'Lend 3 more books',
        apply: (s) => {
          s.loans.push(loan('ben-tides', 'ben', 'tides', START.slice(0, 10)));
          s.loans.push(loan('cleo-atlas', 'cleo', 'atlas', START.slice(0, 10)));
          s.loans.push(loan('dev-kettle', 'dev', 'kettle', START.slice(0, 10)));
          s.ui.toast = null;
        },
      },
      facts: ['loan_days', 'renew_limit'],
    },
    {
      id: 'returns',
      title: 'Take a book back late',
      coach: 'Time has moved on. Ada is back with the book, after its due date.',
      screen: 'returns',
      clock: RETURN_DAY,
      enter: (s) => (s.ui.toast = null),
      tasks: [
        {
          id: 'return',
          instruction: 'Click Return on Ada’s loan.',
          target: 'return-ada-orchard',
          kind: 'click',
          apply: (s, ctx) => {
            const l = s.loans.find((x) => x.id === 'ada-orchard');
            l.returned = ctx.clock.now().toLocaleDateString('en-CA');
            s.ui.toast = `Returned. Fine: ${money(adaFine)}.`;
          },
        },
      ],
      predict: {
        question: `The book was ${daysLate(adaDue, RETURN_DAY)} days late. What is the fine?`,
        options: [money(adaFine), money(value('fine_cap')), '$0.00, the first week is free'],
        answer: 0,
        why: `${money(value('fine_per_day'))} a day for ${daysLate(adaDue, RETURN_DAY)} days. ${fact('fine_cap').text}`,
        facts: ['fine_per_day', 'fine_cap'],
      },
      facts: ['fine_per_day', 'fine_cap'],
    },
  ],
  quiz: [
    {
      question: 'How long does a loan last?',
      options: [`${value('loan_days')} days`, '7 days', '30 days'],
      answer: 0,
      why: fact('loan_days').text,
      facts: ['loan_days'],
    },
    {
      question: 'A book is 40 days late. What is the fine?',
      options: [money(value('fine_cap')), money(40 * value('fine_per_day')), '$0.00'],
      answer: 0,
      why: `40 days would be ${money(40 * value('fine_per_day'))}, but ${fact('fine_cap').text.toLowerCase()}`,
      facts: ['fine_cap'],
    },
    {
      question: 'Someone else has a hold on Ada’s book. Can she renew it?',
      options: ['No', 'Yes, once', 'Yes, if she asks a librarian'],
      answer: 0,
      why: fact('hold_blocks_renewal').text,
      facts: ['hold_blocks_renewal'],
    },
  ],
};

export const ROLES = [librarian];
