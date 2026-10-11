# Latency Is a Design Constraint: A Decision Model Plays the Chrome Dino Game

> After 2048, I gave the same AI decision model a game where timing is everything: the dinosaur that runs across Chrome when you're offline. The first design asked it "jump now?" — and the dino died on the second cactus every time, even though the model's answers were 100% correct. The fix wasn't a better prompt. It was asking a different question at a different moment, and letting code own the clock.

In the [previous article](decision-model-plays-2048.html) I made TypeSafe's Jev play 2048, a turn-based game where a 230 ms answer is instant. The dino game is the opposite: a reflex game where obstacles arrive every second or so, at up to 780 pixels per second. If the 2048 experiment was about *what* to tell the model, this one is about *when*.

---

## Getting into chrome://dino

The plan said: open `chrome://dino` in Playwright, find the game's state object (historically `Runner`), and read obstacles and speed from it. Two things on the live page disagreed with every blog post I'd seen.

**The navigation "fails" but the game loads.** `page.goto("chrome://dino")` rejects with `ERR_INTERNET_DISCONNECTED` — because the dino *is* the offline error page — and the page lands on `chrome-error://chromewebdata/` with the game ready. Catch and carry on.

**There's no `window.Runner` any more.** In current Chromium the game is an ES module; only a few constant tables are global. But the game still registers *itself* as an event listener object (`addEventListener("keydown", this)`), so an init script that wraps `addEventListener` catches the instance as it's created:

```ts
await page.addInitScript(`(() => {
  const orig = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, l, o) {
    if (l && typeof l === "object" && l.handleEvent && "tRex" in l && !window.__runner) window.__runner = l;
    return orig.call(this, type, l, o);
  };
})()`);
```

From there everything is readable: `currentSpeed`, `crashed`, the dino's position and whether it's jumping or ducking, and every obstacle's type, position, width and speed offset. (One TypeScript gotcha on the way: `tsx` injects a `__name` helper into named functions, which doesn't exist inside the page, so in-page code goes in as strings.)

---

## The baseline: three lines of `if`

As with 2048, the model gets a plain-code opponent. Code works out how many milliseconds until the next obstacle reaches the dino, and:

```ts
if (kind === "high bird") return "wait";                  // run under it
if (kind === "mid bird") return arrivalMs <= 150 ? "duck" : "wait";
return arrivalMs <= 150 ? "jump" : "wait";                // cacti and low birds
```

That's the whole bot. It's frighteningly good: once the game reaches its top speed, nothing changes, so the same 150 ms rule just keeps working. One run went past **97,000 points in 83 minutes** and was still going when I wrote this.

---

## Design one: let the model decide *now*

The plan for the model was the obvious one. Code computes the time until the obstacle arrives, subtracts the model's expected latency, and turns the result into a word — `far`, `approaching`, `in the window`, `past the window`. The model sees the obstacle and that word, and picks jump, duck or wait. Because one request at a time (~230 ms each) is too coarse for a jump window, code fires a fresh request every 40 ms while an obstacle is close, and acts on the newest answer.

It crashed at a score of **102**. After tuning, **51**.

The logs were unambiguous, and not about the model. Of 118 answers in the first run, **every single one was right** for the words it was given: far → wait, approaching → wait, in the window → jump, past it → jump, with probabilities of 0.93 to 1.0. The model did its job perfectly.

What failed was the arithmetic around it:

| | |
|---|---|
| Model latency, request to answer | 192 – 316 ms |
| Width of a safe jump window | about 90 ms |

To say "in the window", code has to predict when the answer will *land*. When the guess is 100 ms off — and with a 120 ms spread it often is — the dino jumps 100 ms early and comes down on the cactus. In one crash, a request went out while the latency estimate was ~310 ms, the answer came back in 218 ms, and the dino jumped at 289 ms instead of 150. You can't tune your way out of that: **the jitter alone is wider than the window.**

---

## Design two: decide *what* early, let code decide *when*

So I changed the question, not the wording. As soon as an obstacle appears on screen — typically 600–800 ms before it arrives — code asks once:

```ts
choice("The dino is running towards `obstacle`. What should it do when the obstacle reaches it?", {
  jump: "`obstacle` is on the ground or flying low at the dino's feet, so jumping over it clears it.",
  duck: "`obstacle` is flying at the height of the dino's head, so ducking under it avoids it.",
  wait: "`obstacle` is flying above the dino's head, so the dino keeps running under it.",
});
```

The state is a single phrase, like `"mid-height bird, flying at the dino's head"`. Code stores the answer against that obstacle and carries it out at exactly 150 ms — the same moment the `if` bot uses. Latency stops mattering as long as the answer arrives before the obstacle does, and it had about half a second of slack.

Getting it right took three code fixes, none of them about the model: a jump blocked while the dino was still in the air was never retried; ducking was tied to code's own bird classification instead of the model's answer; and matching obstacles between reads by their estimated arrival time once lost track of a cactus, which then looked "new" and got asked about too late. The last one was fixed by stamping a stable id on each obstacle object inside the page.

Then it ran properly:

| Run | Score | Result |
|---|---|---|
| 1 | 4,336 | crashed — see below |
| 2 | **29,787** | still alive after 26 minutes, stopped by my 2,000-request safety cap |

Across those 2,000 requests the model classified **1,998 of 1,998 obstacles correctly** — 664 small cacti, 675 large cacti, 226 low birds, 209 mid birds and 225 high birds — at about one request per second, for **$0.035** in total.

---

## The run that died: the latency tail

Run 1 crashed on a small cactus that the model never got to decide about. The request went out 735 ms ahead, and no answer had arrived by the time the dino had to jump.

| Latency | |
|---|---|
| median | 242 ms |
| p95 | 361 ms |
| p99 | 474 ms |
| slowest answered | 605 ms |

One request in two thousand was too slow, and that was enough to end a run that was going well. This is the part that matters for anything real-time: averages describe the experience, but **the tail decides whether it works.** The standard fixes — hedging (send two identical requests and take the first answer) or a fallback when no answer has arrived — are cheap here; at these prices, doubling every request costs about seven cents per 25 minutes.

---

## Is the model actually doing anything?

Honestly: not much more than a lookup. Once code has turned the obstacle into "mid-height bird, flying at the dino's head", choosing *duck* is not a hard judgment, and the model matched the `if` bot's decisions exactly rather than beating them. That's what I expected going in, and the experiment was never really about the dino. It was about where a ~230 ms, slightly jittery judgment can sit in a real-time loop — and the answer is: **ahead of the moment, not at it.**

---

## Lessons learned

- **Don't put a jittery call on the critical path of a tight deadline.** If the spread of your latency is wider than your window, no tuning will save you.
- **Split "what" from "when".** Ask the model early about what to do; let deterministic code execute it at the right moment. Latency then only has to beat a generous deadline, not hit a narrow one.
- **Plan for the tail, not the median.** p99 and the occasional outlier decide whether a real-time system survives. Hedge, or fall back.
- **When it fails, check the logs before the prompt.** Every crash in this project was in my code — timing, retries, object tracking — while the model's answers were right every time.
- **Inspect the live page.** `chrome://dino` no longer exposes `Runner`; trusting older write-ups would have stalled the whole thing.
- **A three-line baseline can be unbeatable.** Measure against it anyway; it tells you what the model is (and isn't) adding.

All the code, run logs and numbers are in [github.com/laxminarayanaboga/jev-playground](https://github.com/laxminarayanaboga/jev-playground).

---

*A hands-on learning experiment with TypeSafe's Jev 1.13, built with Playwright and TypeScript, pair-programmed with Claude Code. Scores and latencies are from a handful of runs on one machine; your results will vary.*
