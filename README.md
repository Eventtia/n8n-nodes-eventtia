# @eventtia/n8n-nodes-eventtia

This is an n8n community node. It lets you read data from [Eventtia](https://www.eventtia.com) in your n8n workflows.

Eventtia is an event management platform for registration, attendee management, workshops and check-in. This node exposes the Eventtia Connect API so you can pull event and attendee data into other systems — a CRM, a spreadsheet, a reporting pipeline.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
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

This version is **read-only**. Every operation is a GET; nothing in the node creates, updates or deletes data in Eventtia.

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

## Credentials

The node authenticates with **server-to-server credentials**, so it never stores a person's password and can be revoked without touching any user account.

1. In Eventtia, open your user profile and go to the **S2S credentials** tab.
2. Generate a Client ID and Client Secret. **The secret is shown only once** — copy it before closing the page.
3. In n8n, create an *Eventtia API* credential, pick the environment (Production or Development) and paste both values.

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

Not defects of this node — it does not consume webhooks. They are recorded here because they matter for anyone building a trigger on top of them:

1. **No HMAC signature.** Outgoing webhooks are sent with only `Content-Type` and `User-Agent: Eventtia/1.0`. Nothing lets a receiver verify the request actually came from Eventtia, so anyone who learns the URL can post forged payloads to it.
2. **Failures are silent.** The sender catches every exception and prints it, which means the Sidekiq retry never fires. Combined with a 5-second timeout, a slow or unavailable receiver loses the event with no record of it.
3. **PII in logs.** The HTTP client runs with debug output enabled, dumping the full request — attendee data included — into the logs.

## Version history

### 0.1.0

Initial release. Read-only coverage of the Connect API v4 (events, attendees, payments, attendee types, workshops, sessions, speakers, cities), plus the v3 event lookup used to resolve a UUID from an event URI.

