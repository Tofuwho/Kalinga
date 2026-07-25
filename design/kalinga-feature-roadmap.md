# Kalinga — Feature Roadmap

*A distance-parenting app for OFW families: helping a parent working abroad stay present in their child's daily life, even when timezones and schedules make live contact rare.*

---

## The Five Features

### 1. Shared Timeline
**What it does:** The caregiver at home posts what actually happened in the child's day — a photo, a short caption, a small update. The parent abroad sees it and reacts or replies whenever their shift allows.

**Why it matters:** This is the foundation everything else is built on top of — it's the record of daily life that doesn't currently exist anywhere. A chat thread disappears into scroll; this is meant to be looked back on.

**Depends on:** Nothing else — this is the first thing to build.

---

### 2. Async Presence
**What it does:** A parent records a message — most naturally a bedtime story or a short note — during whatever moment they have (a break, a commute, a quiet hour). It doesn't send immediately. It's held and delivered at the *child's* bedtime, on the child's clock, regardless of what time it is for the parent.

**Why it matters:** This is the core differentiator (see the earlier discussion on why this beats "just use Messenger") — a message sent live, at 2am the parent's time, becomes a random notification for a sleeping or busy child. This makes presence land at the moment it's actually meaningful.

**Depends on:** Shared Timeline's account/profile structure, plus a scheduling engine tied to the child's local time.

---

### 3. Find Your Words
**What it does:** When a parent doesn't know what to say, Kalinga offers a starting line — never a finished message. It nudges toward their own words rather than writing the moment for them.

**Why it matters:** This solves a real, underserved problem: parents often go quiet not because they don't care, but because they don't know what to say after a hard shift. This is the hardest feature for a competitor to copy quickly, since it requires deliberate restraint (an AI that won't just write the message).

**Depends on:** A compose flow to attach the suggestion to — naturally slots into the Async Presence recording/writing screen.

---

### 4. Honest Presence
**What it does:** A quiet week shows up as a quiet week — visibly, to the parent, not hidden or smoothed over. Kalinga won't let a scheduled message stand in for a parent who's checked out.

**Why it matters:** This is the answer to the core risk raised early on — that a parent could use the app as an excuse not to be present ("I don't have to be there today, I'll let my app do it"). Making gaps visible instead of hideable is what keeps the app from becoming that excuse.

**Depends on:** Real usage data from Shared Timeline and Async Presence — this feature has nothing to show until the other two are generating activity.

---

### 5. Propose a Call
**What it does:** The parent and caregiver each see the same dual-clock view (the exact interaction from the landing page), propose a time slot where both the parent's break and the child's actual waking hours overlap, and confirm it together. At the agreed time, both sides get a reminder that deep-links out to whichever calling app they already use (Messenger, Viber, WhatsApp) — Kalinga hands off to the call, it doesn't replace it.

**Why it matters:** Live video calling already exists and works fine on apps everyone has — no reason to rebuild it. What's actually broken is the coordination: unpredictable shifts, limited phone access, and the one-sided guessing game of "are you free right now" that currently falls entirely on the parent. This removes that coordination tax.

**Important honesty note, worth remembering for the pitch:** this can't auto-connect a call inside the target app — a deep link opens the right contact's call screen, but someone still has to tap it on both ends. Frame it as "gets both of you to the right place at the right moment," not "the call happens automatically."

**Depends on:** The dual-clock UI (already built for the landing page) and a notification system.

---

## Build Order — Phased Blocks

Each block is scoped so it can ship and be tested with real families before starting the next one. This isn't a race to build all five — it's meant to be gated by what field work actually validates at each step.

### Block 0 — Foundation
- Accounts for parent + caregiver (child is a profile, not a login)
- Timezone handling as a core primitive — every other feature depends on knowing both sides' local time accurately
- Basic onboarding

### Block 1 — Shared Timeline (first real MVP)
- Caregiver can post an update (photo + caption)
- Parent can view the feed and react
- **This is the smallest version of Kalinga that's usable on its own** — worth shipping and testing before committing to anything else

### Block 2 — Async Presence
- Recording flow (voice or text)
- Delivery scheduling engine tied to the child's local time
- Delivery confirmation, so the parent knows it landed

### Block 3 — Find Your Words
- Suggested starting-line UI, attached to the Block 2 compose flow
- AI integration for generating the suggestion — needs care in prompt design so it nudges rather than writes

### Block 4 — Honest Presence
- Presence tracking, computed from real Block 1 + Block 2 activity
- Weekly visibility grid
- Only makes sense to build once there's real usage data to reflect — building this first would have nothing to show

### Block 5 — Propose a Call
- Reuse the dual-clock scheduling UI from the landing page
- Confirmation handshake between parent and caregiver
- Notification + deep link out to the parent's preferred calling app

---

## Not Yet Decided — Business Track (parallel to feature work, not a build block)

- **Monetization direction:** subscription bundled through deployment/recruitment agencies as a retention perk, vs. bundled as an add-on inside remittance apps like GCash/Maya. Two real paths, not narrowed down yet — likely a decision that should follow field validation rather than precede it.
