# Survey brief

Run one read-only agent per surface (web app, each mobile app, each device app), in parallel. Fill in the angle brackets.

> Very thorough exploration, read-only. Repo: `<path>`. `<one line on what the feature is>`.
>
> **Read the pushed main branch, not the working tree** (`git show origin/<branch>:<path>`). Ignore sibling worktree folders. State the commit you read.
>
> Goal: I am building a browser-based guided simulation that teaches people how `<feature>` works, one experience per role. It must mirror the real product, so I need facts from code, not guesses.
>
> Report, with file paths and line numbers for every claim:
>
> 1. **Roles:** every kind of person or device that interacts with it, how each is represented in code, and what each can and cannot do.
> 2. **Data model:** models, key fields, statuses and state machines.
> 3. **Screens in navigation order:** route, controller, view or component path, and the exact page titles, nav labels, button labels, field labels, column headers, empty states, confirmations and error messages. Quote the real strings. Note the frontend tech, colours and fonts so a mock can look alike.
> 4. **Business rules with exact numbers:** `<list the rules you expect, by name>`. For each number, say whether the client or the server decides it.
> 5. **The end-to-end happy path in order.**
> 6. **Differences between platforms** (for example iOS and Android), as their own section.
> 7. **Not implemented:** things people might assume exist but don't.
> 8. **At least 8 surprising edge cases** a learner should be quizzed on, each with the rule and a file reference.
>
> Be exact about numbers and scoped conditions. Demo or fixture data is not a rule; say when a number only appears in fixtures. If something is ambiguous or you cannot find it, say so plainly rather than guessing. Return a structured written report; it will be my only source.

## Why each part is there

- **Exact strings** let you mirror screens without opening the app.
- **Who decides each number** catches fixture values that look like rules.
- **Not implemented** catches features people assume exist.
- **Platform differences** are the richest source of quiz questions.
- **The commit** tells you whether to re-check before building.
