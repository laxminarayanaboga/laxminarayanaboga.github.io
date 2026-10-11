# Teaching a Decision Model to Play 2048 — and Why the Facts Mattered More Than the Model

> Jev, from TypeSafe AI, is a new kind of model: it never writes text, it only makes judgments. You give it a small state and a typed question, and about 230 ms later it hands back an answer with probabilities. I wanted to know what that is actually good for, so I made it play 2048 in a real browser and measured it against plain-code bots. The surprise wasn't how smart it was. It was how completely its play depended on the facts I chose to give it.

Most AI demos measure the model. This one ended up measuring the *interface* — the words between the code and the model — and that turned out to be the more useful lesson.

---

## What kind of model is Jev?

Jev is what TypeSafe calls a "System One" model: fast, focused judgments instead of generated text. A request has two parts:

- **State** — the facts, as a string or a small JSON object.
- **Questions** — each with a fixed set of possible answers. A `choice` picks one of your options, a `noul` returns the probability of yes, and a `score` places something on an ordered scale you describe.

The answers come back typed, with probabilities, so code can consume them directly:

```ts
import { score, TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient();
const { answers } = await client.systemOne({
  state: { moves: { up: { space: "some space (6 of 16 cells empty)", biggestTile: "in a corner" } } },
  questions: {
    up: score("How promising is the board after the move described in `moves.up`?", [
      "Close to losing: the board is nearly full, or the biggest tile left its corner.",
      "Poor: little space, and the big tiles are scattered.",
      "Playable: some space, but the big tiles are not well organised.",
      "Good: the biggest tile is in a corner, there is room to move.",
      "Excellent: the biggest tile is in a corner, big tiles in order, plenty of space.",
    ]),
  },
});
answers.up.score; // e.g. 3.19 — a probability-weighted position on the scale
```

Its own documentation is refreshingly blunt about what it *can't* do: it reads literally, it is bad at arithmetic and counting, noisy state lowers accuracy, and it leans towards the first option in a list. That shaped every design decision below.

---

## The rule: code does the maths, Jev makes the call

Jev can't see a screen and can't simulate a 2048 merge. So the split of work was fixed from the start:

1. **Playwright reads the board.** The original open-source 2048 writes its full state to `localStorage` on every key press, which is far more reliable than scraping animated tiles from the DOM.
2. **Pure code simulates all four moves** and drops the illegal ones.
3. **Code turns each resulting board into a few plain facts** — in words, never raw numbers to work with: `"some space (6 of 16 cells empty)"`, `"pushed out of its corner"`, `"mostly: three tiles along an edge get smaller away from the biggest tile"`.
4. **One Jev request per turn** asks about every legal move at once (questions in one request run in parallel, so extra questions add almost no latency).
5. **Code picks the winner** and presses the arrow key.

I also seeded the game's random tile generator through Playwright's `addInitScript`, so every player faced the same sequence of tiles for a given seed. Without that, ten games per player is mostly noise.

I tried two ways of asking:

- **Variant A** — one `score` question per legal move ("how promising is the board after `moves.up`?"), take the highest.
- **Variant B** — one `choice` question across the legal moves, with the option order shuffled every turn to cancel out first-option bias.

---

## Baselines keep you honest

It's easy to make any AI player look good by comparing it with nothing. So every Jev variant ran against three plain-code bots on the same ten seeds:

- **random** — any legal move. The floor.
- **heuristic** — about ten lines that rank moves on *the same facts Jev sees*, in a fixed order (keep the corner, then space, then order).
- **expectimax** — classic game search: try every move, every possible new tile, every reply, and score the boards with a fixed weight grid. No learning, no AI.

---

## Round one: Jev equals a hand-written rule

| Player | Best tile (median / max) | Games reaching 512 | Mean score | Cost (10 games) |
|---|---|---|---|---|
| random | 128 / 256 | 0 | 1,258 | – |
| heuristic | 256 / 512 | 4 | 4,819 | – |
| Jev A (Score per move) | 256 / 512 | 4 | 4,707 | $0.24 |
| Jev B (one Choice) | 256 / 512 | 4 | 3,971 | $0.09 |
| expectimax | **2048 / 4096** | 10 | 33,354 | – |

Jev played *sensibly* — it kept the biggest tile in its corner, preferred keeping three directions open over grabbing one extra empty cell — but no better than ten lines of `if`. And expectimax was in another league.

Two things in this table are lessons in themselves.

**My first heuristic was unfair.** Midway through, I had given Jev two extra facts (merges, and how many directions could move next turn) but never added them to the heuristic. On the same facts, its mean score went from 3,655 to 4,819 and the "Jev advantage" vanished. If your baseline sees less than your model, you're measuring the information gap, not the model.

**Identical descriptions give noise, not judgment.** In one game I checked, 111 of 267 turns had at least two moves whose descriptions were word-for-word identical — the boards differed, but not in any way my facts captured — and across all games about one turn in five ended with the top two scores within 0.01 of each other. On one board, four identical-looking moves scored 2.42, 2.59, 2.75 and 2.78: a coin toss with decimals. No wording of the question fixes that. Only better facts do.

---

## Round two: give it better facts

So I made the code do more of the thinking *before* asking. For each candidate move, code now tries every new tile the game could spawn (a 2 or a 4 in every empty cell) and reports the worst case, in words:

- `nextTurn`: `"a new tile could leave only one direction able to move: risky"`
- `cornerSafe`: `"yes: whatever new tile appears, a next move keeps the biggest tile in its corner"`

Both the heuristic and Jev got the new facts.

| Player | Best tile (median) | Games reaching 512 | Mean score | Cost (10 games) |
|---|---|---|---|---|
| heuristic | 256 | 3 | 4,932 | – |
| **Jev A** | **512** | **7** | **5,887** | $0.32 |
| Jev B | 256 | 4 | 4,741 | $0.12 |

This was the first result where Jev added something. The heuristic, ranking facts in a fixed order, barely moved. Jev A, weighing all the facts together, went from 4 to 7 games reaching 512. It's ten games and nothing reached 1024, so I hold it loosely — but the direction is clear: **once the facts were informative, a model that weighs them beat a rule that ranks them.**

Variant B didn't improve the same way, even though its individual picks looked reasonable. My untested guess: judging each move on its own against a described scale is easier than comparing four near-identical descriptions in one go. It was also less than half the price (735 vs 1,791 input tokens per request), which matters if you're making thousands of these calls.

---

## So what was expectimax doing that Jev couldn't?

Searching. Expectimax looked two moves ahead over the exact board and averaged over every possible tile. That's computation — exactly the thing Jev's own documentation says to keep in code. Jev never had a chance to compete there, and it shouldn't have to. The fair question was never "is Jev better than search?" but "given what code can tell it, does Jev make a better call than a rule?" — and the answer depended entirely on what code told it.

---

## Lessons learned

- **The facts set the ceiling.** With coarse one-move facts, Jev matched a heuristic. With lookahead facts, it beat it. Most of the work in a decision-model integration is choosing and computing the facts.
- **Give your baseline the same information.** An unequal baseline silently turns "the model is better" into "the model was told more".
- **Identical inputs can't be judged apart.** When two options read the same, the model's preference between them is noise. Fix the description, not the prompt.
- **Score per option and Choice across options behave differently.** Here Score was better and Choice was cheaper; test both on your own task.
- **Search is code's job.** If the problem rewards lookahead, compute it and hand the model the conclusion.
- **It's cheap enough to measure properly.** Forty Jev games cost about $0.80 in total, so there's no excuse for judging on one run.

The code, the per-turn logs and every number above are in the repo: [github.com/laxminarayanaboga/jev-playground](https://github.com/laxminarayanaboga/jev-playground). Next in this series: the same model against a game where timing is everything — the Chrome dino.

---

*A hands-on learning experiment with TypeSafe's Jev 1.13, built with Playwright and TypeScript, pair-programmed with Claude Code. Numbers are from ten seeded games per player; your results will vary.*
