// The single facts table for the example tour. Every rule the tour teaches comes
// from here. In a real tour each source is a path:line in the product's code,
// re-checked at its main branch before building.
//
// Lantern Library is a made-up app. These sources point at an imaginary codebase
// so the example shows the shape of a real facts table.

export const STAMP = { date: '2026-03-01', commit: 'example' };

const f = (value, text, source) => ({ value, text, source, verified: true });

export const FACTS = {
  loan_days: f(14, 'A loan lasts 14 days from the day it is checked out.', 'example app/models/loan.rb:8'),
  renew_limit: f(2, 'A loan can be renewed twice. After that the book has to come back.', 'example app/models/loan.rb:9'),
  hold_blocks_renewal: f(true, 'A book someone else has placed on hold cannot be renewed.', 'example app/models/loan.rb:41'),
  fine_per_day: f(0.25, 'A late book costs $0.25 for each day past its due date.', 'example app/models/fine.rb:5'),
  fine_cap: f(5, 'A fine never goes above $5.00 per book.', 'example app/models/fine.rb:6'),
  copies_shared: f(true, 'Copies of one title are counted together. A title is available while any copy is on the shelf.', 'example app/models/book.rb:22'),
};

export function fact(id) {
  const entry = FACTS[id];
  if (!entry) throw new Error(`Unknown fact: ${id}`);
  return entry;
}
