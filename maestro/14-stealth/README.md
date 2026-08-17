# Stealth Send and Stealth Swap flows

Maestro coverage for the send-to-address swap UI. Every user-visible branch of
the feature has a flow, and the pieces those flows are built from live in
`../common/stealth-*.yaml` so a later session can drive one specific state
without walking the whole thing by hand.

## Running

The whole suite, minus the two flows that spend money:

```bash
npm run maestro -- test --include-tags stealth maestro
```

One flow:

```bash
npm run maestro -- test maestro/14-stealth/stealth-private-quote.yaml
```

The two funded flows are tagged `stealth-spend` and nothing else, so the command
above never triggers them. Run them deliberately, and in this order:

```bash
npm run maestro -- test maestro/14-stealth/stealth-execute-send.yaml
npm run maestro -- test maestro/14-stealth/stealth-execute-swap.yaml
```

They run opposite directions, so the pair returns the funds to where they
started and costs two spreads rather than emptying one wallet. Let the first
one's deposit confirm before starting the second: a wallet with an unconfirmed
outgoing transaction cannot quote a new send.

Run flows ONE AT A TIME rather than as a tagged batch. A failing flow takes the
maestro driver down with it, and every flow after it then reports
`Failed to connect`, which reads as a suite-wide breakage instead of one bad
flow.

On a machine with more than one simulator booted, pin the device and the driver
port, or the run may attach to the wrong one:

```bash
maestro --device <udid> --driver-host-port <port> test maestro/14-stealth
```

## Account expectations

The flows read wallet names from env vars so they can point at whatever the
signed-in account actually holds. Defaults assume the `edge-funds` roster
account as of 2026-07-30:

| Env var                    | Default      | Needs                                        |
| -------------------------- | ------------ | -------------------------------------------- |
| `STEALTH_SRC_WALLET`       | `My Stellar` | funded above 25 USD for the private branches |
| `STEALTH_DEST_WALLET`      | `My Sonic`   | exists; no balance needed                    |
| `STEALTH_AMOUNT`           | `30`         | fiat, above the 25 USD private floor         |
| `STEALTH_BELOW_MIN_AMOUNT` | `15`         | fiat, between the 10 and 25 USD floors       |
| `STEALTH_PIN_DIGIT`        | `0`          | the account's single repeated relogin digit  |
| `STEALTH_MEMO_CHAIN`       | `Ripple`     | a memo-required destination chain            |

Two preconditions the flows cannot check for you:

- **The source wallet must have no unconfirmed outgoing transaction.** A pending
  send blocks the next one, so the quote never arms and the flow fails on the
  slider rather than on anything it is testing. Running the funded flows
  back-to-back on one wallet hits this.
- **The source wallet must hold more than the amount asked for.** The amounts are
  fiat, so they sit against the floors on their own and need no re-checking as
  prices move, but a wallet that has drifted below `STEALTH_AMOUNT` in value
  fails the private branches on the balance rather than on the branch.

`stealth-send.yaml`, `stealth-swap.yaml` and `stealth-qr-payment-uri.yaml`
request no quote, so they need no balance at all.

## The flows

| Flow                                | Branch it drives                                                     |
| ----------------------------------- | -------------------------------------------------------------------- |
| `stealth-send.yaml`                 | Send scene controls before address entry, plus a memo-chain tag row   |
| `stealth-swap.yaml`                 | Exchange scene toggle card                                            |
| `stealth-qr-payment-uri.yaml`       | scanned payment URI, cross-chain, amount on the recipient side        |
| `stealth-myself-picker.yaml`        | own-wallet destinations grouped same-asset first                      |
| `stealth-cross-asset-quote.yaml`    | plain Swap & Send on a transparent route                              |
| `stealth-private-quote.yaml`        | the toggle invalidating a held quote and refetching a private route    |
| `stealth-below-private-minimum.yaml`| the toggle refusing under the private floor, with no request sent      |
| `stealth-tx-details.yaml`           | a completed stealth transaction's identity rows                        |
| `stealth-execute-send.yaml`         | **spends** a private Stealth Send to the success scene                 |
| `stealth-execute-swap.yaml`         | **spends** a Stealth Swap from the Exchange scene                      |

## Composing your own

Each subflow states its env contract in its header. A walk that needs a live
private quote on a pair the suite does not cover is five `runFlow` steps:

```yaml
- runFlow:
    file: ../common/stealth-launch.yaml
- runFlow:
    file: ../common/stealth-open-send.yaml
    env:
      WALLET: My Tron 2
- runFlow:
    file: ../common/stealth-pick-myself.yaml
    env:
      DEST_WALLET: My Litecoin (new)
- runFlow:
    file: ../common/stealth-set-amount.yaml
    env:
      ROW: You send
      AMOUNT: '30'
- runFlow:
    file: ../common/stealth-toggle.yaml
- runFlow:
    file: ../common/stealth-await-quote.yaml
```

Two things bite when writing these by hand:

- **The confirm slider is a pan gesture.** A coordinate swipe across the track
  does nothing at all. `stealth-slide-to-confirm.yaml` swipes from the thumb by
  id, which is the only form that completes it.
- **Notification cards float over the bottom of every scene**, including the
  slider and the amount rows. `stealth-launch.yaml` swipes them away; skip it
  and later taps land on a card instead of the control underneath.

## Assertions

These flows are for driving the app to a state, not for asserting behavior. Each
one asserts only what it must to gate the next step (that a scene arrived, that
a quote settled, that the slider is live). Behavioral claims belong in the unit
tests and in `src/docs/stealth-send-swap.md`.
