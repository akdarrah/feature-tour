# The facts table

`tours/<name>/facts.js` is the only place a rule, number or message lives. Screens, scripts, predict questions and quiz answers read from it with `fact(id)`.

```js
export const STAMP = { date: 'YYYY-MM-DD', commit: '<short sha of each repo you read>' };

export const FACTS = {
  loan_days: {
    value: 14,                                   // the value the code uses
    text: 'A loan lasts 14 days from the day it is checked out.', // what the learner reads
    source: 'web app/models/loan.rb:8',           // repo, path and line
    verified: true,                               // re-read at the main branch
  },
};
```

## Rules

- **Verify before building.** Fetch, then re-read each cited line at `origin/<main branch>`. Line numbers move; search for the constant if needed. Record each check in `research/verification-log.md` as `<id> | confirmed | <path>:<line> @ <sha>`, `<id> | CHANGED: was X, is Y | ...` or `<id> | NOT FOUND | searched ...`.
- **Unconfirmed facts are removed,** not kept with a caveat.
- **Messages are copied character for character,** including straight versus curly apostrophes and how counts and times are filled in.
- **Scoped rules stay scoped.** "Only for books on hold" is not "for all books". "Strictly more than 14 days" is not "14 days or more".
- **Record nuances in the log** when the code differs from what a reasonable person would assume (for example a change that only applies to future records, or an edit that stays unpublished).
- **The stamp is shown** on every screen of the tour, so learners know what date and version the rules came from.
