# Designing a role

## Shape

- **6 to 8 steps, 10 to 15 minutes.** The surveys will hold far more than that. The rest stays reference material.
- **Each step teaches at least one fact** and has at least one hands-on task.
- **Do one by hand, then fill.** The learner adds one record, the fill adds the rest. Fills should look believable and animate in.
- **Predict before revealing.** Ask the question right before the answer becomes visible on screen, not after. Good questions target a rule people get wrong: "someone else has a hold on it, can it be renewed?", "it's 9 days late, what's the fine?".
- **Numbers in questions come from `fact()`**, so they can't drift from the facts table.
- **Coach text explains the stage and why it matters** in one or two sentences, without hard-coding rule numbers (the role test checks this).
- **End with 3 to 5 quiz questions,** each backed by a fact.

## The story

- One invented scenario for all roles, each role starting from its own state so it can be taken alone.
- Set each step's simulation clock explicitly. Check every timestamp against the rules it touches.
- Use a "tour control" (clearly labelled as part of the tour) when the story needs something the product can't do on demand, such as jumping ahead a week.
- When the tour simplifies the product (a fill standing in for a real button, a time field instead of a date-time picker), say so in the coach text or on the page.

## Traps seen in practice

- **Two thresholds with similar names.** An app might show a "due soon" note two days early while the server sends its reminder one day early. Teach both, labelled.
- **Fixture numbers are not rules.** Demo data in an app often uses round numbers that differ from the server's defaults.
- **Platforms differ.** One app may offer a choice the other always makes for you.
- **The right answer is always option one.** Shuffle displayed options (the engine does) so learners can't game it.
- **Stale messages.** A blocker message saved as text goes stale after the learner fixes one thing. Recompute it from state on every render.
- **Password managers** offer to fill mock forms. Mark fields to be ignored, and don't use real password inputs.
- **Layout you only see in the real app,** such as an unexpected grouping, or a pop-up that pre-fills most of a form. Look at the real product before scripting steps that depend on it.

## Checklist before handing over

- `npm test` passes and `npm run build` writes one file.
- Every step completes by typing the exact hinted values.
- Numbers agree across screens (hours, totals, counts on buttons).
- Every predict answer and quiz answer matches the facts table.
- The banner shows the simulation stamp.
