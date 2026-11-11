# feature-tour

A Claude Code skill for learning a feature by doing it.

It builds a guided, hands-on simulation of an app's feature in the browser: a menu of roles, and in each role the learner does the first example of every step by hand, answers a "what do you think happens?" question, then a button fills in the rest. Every rule it teaches is checked against the real code first.

The result is one self-contained HTML file with no network calls, so it can be sent to a teammate and opened by double-clicking.

## Why

When a feature is built quickly, or mostly with AI, even the person who built it may never have used it end to end. Using the real product as every role takes hours. A 10 to 15 minute simulation per role, grounded in the code, gets most of that understanding and can be passed around.

## Install

Copy the `feature-tour` folder into your Claude Code skills directory:

```bash
git clone https://github.com/akdarrah/feature-tour.git
cp -r feature-tour/feature-tour ~/.claude/skills/
```

Then ask Claude Code something like "build a feature tour for our checkout flow, one experience per role".

## What's inside

- `feature-tour/SKILL.md`: the process Claude follows (survey the code per role, verify every fact at the main branch, look at the real product, design 6 to 8 steps per role, build, walk it, stop after the first role).
- `feature-tour/references/`: the survey brief, the facts-table rules, and the step design guide.
- `feature-tour/template/`: the tour engine, a single-file build, tests, and a small example tour of a made-up library app.

## Try the example

```bash
cd feature-tour/feature-tour/template
npm install
npm test
npm run build
open dist/lantern-library.html
```

Lantern Library is invented. Its facts table cites an imaginary codebase to show the shape of a real one.

## License

MIT. See `LICENSE`.
