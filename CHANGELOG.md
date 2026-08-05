# Changelog

## 0.1.0

Initial release. Read-only node for the Eventtia Connect API.

### Added

- **Credential** using server-to-server client ID and secret, with an environment selector
  (Production / Development). The token is obtained and renewed automatically, so no manual
  rotation is needed and no user password is stored.
- **25 read operations** across eight resources: Event, Attendee, Payment, Attendee Type,
  Workshop, Session, Speaker and City.
- **Event → Get by URI**, which resolves an event's UUID from its URI. Webhook payloads don't
  carry the UUID, so this is what lets a webhook-driven workflow reach the rest of the API.
- Return All / Limit on every list operation, paging around the API's 24-record cap.
- Filters on the two heaviest listings: events (name, status, updated since, templates) and
  attendees (name, email, company, attendee type, payment and check-in status).
- `User-Agent: n8n-nodes-eventtia/<version>` on every request, including the token exchange.
  n8n sends no User-Agent of its own, so without this the calls reach Eventtia as
  `axios/x.y.z` and can't be told apart from any other client.
