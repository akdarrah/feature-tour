// Checks every tour in tours/: facts cite a source and are verified, every rule a
// step teaches exists, predict and quiz answers point at a real option, and the
// built file loads nothing from the network.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

for (const name of readdirSync('tours')) {
  const { FACTS, STAMP } = await import(`../tours/${name}/facts.js`);
  const { ROLES } = await import(`../tours/${name}/roles.js`);

  test(`${name}: every fact has a value, a path:line source and is verified`, () => {
    for (const [id, entry] of Object.entries(FACTS)) {
      assert.notEqual(entry.value, undefined, `${id} has no value`);
      assert.match(entry.source, /\S+:\d+/, `${id} source must be path:line`);
      assert.equal(entry.verified, true, `${id} was not checked against the code`);
    }
    assert.ok(STAMP.date && STAMP.commit, 'STAMP needs a date and a commit');
  });

  for (const role of ROLES) {
    test(`${name}/${role.id}: steps, facts and answers are consistent`, () => {
      assert.ok(role.steps.length >= 1);
      assert.equal(new Set(role.steps.map((s) => s.id)).size, role.steps.length, 'step ids repeat');
      const questions = [...role.steps.map((s) => s.predict).filter(Boolean), ...role.quiz];
      for (const step of role.steps) {
        assert.ok(step.tasks.length >= 1, `${step.id} has nothing to do by hand`);
        assert.ok(step.facts.length >= 1, `${step.id} teaches no fact`);
        for (const id of step.facts) assert.ok(FACTS[id], `unknown fact ${id}`);
      }
      for (const q of questions) {
        assert.ok(q.options.length >= 2 && q.options.length <= 4);
        assert.ok(q.answer >= 0 && q.answer < q.options.length);
        assert.ok(q.why.length > 0);
        for (const id of q.facts || []) assert.ok(FACTS[id], `unknown fact ${id}`);
      }
    });
  }

  test(`${name}: builds into one file with no network references`, () => {
    execFileSync('node', ['build.mjs', `tours/${name}`]);
    assert.ok(existsSync(`dist/${name}.html`));
    const html = readFileSync(`dist/${name}.html`, 'utf8');
    assert.doesNotMatch(html, /<script[^>]+src=/, 'no external scripts');
    assert.doesNotMatch(html, /<link[^>]+href=/, 'no external stylesheets');
    assert.doesNotMatch(html, /https?:\/\/(?!www\.w3\.org\/)/, 'no network urls');
  });
}
