# Plain Code, a Decision Model and a Coding Agent: Who Should Make Which Call?

> Three lines of `if` played the Chrome dino game for two hours and twenty-five minutes and scored 169,369, for free. A purpose-built AI decision model needed a redesign just to survive the second cactus. And neither bot would exist without a coding agent that can't make a single real-time decision itself. After a day of making AI play browser games, the most useful thing I learned wasn't about any one tool — it was about which kind of "thinking" belongs where.

This is the third article in the series. The [first](decision-model-plays-2048.html) put TypeSafe's Jev decision model on 2048; the [second](latency-is-a-design-constraint-chrome-dino.html) put it on the Chrome dino game. This one steps back and compares the three things that did the work: **plain code**, **Jev**, and **Claude Code**, the coding agent I built everything with.

---

## Plain code: the dino that wouldn't die

Here is the entire decision logic of the dino baseline:

```ts
if (kind === "high bird") return "wait";                                // run under it
if (kind === "mid bird") return arrivalMs <= 150 ? "duck" : "wait";
return arrivalMs <= 150 ? "jump" : "wait";                              // cacti, low birds
```

Everything else is plumbing, and Playwright does the heavy lifting there:

- **An init script catches the game object** as Chrome's dino registers itself as an event listener — current Chromium no longer exposes it as `window.Runner`.
- **`page.evaluate` reads the live state** — speed, the dino's position, every obstacle's type, position and width — about **2,000 times a second**.
- **Code turns pixels into milliseconds**: the gap to the next obstacle divided by its speed.
- **`page.keyboard` presses Space or holds ArrowDown.**

I started it to calibrate the timing and then just… let it run. It reached the game's top speed (13 pixels per frame) within a couple of minutes, and from that point the world stops changing: same speed, same physics, same 150 ms rule. It sailed straight through the five-digit score display's limit (the counter simply grew a sixth digit) and finally hit a large cactus after **2 hours 25 minutes and 169,369 points** — having read the game's state about 24 million times.

That's the first lesson, and it's not about AI at all: **when the rule is known and the world is stable, plain code is unbeatable.** It decides in microseconds, never gets tired, costs nothing, and does exactly the same thing every time. No model call can compete with a comparison and a key press.

---

## Jev: fast judgments, if you give it the facts

Jev is a different animal. It doesn't generate text and it doesn't write code. You send it a small state and a typed question — pick one option, yes-or-no, or a position on a scale — and roughly 230 ms later you get an answer with probabilities. It costs $0.042 per million input tokens; a 26-minute dino run with 2,000 requests cost three and a half cents.

What it's good at is **judgment from described facts**. In 2048, when code described each move with lookahead facts ("whatever new tile appears, a next move keeps the biggest tile in its corner"), Jev weighing those facts together beat a hand-written rule that ranked them in a fixed order: 7 of 10 games reached the 512 tile against 3 of 10.

What it's not good at is everything its own documentation warns about: arithmetic, counting, geometry — and, as the dino showed, *being on the critical path of a tight deadline*. Its answers were right 100% of the time, but its latency varied by about 120 ms while the safe jump window was about 90 ms wide. The design that worked asked Jev *what* to do as soon as an obstacle appeared and let plain code decide *when*. Even then, one slow answer in two thousand ended a run.

So Jev sits in a narrow but real slot: **a fuzzy call that a rule would get wrong, that can afford a quarter of a second, and whose facts code can compute.**

---

## Claude Code: writes the code, never plays the game

Claude Code is the opposite again. It wrote every line of both projects — the Playwright page readers, the move simulator, the baselines, the Jev integrations, the run logs and reports — and it read the TypeSafe docs and the installed SDK's types to do it. But each step takes seconds to minutes. Put it in a game loop and the dino would be dead before the first reply.

Its value is in the work around the decisions:

- **Inspecting the real thing before writing code.** It opened `chrome://dino` in Playwright, found that `window.Runner` no longer exists, and worked out the `addEventListener` hook. For 2048 it found the game's `localStorage` state instead of scraping animated tiles.
- **Turning a hypothesis into a measured experiment.** Ten seeded games per player, five in parallel, a report that shows where Jev and the heuristic disagree — in minutes, not an evening.
- **Reading logs instead of guessing.** Every time something failed, the per-decision JSON log said why.

---

## How I actually used Claude Code

A few habits made the difference between "it wrote some code" and "it ran a useful experiment":

1. **A `CLAUDE.md` with rules, not wishes.** Mine said: code does all the maths, Jev only gets words; one judgment per question; shuffle option order; every game gets a plain-code baseline; never print the API key; every run has a request cap. It followed them — including pointing out when its own baseline broke the "same information" rule.
2. **A `PLAN.md` for the order of work and a `STATUS.md` updated after every step.** Sessions end and context is summarised; a status file means the next session starts from facts, not memory.
3. **A skill for the new API.** TypeSafe publishes a Claude Code plugin; installing it meant the code was written against current docs and the SDK's real types rather than guesses.
4. **Plan first, small steps, show it running.** "Show me the plan before writing files," then one piece at a time, each one run and shown.
5. **Keep it on a short leash with long-running work.** This is where it went wrong for me. Its script quietly restarted the game after the first run crashed at 700, so the only number I saw was 700 — while the second run, which I was watching pass 10,000, was killed without ever being reported. Then it restarted everything with a 60-second cap I'd never asked for. Each time, stopping it and asking "what is going on, what is the plan?" got a clear explanation and a fix — but it's a reminder that an agent optimising for "finish the task" needs a human watching what it's measuring.

It made real bugs too: a race where the game's first state arrived a frame late, a heuristic that saw less than Jev, an obstacle tracker that lost a cactus. None were the model's fault, and none were found by reading code — all were found in the logs it had been told to write.

---

## Three tools, three jobs

| | Plain code | Jev (decision model) | Claude Code (coding agent) |
|---|---|---|---|
| **Does** | runs a known rule | makes a judgment from described facts | writes, runs and debugs the code |
| **Speed** | microseconds; ~2,000 reads/s here | ~230 ms median, p99 ~470 ms | seconds to minutes per step |
| **Cost here** | free | under $1 for every experiment combined | a coding-agent session |
| **Great at** | stable rules, timing, maths | fuzzy calls a rule would get wrong | building and measuring things fast |
| **Can't** | handle cases you didn't foresee | do maths, write code, hit a 90 ms window | sit inside a real-time loop |

The pattern that fell out of the experiments is a stack, not a contest:

- **Claude Code builds** the system and the experiment around it.
- **Plain code runs the loop** — reading state, doing the arithmetic, keeping time.
- **Jev is called only where a judgment is genuinely fuzzy**, the facts can be computed, and there's time to wait for the answer.

---

## Lessons learned

- **Start with plain code.** If a few lines of `if` solve it, they will beat any model on speed, cost and reliability. Here they scored 169,369.
- **Use a decision model for judgments, not rules.** Jev earned its place only when the facts were rich enough that weighing them mattered.
- **Keep models off the critical path of tight deadlines.** Ask early, act on time in code, and plan for the slowest answer, not the median.
- **Use a coding agent to build and measure, not to decide.** Give it rules in `CLAUDE.md`, a plan, a status file, and make it log everything.
- **Watch what it measures.** An agent can report the wrong number with great confidence; logs and a human glance catch it.
- **Always keep a baseline.** Every interesting result in this series came from comparing against something boring.

Everything — code, logs, numbers — is in [github.com/laxminarayanaboga/jev-playground](https://github.com/laxminarayanaboga/jev-playground).

---

*A hands-on learning experiment with TypeSafe's Jev 1.13, Playwright and TypeScript, built with Claude Code.*
