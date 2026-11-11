---
name: feature-tour
description: Build a guided, hands-on browser simulation that teaches how a feature of an app works, one experience per role (for example manager, employee, admin, device). The learner does the first example of each step by hand, a button fills in the rest, and every rule shown is checked against the real code. Use when someone wants to learn or teach a feature quickly, especially one built fast or with AI, and asks for a demo, walkthrough, training, tour or simulation of it.
---

# Feature tour

A feature tour is a single self-contained HTML file. It opens on a menu of roles. Each role is 6 to 8 steps and takes 10 to 15 minutes. In every step the learner:

1. does the first example by hand (types the values, clicks the buttons) on a mock of the real screen,
2. answers a "what do you think happens?" question before the answer is shown,
3. presses a button that fills in the rest,
4. reads the rule they just used, with the line of code it comes from.

Each role ends with a short quiz and a results screen with "Copy my results".

The engine, a build script, tests and a small example (a made-up library app) are in `template/`. Read `template/tours/lantern-library/` before writing a new tour; it is the smallest complete example.

## The one rule that matters

**Every rule the tour teaches must come from the code, not from memory, docs or a demo fixture.** A tour that teaches an invented version of the product is worse than no tour. All numbers, thresholds and messages live in one facts table (`facts.js`), each with a `path:line` source, and each re-read at the main branch before anything is built on it.

## Process

### 1. Scope (ask only what you can't find)

- Which feature, and which repos hold it (web app, mobile apps, devices).
- **Which roles touch it.** Find them in the code (permissions, abilities, separate apps) rather than guessing. A "role" that is really a permission (for example "can issue refunds") is taught inside another role, not as its own.
- The default branch of each repo. Local checkouts are often on old branches; always read with `git show origin/<branch>:<path>`.

### 2. Survey the code, one read-only agent per surface

Run them in parallel. Use the brief in `references/survey-brief.md`. Each survey returns roles, data model, screens in order with exact strings, business rules with exact numbers and who decides them (client or server), the happy path, platform differences, things that are not implemented, and surprising edge cases to quiz on. Save each report to `research/`.

### 3. Verify the facts

Fetch each repo, record the commits, and re-read every cited line at the main branch. Write `research/verification-log.md`: one line per fact, confirmed, changed or not found. A fact you can't confirm is removed, and any step built on it is reworked. Then write `facts.js`. See `references/facts.md`.

### 4. Look at the real product

Before drawing screens, look at the real thing if you can: a local build, a staging site, or screenshots the person gives you. Read the design system's tokens and component styles from the code. Surveys miss layout: a list might be grouped differently than the code suggests, or a button might open a pre-filled pop-up rather than a full form. Copy labels character for character.

### 5. Design the scenario and the steps

One invented story runs through every role, so a learner who does two roles sees the same day from two sides. Use only invented names, numbers and places. Design each role with `references/step-design.md`: 6 to 8 steps, each with hands-on tasks, a predict question, an optional fill, and the facts it teaches. Then check every step's clock and state against the facts it touches; story slips are common (an action taken before the rules allow it, a window open outside its dates, a record that should already have expired).

### 6. Build

Copy `template/` into a new project folder (not inside the product repo). Add `tours/<name>/` with `tour.json`, `facts.js`, `scenario.js`, `screens/`, `roles.js`, `main.js` and `tour.css`. Keep product words out of `engine/` (the test enforces it). Compute every number on screen from state and the facts; never type a rule into a screen or a script.

Run `npm test` and `npm run build`. The output is `dist/<name>.html`.

### 7. Walk it, then stop

Open the built file and do every step as a learner would. Check that each highlighted target makes sense, typed values complete their tasks, fills look believable, numbers agree across screens, and answers match the facts. Write down what you fixed in `research/walkthrough.md`.

**Build one role, then stop and ask whether it helps** before building the rest. The first role proves the idea; the rest repeat the pattern.

### 8. Hand it over

Give the person the file path. It is one file with no network calls, so it can be sent in chat or email and opened by double-clicking. If the mock carries a real company's name, logo or look, treat it as internal: do not publish it to a public link or repository.

## Engine features worth knowing

- `runTour()` in `template/engine/tour.js` takes steps, screens, facts and a `makeState()` function. See the JSDoc there.
- Task kinds: `click`, `type` (accepts a string or a list of accepted spellings), `choose` (a select, or an element with `data-value` options).
- Elements are targeted with `data-tour="<name>"`. Clicks on anything else are blocked during a task, so the learner can't wander off the path.
- `data-tour-free="<control>"` marks a "tour control": a clearly labelled button that belongs to the tour rather than the product (for example "Jump to next Monday" or "View as a different role").
- Each step can set the simulation clock. Tour content never reads the real time.
- Rows marked `data-row="<key>"` animate in when a fill adds them.
- Predict and quiz options are shown in a shuffled but stable order.
- Mock inputs should carry `autocomplete="off"` and `data-1p-ignore` so password managers leave them alone.
