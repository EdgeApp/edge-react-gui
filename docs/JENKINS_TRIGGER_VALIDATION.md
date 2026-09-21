# Jenkins trigger validation

Date: September 3, 2026

PR: [#6166 — Remove duplicate Jenkins push trigger](https://github.com/EdgeApp/edge-react-gui/pull/6166)

## Result

The proposed change was validated directly in the live
`EdgeApp/edge-react-gui` multibranch job using the dedicated
`test-parm` and `test-colby` branches.

| Controlled scenario | Before change | After change |
|---|---:|---:|
| Isolated Parm update | Extra Parm build in 4/5 trials | Extra Parm build in 0/5 trials |
| Colby updated while Parm remained active | Extra Parm build in 10/10 trials | Extra Parm build in 0/10 trials |
| Colby's own update in the overlap series | Extra Colby build in 5/10 trials | Extra Colby build in 0/10 trials |

Across all 15 post-change trials:

- all 15 Parm updates produced exactly one Parm build;
- all 10 Colby updates produced exactly one Colby build;
- all 25 expected builds completed successfully;
- no extra same-revision build occurred.

The production PR removes only this three-line block:

```groovy
triggers {
  githubPush()
}
```

GitHub Branch Source remains responsible for normal branch-update delivery.

## Test design

The test used a frozen lightweight Jenkinsfile on the two dedicated branches.
Parm remained active for a fixed window before checkout. Colby performed a
short checkout and delay. The harness did not install dependencies, compile the
application, run application tests, sign, upload, or deploy anything.

The baseline and post-change harness trees differed only by the same
`githubPush()` block and its adjacent blank line. That is four textual lines
in the harness, while the production PR itself deletes the three-line block.

Two series were measured before and after the change:

1. **Isolated update:** update Parm once and count all Parm builds for that
   revision.
2. **Timed overlap:** update Parm, confirm its expected build is active, then
   update Colby and count all builds for both controlled revisions.

Every retained overlap was classified after completion using archived Branch
Source event time, queue-entry time, and build-completion time.

## Primary evidence

### Isolated Parm updates

Before the change, four of five controlled Parm revisions produced two Parm
builds:

- [#41](https://hq.edge.app/job/edge-react-gui/job/test-parm/41/) and
  [#42](https://hq.edge.app/job/edge-react-gui/job/test-parm/42/)
- [#44](https://hq.edge.app/job/edge-react-gui/job/test-parm/44/) and
  [#45](https://hq.edge.app/job/edge-react-gui/job/test-parm/45/)
- [#46](https://hq.edge.app/job/edge-react-gui/job/test-parm/46/) and
  [#47](https://hq.edge.app/job/edge-react-gui/job/test-parm/47/)
- [#48](https://hq.edge.app/job/edge-react-gui/job/test-parm/48/) and
  [#49](https://hq.edge.app/job/edge-react-gui/job/test-parm/49/)

The fifth revision built once as
[#43](https://hq.edge.app/job/edge-react-gui/job/test-parm/43/).

After the change, all five revisions built exactly once as Parm
[#61](https://hq.edge.app/job/edge-react-gui/job/test-parm/61/) through
[#65](https://hq.edge.app/job/edge-react-gui/job/test-parm/65/).

### Timed Parm/Colby overlap

All ten retained baseline overlaps produced two Parm builds for the same
revision:

| Trial | Parm builds | Colby builds |
|---:|---|---|
| 1 | [#21](https://hq.edge.app/job/edge-react-gui/job/test-parm/21/), [#22](https://hq.edge.app/job/edge-react-gui/job/test-parm/22/) | [#8](https://hq.edge.app/job/edge-react-gui/job/test-colby/8/), [#9](https://hq.edge.app/job/edge-react-gui/job/test-colby/9/) |
| 5 | [#29](https://hq.edge.app/job/edge-react-gui/job/test-parm/29/), [#30](https://hq.edge.app/job/edge-react-gui/job/test-parm/30/) | [#16](https://hq.edge.app/job/edge-react-gui/job/test-colby/16/) |
| 6 | [#31](https://hq.edge.app/job/edge-react-gui/job/test-parm/31/), [#32](https://hq.edge.app/job/edge-react-gui/job/test-parm/32/) | [#17](https://hq.edge.app/job/edge-react-gui/job/test-colby/17/) |
| 7 | [#33](https://hq.edge.app/job/edge-react-gui/job/test-parm/33/), [#34](https://hq.edge.app/job/edge-react-gui/job/test-parm/34/) | [#18](https://hq.edge.app/job/edge-react-gui/job/test-colby/18/) |
| 8 | [#35](https://hq.edge.app/job/edge-react-gui/job/test-parm/35/), [#36](https://hq.edge.app/job/edge-react-gui/job/test-parm/36/) | [#19](https://hq.edge.app/job/edge-react-gui/job/test-colby/19/) |
| 9 | [#37](https://hq.edge.app/job/edge-react-gui/job/test-parm/37/), [#38](https://hq.edge.app/job/edge-react-gui/job/test-parm/38/) | [#20](https://hq.edge.app/job/edge-react-gui/job/test-colby/20/), [#21](https://hq.edge.app/job/edge-react-gui/job/test-colby/21/) |
| 10 | [#39](https://hq.edge.app/job/edge-react-gui/job/test-parm/39/), [#40](https://hq.edge.app/job/edge-react-gui/job/test-parm/40/) | [#22](https://hq.edge.app/job/edge-react-gui/job/test-colby/22/) |
| 12 | [#54](https://hq.edge.app/job/edge-react-gui/job/test-parm/54/), [#55](https://hq.edge.app/job/edge-react-gui/job/test-parm/55/) | [#28](https://hq.edge.app/job/edge-react-gui/job/test-colby/28/), [#29](https://hq.edge.app/job/edge-react-gui/job/test-colby/29/) |
| 13 | [#56](https://hq.edge.app/job/edge-react-gui/job/test-parm/56/), [#57](https://hq.edge.app/job/edge-react-gui/job/test-parm/57/) | [#30](https://hq.edge.app/job/edge-react-gui/job/test-colby/30/), [#31](https://hq.edge.app/job/edge-react-gui/job/test-colby/31/) |
| 14 | [#58](https://hq.edge.app/job/edge-react-gui/job/test-parm/58/), [#59](https://hq.edge.app/job/edge-react-gui/job/test-parm/59/) | [#32](https://hq.edge.app/job/edge-react-gui/job/test-colby/32/), [#33](https://hq.edge.app/job/edge-react-gui/job/test-colby/33/) |

In the first retained trial, the Colby event arrived while Parm #21 was active.
Parm #22 entered the queue 7.814 seconds later, before #21 checked out or
completed. Both Parm builds used revision
`d11152b006ad85231e5efeaf988f80f02b473d4b`. The expected build recorded the
Branch Source cause; the extra build recorded only generic push causes.

After the change, all ten overlap trials produced exactly one Parm build
([#66](https://hq.edge.app/job/edge-react-gui/job/test-parm/66/) through
[#75](https://hq.edge.app/job/edge-react-gui/job/test-parm/75/)) and one Colby
build ([#35](https://hq.edge.app/job/edge-react-gui/job/test-colby/35/) through
[#44](https://hq.edge.app/job/edge-react-gui/job/test-colby/44/)).

In every post-change overlap, the Colby event arrived while Parm remained
active, with 23.494–27.957 seconds remaining. Each expected build recorded one
Branch Source event cause and no generic push cause.

## Exclusions and replacements

Baseline overlap attempts 2–4 produced extra Parm builds, but their queue
entries predated the controlled Colby event. They were reclassified as
isolated-update observations and excluded from the overlap denominator.

Attempt 11 was excluded for the same reason. Replacement attempts 12–14 met
the ordering rule, producing the final declared cohort of ten exact overlaps.
The excluded attempts remain in the
[complete trial ledger](JENKINS_TRIGGER_VALIDATION_TRIALS.csv).

## Secondary Colby observation

In retained baseline overlap trials 1, 9, 12, 13, and 14, Colby's controlled
revision also built twice. In every pair, the expected build recorded Branch
Source and generic causes; the extra build recorded only the generic cause.
Each extra entered the queue while the expected Colby build remained active.

All ten post-change Colby revisions built exactly once. This is corroborating
overlap evidence, not an isolated Colby-only test, because Parm was active at
the same time.

## Consistency checks

An independent read-only review of the retained post-change cohort confirmed:

- all 15 post-change trials were valid;
- no measured window contained an unrelated branch event;
- archived event records were continuous with no rollover;
- child configurations stayed in the expected state throughout each phase;
- the Parm polling-log timestamp did not change in any post-change trial;
- Git revisions agreed across commit, event, update, and Jenkins build records;
- all expected post-change builds succeeded.

The verified manifest covers 627 evidence files (14 MB), including trial
records, Jenkins build metadata, logs, configuration snapshots, and event
snapshots. The archive and its manifest are retained separately rather than
committed to the application repository. The manifest's SHA-256 is
`0dfb815226d3f076aa7b67064ddd247a7c9ba15b1b4cc4fc68c251ad9e0cd7ba`.

## Scope

These results directly cover the isolated-update and timed-overlap scheduling
paths exercised by this validation. They do not claim to eliminate every
possible source of repeated Jenkins requests.

The validation-branch state after measurement does not affect the PR branch or
its merge.
