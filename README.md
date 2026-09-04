# @eventtia/n8n-nodes-eventtia

This is an n8n community node. It lets you read and write [Eventtia](https://www.eventtia.com) data in your n8n workflows, and start workflows from Eventtia's outgoing webhooks.

It ships two nodes: **Eventtia**, which reads and writes data, and **Eventtia Trigger**, which starts a workflow when something changes in Eventtia.

Eventtia is an event management platform for registration, attendee management, workshops and check-in. This node exposes the Eventtia Connect API so you can move event and attendee data both ways — pull it into a CRM, a spreadsheet or a reporting pipeline, and register or update attendees from whatever system your registrations come from.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Trigger](#trigger)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Example workflow](#example-workflow)
[Resources](#resources)
[Version history](#version-history)

## Installation

In n8n, go to **Settings → Community nodes → Install a community node** and enter the package name:

```
@eventtia/n8n-nodes-eventtia
```

See the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation for the full details.

## Operations

The **Eventtia** node covers the Connect API v4 in full: every read endpoint, and every write endpoint the API exposes.

**Event**
- Get Many — list the account's events, with filters for name, status, update time and templates
- Get — a single event by UUID
- Get Summary — attendee, attendee type and workshop metrics
- Get Modules — which modules are enabled
- Get Custom Fields — account-level event custom field definitions
- Create — a new event. Needs name, URI, start and end dates, and a default language
- Update — an existing event. The URI, default language, event type and template flag are fixed at creation

**Attendee**
- Get Many — list attendees, with filters for name, email, company, attendee type, payment and check-in status
- Get — a single attendee by UUID
- Get Check-In — event check-in status
- Get Many Checkpoint Check-Ins / Get Many Workshop Check-Ins
- Create — register an attendee. Needs first name, last name, email and an attendee type ID
- Update — change an attendee's details or move them to another attendee type
- Confirm / Reject — set the registration status
- Resend Email — send the registration email again

**Payment**
- Get Many — deposits and charges for one attendee
- Create — register a manual deposit against an attendee's balance
- Delete — remove a deposit. Charges, discounts and taxes cannot be deleted

**Speaker**
- Get Many, Get
- Create, Update

**Attendee Type**
- Get Many, Get, Get Form Schema, Get Many Custom Fields, Get Many Group Limits
- Create, Update
- Create Custom Field / Update Custom Field — the registration form fields of a type. Which options apply depends on the input type you pick, and the form only offers the relevant ones

**Workshop**
- Get Many, Get, Get Stats
- Create — name and description are per language; sessions, pricing and per-attendee-type visibility are set here
- Update — name and description only, the rest is fixed at creation

**Session**
- Get Many, Get
- Create, Update
- Archive — also cancels every active enrolment in the session
- Enroll Attendee / Unenroll Attendee — books or cancels a seat and recalculates the attendee's charges

**Checkpoint**
- Create, Update, Archive

The API has no checkpoint listing, so a checkpoint ID only comes from the Create response or from **Attendee → Get Many Checkpoint Check-Ins**.

**City** — Search

### Archiving

**Session → Archive** and **Checkpoint → Archive** are soft deletes in Eventtia — the record stays, but nothing in this node brings it back. **Session → Unenroll Attendee** cancels a booking outright. All three are named for what they do so that an AI Agent using this node as a tool reads the consequence, not just the verb.

## Trigger

The **Eventtia Trigger** node starts a workflow from an Eventtia webhook. Activating the workflow registers the webhook in Eventtia; deactivating it removes the registration again. Pick one trigger per node.

- **Attendee Created** — an attendee finished registering. Draft attendees don't count; the trigger fires when the record leaves draft.
- **Attendee Updated** — an attendee's details changed. Only a fixed set of columns is watched, and **check-in is not among them**, so checking someone in does not fire this.
- **Event Created** / **Event Updated** — always account-wide, never scoped to a single event. Event Updated fires on any column change.

### Scope

Leave **Event URI** empty to listen across the whole account, or set it to an event's URI (slug) to listen to that event only. Account-wide listening needs the **Account API Key** on the credential; the two Event triggers are account-wide by definition, so the field is hidden for them.

Account-wide `Attendee Updated` is the noisiest combination — it fires for every attendee edit in every event of the account, templates included. Prefer an event scope when you can.

### Output

The node flattens Eventtia's JSON:API envelope so the payload chains like any other operation's output:

```json
{
  "id": "9876543",
  "uuid": "8f14e45fceea167a5a36dedd4bea2543",
  "status": "confirmed",
  "fields": { "445566": "Acme Corp" },
  "included": [
    {
      "id": "12345",
      "type": "events",
      "attributes": {
        "event_uri": "tech-conference-2026",
        "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      }
    }
  ]
}
```

The top-level `uuid` is the **attendee's**. `included` is passed through untouched because that is where attendee payloads keep the event, the attendee type and the custom field definitions — and the event entry is where the **event's** UUID lives, which every event-scoped operation needs. Event payloads have their attributes at the top level and no `included` at all.

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

Every event-scoped operation takes the event's **UUID** (its `api_key`). Trigger payloads carry it inside `included`, on the entry of type `events`:

```
{{ $json.included.find(item => item.type === 'events').attributes.uuid }}
```

Outside a trigger, **Event → Get Many** returns the UUID of every event in the account.

### Custom fields

**Event → Create/Update** and **Attendee → Create/Update** both take a **Custom Fields** box of ID/value pairs. The IDs are numeric and come from the API, not from the field labels:

- Event custom fields → **Event → Get Custom Fields**
- Attendee custom fields → **Attendee Type → Get Many Custom Fields**, for the attendee type you are registering under

### Date formats

Eventtia is not consistent here, so the node keeps dates as plain text rather than n8n date pickers, which would send ISO 8601 and be misread:

- Event **Start Date** / **End Date** — `DD/MM/YYYY - HH:MM`, in the event's timezone
- Attendee **Birthdate** — `YYYY-MM-DD`

### Pagination

The API serves at most 24 records per request. Turning on **Return All** pages through everything; leaving it off returns up to **Limit** records, paging under the hood as needed.

Be mindful of the rate limit of **100 requests/minute**. Pulling every attendee of a large event with Return All can approach it.

### Listing payments across an event

Eventtia has no event-wide payment endpoint — payments are always scoped to one attendee. To cover a whole event, chain **Attendee → Get Many** into **Payment → Get Many**, which runs once per attendee. On large events this multiplies your request count, so watch the rate limit.

## Example workflow

An attendee registers for `tech-conference-2026`, and the workflow pulls their full
record from the API. It shows the one thing every Eventtia workflow needs: the event
UUID that every event-scoped operation takes, read straight out of the trigger payload
(see [Resolving an event UUID](#resolving-an-event-uuid)).

After importing, select your Eventtia credential on both nodes and change the
**Event URI** on the trigger to your own event.

```json
{
  "name": "Eventtia - fetch a newly registered attendee",
  "nodes": [
    {
      "parameters": {
        "trigger": "attendee_created",
        "eventUri": "tech-conference-2026"
      },
      "type": "@eventtia/n8n-nodes-eventtia.eventtiaTrigger",
      "typeVersion": 1,
      "position": [0, 0],
      "id": "b7e4c1a2-0f3d-4a8e-9c21-5d6f7a8b9c01",
      "name": "Eventtia Trigger",
      "webhookId": "3f9a7c52-1b4d-4e6f-8a90-2c5d7e1f3b46",
      "credentials": {
        "eventtiaApi": {
          "id": "1",
          "name": "Eventtia account"
        }
      }
    },
    {
      "parameters": {
        "resource": "attendee",
        "operation": "get",
        "eventUuid": "={{ $json.included.find(item => item.type === 'events').attributes.uuid }}",
        "attendeeUuid": "={{ $json.uuid }}"
      },
      "type": "@eventtia/n8n-nodes-eventtia.eventtia",
      "typeVersion": 1,
      "position": [220, 0],
      "id": "d9a6e3c4-2b5f-4c8a-9e43-7f8b9c0d1e23",
      "name": "Get Attendee",
      "credentials": {
        "eventtiaApi": {
          "id": "1",
          "name": "Eventtia account"
        }
      }
    }
  ],
  "connections": {
    "Eventtia Trigger": {
      "main": [
        [
          {
            "node": "Get Attendee",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": false,
  "settings": {
    "executionOrder": "v1"
  },
  "pinData": {}
}
```

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Eventtia](https://www.eventtia.com)

## Known issues in Eventtia's outgoing webhooks

Not defects of this node, but limits of what the Eventtia Trigger can offer on top of them:

1. **No signature to verify, from the node's side.** HMAC signing is implemented in Eventtia (`X-Eventtia-Signature: sha256=<hex>` over the raw body, plus `X-Eventtia-Timestamp`, `X-Eventtia-Event` and `X-Eventtia-Delivery`) but it is **not released yet**, and even once it is, the API never returns the per-webhook secret — it is only shown on the event's Webhooks screen, and account-wide webhooks have no such screen. So the trigger node cannot verify anything. If you need verification today, use the built-in **Webhook** node with *Raw Body* on -> **Crypto** node (`Hmac`, `SHA256`, *Binary File* on, binary property `data`, encoding `HEX`) -> **IF** comparing `{{ 'sha256=' + $json.data }}` with `{{ $json.headers['x-eventtia-signature'] }}`, and paste the secret by hand.
2. **Failures are silent.** The sender catches every exception and prints it, which means the Sidekiq retry never fires. Combined with a 5-second timeout, a slow or unavailable receiver loses the event with no record of it. This is why the trigger answers the moment the payload lands rather than waiting for the workflow, and why an inactive workflow drops events invisibly.
3. **PII in logs.** The HTTP client runs with debug output enabled, dumping the full request — attendee data included — into the logs.

## Version history

### 0.3.0

Completes the API: every write endpoint of the Connect API v4 is now available. **Event** Create/Update, **Attendee** Create/Update/Confirm/Reject/Resend Email, **Payment** Create/Delete, **Speaker** Create/Update, **Attendee Type** Create/Update plus its custom fields, **Workshop** Create/Update, **Session** Create/Update/Archive/Enroll/Unenroll, and a new **Checkpoint** resource with Create/Update/Archive. Free-form payloads (custom fields, attendee metadata, workshop pricing and visibility) are filled in as key/value pairs.

**Breaking:** **Event → Get by URI** is gone. It only existed to turn an `event_uri` into a UUID, and trigger payloads now carry the event UUID directly in `included` — see [Resolving an event UUID](#resolving-an-event-uuid). Workflows using that operation need to be repointed at the value from the payload.

### 0.2.0

Adds the **Eventtia Trigger** node: webhook-driven triggers for `attendee_created`, `attendee_updated`, `event_created` and `event_updated`, scoped to one event or to the whole account. Adds an optional **Account API Key** to the credential, which account-wide triggers need.

### 0.1.0

Initial release. Read-only coverage of the Connect API v4 (events, attendees, payments, attendee types, workshops, sessions, speakers, cities), plus the v3 event lookup used to resolve a UUID from an event URI.

