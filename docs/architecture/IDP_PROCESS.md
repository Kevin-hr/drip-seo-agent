# IDP Process

Idea → Design → Prototype → Production.

Every stage has an explicit entry condition and an exit gate. No stage may be
skipped, and a stage is not complete until its evidence exists in this
repository.

```text
Idea
 ↓
Design
 ↓
Prototype
 ↓
Production
```

## Stage 1 — Idea

**Purpose.** Establish what problem is being solved and what "done" means, before
any code exists.

**Entry.** Someone states a problem and a desired outcome.

**Activities.**
- Write the problem in one paragraph, in the operator's own words.
- Write the observable success condition.
- Decide whether the idea is execution-type (a verifiable outcome exists) or
  exploratory-type (the deliverable is an answer, not a change).
- Reject ideas with no verifiable exit condition.

**Exit gate.** The success condition can be expressed as a command or a
measurable state.

**In this project.** The idea was: ChatGPT cannot reliably resolve product SKUs,
and the local automation cannot reliably resolve them either, because it has no
visual or market knowledge. The gap is SKU/entity resolution — not the
MrShopPlus write path, which already worked.

## Stage 2 — Design

**Purpose.** Decide the boundaries before writing the code that has to live
inside them.

**Entry.** Stage 1 exit gate met.

**Activities.**
- Split the system into components with single responsibilities.
- Draw the trust boundaries and state what each layer is forbidden to do.
- Decide which existing, already-proven code is reused and which is replaced.
- Identify every irreversible action and put a gate in front of it.
- Write the decisions down as binding records.

**Exit gate.** Every irreversible action has a named guard, and every component
has a written "must never do" clause.

**In this project.** The design produced the plan-based write contract, the
three-verdict SKU gate, and the decision to reuse the DripOps execution layer
while replacing the SEO decision layer. Boundary D of
`SYSTEM_ARCHITECTURE.md` (the bridge is never publicly reachable) was decided
here.

## Stage 3 — Prototype

**Purpose.** Prove the risky parts work, with no production exposure.

**Entry.** Stage 2 exit gate met.

**Activities.**
- Build the smallest version that exercises every uncertain assumption.
- Make every dangerous path runnable in a safe mode.
- Automate the verification rather than performing it by hand.
- Keep the prototype's own state isolated from production state.

**Exit gate.** The full flow runs end to end against non-production state, with
automated assertions covering every guard.

**In this project.** `--mode simulate` on the bridge and the mock agent on the
plugin side. Verification tooling lives in `tests/`. The prototype phase is
complete: the guards were exercised against a copy of real run state, and a
simulated execution is explicitly labelled `SIMULATED` so it can never be
mistaken for a real write.

## Stage 4 — Production

**Purpose.** Operate the system against live data under the guards proven in
Stage 3.

**Entry.**
- Stage 3 exit gate met with recorded evidence.
- The standard artefact is frozen and hash-pinned.
- Every guard implemented.
- A rollback or recovery position exists for every irreversible action.
- Human approval obtained for each irreversible action.

**Activities.**
- Begin with a single irreversible action, never a batch.
- Verify the result from the outside, not from the component that performed it.
- Record the evidence in `reports/`.

**Exit gate.** The single action succeeds, is verified from the outside, and the
evidence is committed.

**In this project.** Production has **not** started. The freeze at `v0.1.0` is
the production entry gate. The first live single-product execution is the next
action and requires human approval before it runs.

## Where this project stands

```text
Idea         ✓  done
Design       ✓  done
Prototype    ✓  done — evidence in reports/
Production   ▸  entry gate reached, first live action pending human approval
```

## Rules that apply to every stage

1. **Evidence over assertion.** A stage is complete when its exit gate has been
   run and the output recorded — not when someone believes it works.
2. **Reversibility first.** Any irreversible action ships with a guard, a
   recovery position, or both.
3. **One behaviour per change.** Freezes and feature work are never mixed in the
   same step.
4. **The standard is hash-pinned.** A hash mismatch stops the pipeline.
5. **Batches come last.** Single-item operation is proven before any batch is
   authorised.
6. **Failures are recorded.** What did not work is written down next to what did.
