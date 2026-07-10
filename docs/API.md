# Control API

The control API lets external tools list, delete, and send stash items to Notion. Authenticate every request with a Supabase user access token belonging to an allowlisted user.

```bash
curl https://your-app.example/api/control/stash \
  -H "Authorization: Bearer <supabase-access-token>"
```

## List items

`GET /api/control/stash`

| Query parameter | Values                                 | Default  |
| --------------- | -------------------------------------- | -------- |
| `kind`          | `all`, `discoveries`, `links`, `notes` | `all`    |
| `q`             | Search text                            | —        |
| `archived`      | `active`, `include`, `only`            | `active` |
| `limit`         | `1`–`500`                              | `100`    |
| `offset`        | Non-negative integer                   | `0`      |

`notes` is a compatibility view over discoveries whose type is `note`; there is no separate notes table.

## Delete an item

`DELETE /api/control/stash/:kind/:id`

Singular aliases (`discovery`, `link`, and `note`) are accepted.

## Send to Notion

`POST /api/control/stash/:kind/:id/notion`

Optional JSON body:

```json
{
  "connectionId": "notion-connection-uuid",
  "mode": "move"
}
```

Use `mode: "move"` or `deleteAfterSend: true` to delete the item only after a successful Notion write.

## Error responses

- `400` — invalid kind or input
- `401` — missing, invalid, or disallowed Supabase user token
- `404` — item not found
- `500` — database or Notion operation failed
