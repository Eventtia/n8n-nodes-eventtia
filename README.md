# @eventtia/n8n-nodes-eventtia

This is an n8n community node. It lets you read data from [Eventtia](https://www.eventtia.com) in your n8n workflows, and start workflows from Eventtia's outgoing webhooks.

It ships two nodes: **Eventtia**, which reads data, and **Eventtia Trigger**, which starts a workflow when something changes in Eventtia.

Eventtia is an event management platform for registration, attendee management, workshops and check-in. This node exposes the Eventtia Connect API so you can pull event and attendee data into other systems — a CRM, a spreadsheet, a reporting pipeline.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Trigger](#trigger)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

In n8n, go to **Settings → Community nodes → Install a community node** and enter the package name:

```
@eventtia/n8n-nodes-eventtia
```

See the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation for the full details.

## Operations

The **Eventtia** node is **read-only**. Every operation is a GET; nothing here creates, updates or deletes data in Eventtia. (The Eventtia Trigger node does write, but only its own webhook registrations — see [Trigger](#trigger).)

**Event**
- Get Many — list the account's events, with filters for name, status, update time and templates
- Get — a single event by UUID
- Get by URI — resolve an event from its URI (see [Resolving an event UUID](#resolving-an-event-uuid))
- Get Summary — attendee, attendee type and workshop metrics
- Get Modules — which modules are enabled
- Get Custom Fields — account-level event custom field definitions

**Attendee**
- Get Many — list attendees, with filters for name, email, company, attendee type, payment and check-in status
- Get — a single attendee by UUID
- Get Check-In — event check-in status
- Get Many Checkpoint Check-Ins / Get Many Workshop Check-Ins

**Payment**
- Get Many — deposits and charges for one attendee

**Attendee Type**
- Get Many, Get, Get Form Schema, Get Many Custom Fields, Get Many Group Limits

**Workshop** — Get Many, Get, Get Stats
**Session** — Get Many, Get
**Speaker** — Get Many, Get
**City** — Search

## Trigger

The **Eventtia Trigger** node starts a workflow from an Eventtia webhook. Activating the workflow registers the webhook in Eventtia; deactivating it removes the registration again. Pick one trigger per node.

- **Attendee Created** — an attendee finished registering. Draft attendees don't count; the trigger fires when the record leaves draft.
- **Attendee Updated** — an attendee's details changed. Only a fixed set of columns is watched, and **check-in is not among them**, so checking someone in does not fire this.
- **Event Created** / **Event Updated** — always account-wide, never scoped to a single event. Event Updated fires on any column change.

### Scope

Leave **Event URI** empty to listen across the whole account, or set it to an event's URI (slug) to listen to that event only. Account-wide listening needs the **Account API Key** on the credential; the two Event triggers are account-wide by definition, so the field is hidden for them.

Account-wide `Attendee Updated` is the noisiest combination — it fires for every attendee edit in every event of the account, templates included. Prefer an event scope when you can.

### Output

The node flattens Eventtia's JSON:API envelope the same way **Event → Get by URI** does, so both chain identically:

```json
{
  "id": "9876543",
  "uuid": "8f14e45fceea167a5a36dedd4bea2543",
  "status": "confirmed",
  "fields": { "445566": "Acme Corp" },
  "included": [
    { "id": "12345", "type": "events", "attributes": { "event_uri": "tech-conference-2026" } }
  ]
}
```

`included` is passed through untouched because that is where the attendee payloads keep the event, the attendee type and the custom field definitions. The attendee's own attributes do **not** carry `event_uri` — read it from the event inside `included`, then feed it to **Event → Get by URI** to get the UUID the other operations need. Event payloads have `event_uri` at the top level and no `included` at all.

### Reachability

Eventtia has to be able to reach your n8n. Its sender gives up after 5 seconds and does not retry, so a local n8n needs a tunnel:

```bash
cloudflared tunnel --url http://localhost:5678   # or: ngrok http 5678
WEBHOOK_URL=https://<your-tunnel-host> pnpm run dev
```

**Listen for test event** registers a *separate* URL (`/webhook-test/…`) from the one activation uses, so the two never collide. If n8n stops while listening, that test registration is left behind in Eventtia — it will keep POSTing into a URL that no longer answers, silently. Check `GET /api/v3/web_hooks` after test sessions and remove leftovers:

```bash
curl -X DELETE "https://connect.eventtia.com/api/v3/accounts/$ACCOUNT_UUID/web_hooks" \
  -H "Authorization: Bearer $TOKEN" \
  --get --data-urlencode "target_url=$STALE_URL" --data-urlencode 'trigger=attendee_created'
```

### What the node does not do

- **It does not verify the webhook signature.** Eventtia never returns the signing secret through the API, so the node has nothing to verify against; see [known issue 1](#known-issues-in-eventtias-outgoing-webhooks). What protects the endpoint today is that the webhook URL contains an unguessable id, the same default the built-in Webhook node ships with.
- **It cannot tell you about events it missed.** While the workflow is inactive the registration is gone, and Eventtia keeps no delivery log, so there is no replay. To catch up, use **Attendee → Get Many** with the `updated_since` filter.
- **It does not notice a webhook archived from Eventtia's admin screen.** The API still lists archived rows, so the node believes it is registered and the workflow simply stops receiving.

## Credentials

The node authenticates with **server-to-server credentials**, so it never stores a person's password and can be revoked without touching any user account.

1. In Eventtia, open your user profile and go to the **S2S credentials** tab.
2. Generate a Client ID and Client Secret. **The secret is shown only once** — copy it before closing the page.
3. In n8n, create an *Eventtia API* credential, pick the environment (Production or Development) and paste both values.
4. Optionally fill in **Account API Key** — your account's UUID. Only the Eventtia Trigger node reads it, and only to register account-wide webhooks; leave it empty if every trigger you build is scoped to one event.

The node exchanges those for a token on its own and renews it when it expires, so there is nothing to rotate manually. Use **Test connection** to confirm the credential works before building a workflow.

## Compatibility

Requires n8n 1.x. Built and tested against `n8n-workflow` 2.x.

## Usage

### Resolving an event UUID

Every event-scoped operation takes the event's **UUID** (its `api_key`). Webhook payloads from Eventtia do *not* include it — they carry the event's `event_uri` instead.

Use **Event → Get by URI** to bridge that gap: give it the `event_uri` from the webhook and it returns the event including its UUID, which you then feed to the rest of the operations.

It is the only operation that calls the older v3 API, because v4 has no lookup by URI. Its output is flattened so it chains like every other operation.

### Pagination

The API serves at most 24 records per request. Turning on **Return All** pages through everything; leaving it off returns up to **Limit** records, paging under the hood as needed.

Be mindful of the rate limit of **100 requests/minute**. Pulling every attendee of a large event with Return All can approach it.

### Listing payments across an event

Eventtia has no event-wide payment endpoint — payments are always scoped to one attendee. To cover a whole event, chain **Attendee → Get Many** into **Payment → Get Many**, which runs once per attendee. On large events this multiplies your request count, so watch the rate limit.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Eventtia](https://www.eventtia.com)

## Known issues in Eventtia's outgoing webhooks

Not defects of this node, but limits of what the Eventtia Trigger can offer on top of them:

1. **No signature to verify, from the node's side.** HMAC signing is implemented in Eventtia (`X-Eventtia-Signature: sha256=<hex>` over the raw body, plus `X-Eventtia-Timestamp`, `X-Eventtia-Event` and `X-Eventtia-Delivery`) but it is **not released yet**, and even once it is, the API never returns the per-webhook secret — it is only shown on the event's Webhooks screen, and account-wide webhooks have no such screen. So the trigger node cannot verify anything. If you need verification today, use the built-in **Webhook** node with *Raw Body* on -> **Crypto** node (`Hmac`, `SHA256`, *Binary File* on, binary property `data`, encoding `HEX`) -> **IF** comparing `{{ 'sha256=' + $json.data }}` with `{{ $json.headers['x-eventtia-signature'] }}`, and paste the secret by hand.
2. **Failures are silent.** The sender catches every exception and prints it, which means the Sidekiq retry never fires. Combined with a 5-second timeout, a slow or unavailable receiver loses the event with no record of it. This is why the trigger answers the moment the payload lands rather than waiting for the workflow, and why an inactive workflow drops events invisibly.
3. **PII in logs.** The HTTP client runs with debug output enabled, dumping the full request — attendee data included — into the logs.

## Version history

### 0.2.0

Adds the **Eventtia Trigger** node: webhook-driven triggers for `attendee_created`, `attendee_updated`, `event_created` and `event_updated`, scoped to one event or to the whole account. Adds an optional **Account API Key** to the credential, which account-wide triggers need.

### 0.1.0

Initial release. Read-only coverage of the Connect API v4 (events, attendees, payments, attendee types, workshops, sessions, speakers, cities), plus the v3 event lookup used to resolve a UUID from an event URI.

