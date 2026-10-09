# GroftPay

**GroftPay turns your Canton payment identity into a username.** Create a request, share a link or a QR
code, and the payer settles it in **CC** through [Grofty Wallet](https://grofty.cc) — no account, no
custody, no copying a long party id by hand.

The first users are **Canton freelancers and independent builders**: designers, developers, contract
engineers, bounty hunters and small Canton teams who need to get paid for their work by clients who
already hold CC.

> **Status.** User-created payment profiles, request creation, QR sharing, device-local payment history, real
> Grofty wallet connection and **real CC settlement** all exist today and run against Canton TestNet.
> The prototype has no backend — see [Known limitations](#known-limitations).

---

## 1. What GroftPay is

GroftPay is a payment-request layer for Canton. It helps a Canton user ask for a payment with a
shareable link and QR code, and it hands wallet connection and transaction approval to
[Grofty](https://grofty.cc) over CIP-0103.

It is deliberately thin: it builds the request, presents it, and gets out of the way. GroftPay never
holds funds and never sees a key.

## 2. The problem

Getting paid on Canton usually means sending someone your full party id and then explaining, in your
own words, how they should send the CC: which wallet, which asset, how much, and what it is for. That
is a lot of repeated context for something as ordinary as an invoice.

The money side is not the problem — Canton settles just fine. The missing piece is a **request**: a
single artefact that carries the recipient, the amount and the purpose, and that a payer can act on
without being walked through it.

GroftPay turns that into a link. The payer opens it, sees exactly what they are paying for, connects
Grofty, and approves. The result is a normal Canton transaction with a real ledger update id.

## 3. Who it is for

- Canton freelancers and independent builders
- Bounty hunters paid in CC
- Creators and consultants who invoice clients in Canton
- Small Canton teams collecting a payment from a counterparty

Each user establishes their own Canton payment identity by connecting Grofty, then creates a GroftPay profile that gives that identity a human username. `Taiken` is only a built-in demo profile, labelled as such.

## 4. How it works

1. The user connects Grofty. The wallet supplies the Canton Party ID, network and CC balance; a
   GroftPay username is optional but gives that identity a shareable profile.
2. The recipient creates a request - an amount, an optional description of the work, and an optional
   client/project label. On a profile, the recipient party id is already attached; otherwise it
   defaults to the connected wallet's own party.
3. GroftPay generates a shareable payment URL. The whole request travels inside the URL.
4. The recipient shares the URL or the QR code (copy, native share, or show the QR on screen).
5. The payer opens the payment page - no profile or account required.
6. The payer connects Grofty.
7. GroftPay reads the wallet's party id, network and CC balance and checks them against the request.
8. The payer initiates the CC transfer; Grofty signs and submits it; Canton executes the transaction.
9. GroftPay records the **real settlement receipt** - the ledger update id returned by the wallet.
   Until that id exists, the request is not marked settled.
## 5. Identity and profile flow

```
Recipient (profile owner)                 Payer
(connect Grofty)                          (no profile needed)
  -> Party ID, network, CC balance
choose username
  -> profile saved in this browser
/profile/<username>  (@handle + name)
  enter amount
  enter what it is for
  create request
      |
      v
  link + QR code  ---------------------->  /pay/<code>
                                            review profile + amount + recipient
                                            connect Grofty
                                            approve CC transfer
                                                  |
                                                  v
                                            Grofty -> Canton TestNet
                                                  |
                                                  v
                                            settlement receipt (ledger update id)
```

The connected wallet establishes the Canton payment identity; the profile gives it a human face. The
payment page at `/pay/[id]` is the single canonical payer flow - there is no second, competing payment
path.
## 6. Payment profiles

Routes: `/profile` (directory), `/profile/[username]` (a profile) and `/profile/create` (onboarding).
The built-in sample is `/profile/taiken`.

A profile is the human face of a Canton payment identity. It carries:

- a username (the URL slug and the `@handle`)
- a display name, with an optional headline and bio
- the Canton Party ID used as the recipient (shown truncated, with a copy action - it is never the
  main content of the page)
- the network the wallet reported
- the preferred payment asset (CC)
- a **pay-me flow**: enter an amount and what the work was, and GroftPay builds a request with the
  profile's party id already attached

**Creating a profile.** After connecting Grofty, `/profile/create` shows the detected Canton identity
(Party ID, network and CC balance) and asks for a username. Display name, headline and bio are
optional. The profile is saved in this browser against the connected Party ID - the Party ID is read
from the wallet and is never invented or hard-coded.

**Persistence, honestly.** There is no user database. A profile the visitor creates is stored in
`localStorage` under `groftpay.profiles.v1` and is read through `src/lib/profile-store.ts`, which is
the single seam a real backend would replace. Consequences:

- a profile exists only in the browser that created it
- clearing site data removes it
- a username is unique within that browser only - it is **not registered globally**, and GroftPay
  never claims it is
- the raw Party ID is the real identity; the username is a local label

**The demo profile.** `Taiken` (`/profile/taiken`) is a static sample defined in `src/lib/profiles.ts`
and labelled **Demo profile** everywhere it appears. It exists only so the product can be explored
without a wallet, and it is never presented as the visitor's own identity. An unknown username renders
a clean "no profile at this URL" page that points back at the directory.
## 7. Payment requests and QR

The share surface, shown after a request is created (and on the creator's own view of the request),
contains:

- the payment card: amount, asset, purpose, client label and recipient
- the payment link, with copy
- **Copy payment link**, **Open payment page** and **Show QR** actions, plus native share when the
  browser supports it
- a QR code labelled **Scan to pay**, with a copy-link action and a **Save PNG** download
- a full-screen **presentation mode** — the same QR, large, for showing a phone across a desk
- a copy-ready share message, for example:

  ```
  Payment request: 250 CC for Website development.
  Pay with GroftPay: https://<host>/pay/<code>
  ```

The QR is rendered with `qrcode.react` and always encodes the same `<host>/pay/<code>` URL that the
copy actions use, so the code can never point at a different request. It is only rendered once the
browser origin is known, so a QR is never generated for an incomplete URL.

## 8. Payment history

Route: `/history`, plus a short version on the landing page and the profile.

The history joins the two browser-local stores:

- requests this device created (`groftpay.requests.v1`)
- settlement receipts this device recorded (`groftpay.settlements.v1`)

Each row shows the description, amount, status, relative date, the recipient, and — when a settlement
was recorded here — the ledger update id. Requests link back to their payment page; payments that were
only ever sent (a settlement with no matching locally created request) show as **Payment sent**.

Status is derived, never invented:

- **Settled** — a receipt with a real ledger update id is stored in this browser.
- **Awaiting** — no receipt is stored here. This also covers a request that was paid from another
  device, which GroftPay cannot see yet, and it never means "failed".

## 9. Grofty integration

Settlement is a genuine CC transfer submitted to Canton through Grofty. There is no mock path: if the
wallet does not return an executed transaction, the request stays unsettled.

### The API used, and where

| Piece | Value |
| --- | --- |
| SDK | `@groftylabs/dapp-sdk@0.2.0` |
| Discovery / provider | `GroftyProvider` (in `src/components/grofty/grofty-root.tsx`) |
| Wallet state | `useGrofty`, `useGroftyAccount`, `useConnect`, `useDisconnect` (wrapped by `src/lib/grofty/use-wallet.ts`) |
| Party id + network | `account.partyId`, `account.networkId` |
| CC balance | `GroftyClient.getBalance()`, defensively parsed in `src/lib/grofty/balance.ts` |
| Transaction call | `GroftyClient.prepareExecuteAndWait(params)` |
| Params type | `SimpleTransferParams` — `{ receiver, amount, tokenSymbol?, memo? }` |
| Result type | `PrepareExecuteAndWaitResult` — `{ tx: TxExecutedEvent }` |
| Receipt fields | `tx.payload.updateId`, `tx.payload.completionOffset`, `tx.commandId` |
| Implemented in | `src/lib/grofty/settlement.ts` (`submitCcTransfer`, `buildCcTransferParams`) |
| Called from | `src/app/pay/[id]/pay-client.tsx` (`handlePay`) |
| Receipt storage | `src/lib/settlement-store.ts` (browser-local, keyed by request id) |
| Receipt UI | `src/app/pay/[id]/settlement-receipt.tsx` |

The React binding `useSubmitTransaction` is deliberately not used: it calls the older `submitAndWait`,
which correlates the receipt through events and can mix up concurrent submissions. GroftPay calls
`prepareExecuteAndWait` directly.

### What is sent

```ts
{ receiver: request.receiver,        // Canton party id from the request
  amount: request.amount,            // decimal string, e.g. "25"
  tokenSymbol: "CC",                 // the SDK's documented default symbol
  memo: request.memo }               // omitted when empty
```

`amount`, `receiver`, `asset` and `memo` all come from the payment-request model — the same values the
payer sees on the page — so the payload cannot drift from what was displayed. The optional client
label is display-only and is not sent to the ledger.

### Guards before a signature is ever requested

- **TestNet build.** `assertSettlementNetwork()` refuses to submit when Grofty reports Canton TestNet
  (`canton:da-mainnet`), so a TestNet demo can never move real funds. Any other wallet-reported
  network - including an unreported one, where the wallet stays the authority - is allowed and
  recorded on the receipt.
- **Balance preflight.** `checkCcBalance()` compares the wallet-reported CC balance against the request
  using exact decimal comparison (`compareDecimal`, BigInt-scaled — no floating-point drift). A known
  shortfall disables Pay and explains the numbers. An unreadable balance does not block; the wallet is
  the final authority.
- **Unsettled requests only.** A recorded settlement is terminal for that request id, so the same
  browser cannot pay it twice.

### Only an executed ledger transaction counts

`readExecutedTransaction()` accepts exactly one shape: `tx.status === "executed"` **and** a non-empty
`tx.payload.updateId`. Everything else is a failure:

| Wallet behaviour | GroftPay result |
| --- | --- |
| `{ tx: { status: "executed", payload: { updateId } } }` | Settled — receipt shown with the update id |
| `{ tx: { status: "failed" } }` | "Grofty reported the transfer as failed. Nothing was settled." |
| `undefined` (Grofty 2.0.2/2.0.3) | "Grofty did not return an executed transaction… nothing is marked as settled." |
| Non-terminal status, missing/blank `updateId`, malformed payload | Same as above — never settled |
| Thrown `4001` | "You declined the transfer in Grofty. Nothing was sent." |
| Thrown `4100` | "Grofty needs you to approve this site (and be signed in) before it can sign." |
| Thrown `4900` / `4901` | "Grofty lost its connection to Canton. Reconnect…" |
| Thrown `-32601` | "This Grofty build does not support prepareExecuteAndWait. Update Grofty to 2.0.4 or newer." |
| Thrown `-32603` (includes the 240 s timeout) | "Grofty did not answer in time… check the wallet's activity before retrying." |

### What the receipt does and does not prove

The receipt proves the **wallet submitted a transaction to Canton and the ledger returned an update
id**. It does **not** prove the recipient can immediately spend the funds: the SDK exposes no
preapproval surface (no `preapproval` / `TransferPreapproval` / Amulet-rule APIs exist in 0.2.0), and
the plain-transfer shape delegates Amulet-rule and preapproval handling to the wallet. If the recipient
has no transfer preapproval, the wallet may create a transfer instruction the recipient must accept —
and the executed event does not distinguish that case. GroftPay says exactly this on the receipt
instead of claiming the money landed.

## 10. Payment request architecture

There is no backend, no database and no request registry. The request **is** the link:

```
https://<host>/pay/<base64url(JSON)>~<checksum>
```

- The payload is a compact JSON object with single-letter keys (`v, i, r, a, s, t, m, n, c`) so links
  stay short.
- The trailing checksum is a 32-bit FNV-1a hash of the payload in base36 (6 characters). A truncated,
  wrapped or hand-edited link fails the check and renders an explanatory error instead of a wrong
  payment.
- `<id>` is decoded on the server (`src/app/pay/[id]/page.tsx`) with Zod validation, so a malformed
  link can never produce a partially-correct request.
- The request model defines **no expiry field**, so none is invented or enforced.

The model is asset-aware (`asset: "CC"`), and CC is the only asset GroftPay requests today.

### What is stored, and where

Browser `localStorage` only:

- `groftpay.requests.v1` — requests created in this browser (so the landing page, profile and
  `/history` can list them).
- `groftpay.settlements.v1` — settlement receipts recorded in this browser, keyed by request id.

That data never leaves the device. Nothing is stored server-side.

## 11. Current features

- Payment requests for CC with an amount, a description of the work, and an optional client/project
  label
- Shareable payment links that carry the whole request and are checksum-protected
- QR codes with a scan-to-pay label, copy-link, PNG download and a full-screen presentation mode
- User-created payment profiles (`/profile/create`) stored in the browser, with a pay-me request flow
- Payment history (`/history`) joined from local requests and settlements
- Grofty wallet connection over CIP-0103
- CC balance reading and preflight checks
- TestNet transaction flow via `prepareExecuteAndWait`
- Settlement receipt with the real Canton ledger update id
- Lifecycle/status handling: awaiting, settled, rejected, unauthorized, wrong network, insufficient
  balance, timeout and no-receipt, each with its own message

Not built: any other Canton asset, request expiry, server-side status, accounts, a database, or
custody.

## 12. Known limitations

- **Profiles are browser-local.** A profile created at `/profile/create` is stored in `localStorage` against the connected Party ID. It is not shared between devices, usernames are not registered globally, and there is no account. The static `Taiken` profile is a labelled demo only.
- **Payment history is device-local.** Requests and receipts are stored in the browser, so history is
  not shared between devices.
- **No shared request status.** A receipt is stored in the *paying* browser, so the creator does not
  see "paid" on their own device. Cross-device status needs infrastructure that is deliberately
  deferred. This is why every history row that is not settled says *Awaiting*, not *Paid*.
- **CC only.** `asset` exists in the model, but CC is the only supported value.
- **No request expiry.** The model has no expiry field, so none is enforced.
- **No preapproval visibility.** Whether a recipient must accept a transfer instruction is not visible
  through this SDK.
- **TestNet settlement needs Grofty.** Everything except signing a transfer works without the
  extension; completing a payment requires a Grofty wallet on Canton TestNet.
- **No backend, accounts or custody.** The only persisted state is browser-local.

## 13. Setup

Requirements: **Node 20.9+**. For settlement, **Grofty Wallet 2.0.4+** on Canton TestNet.

```bash
npm install
npm run dev          # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

Quality gates:

```bash
npm run typecheck    # next typegen + tsc --noEmit
npm run lint         # eslint
npm run build        # production build (Turbopack)
```

**Environment variables:** none. The app has no server-side configuration and no secrets.

There is no test runner configured in the repo yet. The settlement guards described above are pure
functions (`compareDecimal`, `assertSettlementNetwork`, `checkCcBalance`, `readExecutedTransaction`,
`buildCcTransferParams`) and were verified with a throwaway assertion pass during development;
committing a real suite is on the roadmap.

## 14. Architecture

```
GroftPay
  payment profiles (browser-local, tied to the wallet party id)
  payment requests
  share links + QR codes
  payment status
  settlement receipts
        │
        ▼
Grofty  (CIP-0103, @groftylabs/dapp-sdk)
  wallet
  party id
  signing
  CC balance
  prepareExecuteAndWait
        │
        ▼
Canton TestNet
  settlement
```

## 15. Demo flow

1. Open GroftPay.
2. To create a real identity profile: open `/profile/create`, connect Grofty, confirm the detected
   Canton identity, choose a username, and land on your own `/profile/<username>`.
3. Create a request from your profile (or from the homepage) - the recipient is your connected Party
   ID, already attached. Share the generated link or QR code.
4. Open the payment link and review the recipient profile, amount and purpose.
5. Connect Grofty as the payer.
6. Complete the payment when a valid TestNet Grofty wallet is available - approve the CC transfer in
   the wallet.
7. Show the settlement receipt with the Canton ledger update id.

Without a wallet, every screen up to a real transfer works: the labelled **Demo profile** at
`/profile/taiken` demonstrates the pay-me flow, and request creation, sharing and the payment request
page all work with no Grofty installed. Real settlement requires Grofty on Canton TestNet; without it,
the payment page stops at the connect step and nothing is ever marked settled.
## 16. Project structure

```
src/
  app/
    layout.tsx                 # shell: dark canvas, header, footer, GroftyProvider
    page.tsx                   # product homepage: hero, request builder, profiles, how-it-works
    not-found.tsx              # branded 404
    globals.css                # Tailwind v4 theme tokens + component classes
    history/page.tsx           # local payment history
    profile/
      page.tsx                 # profile directory (local profiles + labelled demo)
      create/page.tsx          # onboarding: connect -> detect identity -> choose username
      [username]/page.tsx      # profile page + pay-me flow
    pay/[id]/
      page.tsx                 # decodes the link server-side, dynamic metadata, noindex
      pay-client.tsx           # payer view (real settlement) + creator view (share tools)
      settlement-receipt.tsx   # the executed-transaction receipt
      invalid-link.tsx         # tampered / unreadable link
  components/
    home-hero.tsx              # connect-aware hero (connected identity vs. connect CTA)
    profile-view.tsx           # client profile page (resolves local + demo profiles)
    profile-directory.tsx      # client directory of profiles
    profile-setup.tsx          # profile creation flow
    create-request-form.tsx    # shared request builder (wallet-defaulted, profile-locked)
    request-link-panel.tsx     # share link, actions, share message
    qr-panel.tsx               # QR display, copy, PNG download, presentation mode
    request-card.tsx           # the request "invoice" surface
    payment-history.tsx        # joins requests + settlements into a history
    site-header.tsx            # nav + Grofty connect button
    site-footer.tsx
    ui/                        # button, card, badge, field, logo, spinner, copy-button
    grofty/                    # provider, connect button, wallet chip, wallet panel
  lib/
    payment-request.ts         # schema, codec, validation helpers (unchanged)
    profiles.ts                # profile model, username validation, demo profile
    profile-store.ts           # browser-local profiles (backend seam)
    use-profiles.ts            # React bindings for the profile store
    settlement-store.ts        # verified receipts, browser-local
    requests-store.ts          # localStorage store with a stable snapshot
    format.ts, utils.ts, demo.ts, use-client-value.ts
    grofty/
      settlement.ts            # CC transfer: params, guards, receipt verification, outcome types
      use-wallet.ts            # discovery/account/connect/balance in one hook
      errors.ts                # SDK error-code mapping
      balance.ts               # defensive CC balance reader
      network.ts               # Canton network labels
```
## 17. Design notes

- **Dark-first, tokenised.** All colour lives in `@theme` in `src/app/globals.css`
  (`ink`, `mist`, `mint`, `violet`); the ambient background is two masked fixed layers.
- **No webfont download at build time.** The type stack is system-first to keep builds hermetic and
  fast; amounts use tabular figures.
- **Honest states everywhere.** "Detecting Grofty", "Not reported" for an unreadable balance, the exact
  refusal reason when a transfer cannot be submitted, a history that says *Awaiting* rather than
  guessing, and a receipt that states what it does not prove.