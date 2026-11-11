import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

// The engine must stay free of any one product's words so it can teach any app.
// Add the words of each tour you build to this list.
const TOUR_WORDS = /lantern|librar|loan|borrow/i;

test('the engine contains no words from a tour', () => {
  for (const name of readdirSync('engine')) {
    const hit = readFileSync(`engine/${name}`, 'utf8').match(TOUR_WORDS);
    assert.equal(hit, null, `engine/${name} mentions "${hit && hit[0]}"`);
  }
});
