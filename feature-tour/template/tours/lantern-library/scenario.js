// Invented data for the example tour, plus the small calculations the screens
// show. Numbers come from facts.js, so screens can't drift from the rules.

import { fact } from './facts.js';

export const BOOKS = [
  { id: 'orchard', title: 'The Quiet Orchard', author: 'M. Ellery', copies: 3 },
  { id: 'tides', title: 'Field Notes on Tides', author: 'R. Okonkwo', copies: 2 },
  { id: 'lanterns', title: 'A Short History of Lanterns', author: 'J. Varga', copies: 1 },
  { id: 'atlas', title: 'Small Towns Atlas', author: 'L. Fernández', copies: 2 },
  { id: 'kettle', title: 'The Kettle Diaries', author: 'S. Imai', copies: 4 },
];

export const MEMBERS = [
  { id: 'ada', name: 'Ada Brooks', card: 'L-1001' },
  { id: 'ben', name: 'Ben Osei', card: 'L-1002' },
  { id: 'cleo', name: 'Cleo Marsh', card: 'L-1003' },
  { id: 'dev', name: 'Dev Raman', card: 'L-1004' },
];

export function makeState() {
  return { books: [], loans: [], ui: {}, form: {} };
}

const DAY = 86400000;
const atNoon = (iso) => new Date(`${iso.slice(0, 10)}T12:00:00`);
export const isoDate = (date) => date.toLocaleDateString('en-CA');
export const longDate = (iso) => atNoon(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

export function dueDate(checkedOutIso) {
  return isoDate(new Date(atNoon(checkedOutIso).getTime() + fact('loan_days').value * DAY));
}

export function daysLate(dueIso, returnedIso) {
  return Math.max(0, Math.round((atNoon(returnedIso) - atNoon(dueIso)) / DAY));
}

export function fineFor(dueIso, returnedIso) {
  const fine = daysLate(dueIso, returnedIso) * fact('fine_per_day').value;
  return Math.min(fine, fact('fine_cap').value);
}

export const money = (amount) => `$${amount.toFixed(2)}`;

export function available(state, bookId) {
  const book = state.books.find((b) => b.id === bookId);
  const out = state.loans.filter((l) => l.book === bookId && !l.returned).length;
  return book.copies - out;
}
