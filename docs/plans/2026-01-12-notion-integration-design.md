# Notion Integration Design

## Overview

Add a "Send to Notion" feature that allows users to manually push Discoveries and Notes to a specific Notion page as paragraph blocks.

## Requirements

- **Trigger**: Manual button on each Discovery/Note card
- **Destination**: Specific Notion page (items appended as blocks)
- **Format**: Simple paragraph - `[timestamp] Type: Name - Description` or `[timestamp] Note: transcription`
- **Auth**: 
  - Owner uses env variables (`NOTION_API_KEY`, `NOTION_PAGE_ID`)
  - Other users configure via Settings page

## New Files

| File | Purpose |
|------|---------|
| `app/api/notion/route.ts` | API endpoint to post items to Notion |
| `app/settings/page.tsx` | Settings page for Notion credentials |
| `lib/notion.ts` | Notion client wrapper |

## Modified Files

| File | Change |
|------|--------|
| `components/DiscoveryCard.tsx` | Add "Send to Notion" button |
| `components/NoteCard.tsx` | Add "Send to Notion" button |
| `components/BottomNav.tsx` | Add Settings nav item |

## Data Flow

1. User clicks "Send to Notion" on a card
2. Frontend calls `POST /api/notion` with item data
3. API reads credentials from env (owner) or user settings (others)
4. API calls Notion's `blocks.children.append` to add paragraph block
5. Success/error toast shown to user

## Credential Storage

Dual storage for non-owner users:
- `localStorage` for immediate access and offline capability
- `user_settings` Supabase table for cross-device sync

Load priority: localStorage → Supabase → cache to localStorage

## Database Schema

```sql
-- New table for user settings
CREATE TABLE user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notion_api_key text,  -- Consider encryption at rest
  notion_page_id text,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only access their own settings
CREATE POLICY "Users can manage own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);
```

## Settings Page UI

```
┌─────────────────────────────────────┐
│ Notion Integration                  │
├─────────────────────────────────────┤
│ API Token:  [••••••••••••••]       │
│ Page URL:   [https://notion.so/...]│
│                                     │
│ [Test Connection]  [Save]          │
│                                     │
│ ✓ Connected to "My Captures" page  │
└─────────────────────────────────────┘
```

## Button States

| State | Display |
|-------|---------|
| Default | Notion icon (subtle) |
| Loading | Spinner |
| Success | Checkmark (2s) |
| Error | Red icon with retry |

## Environment Variables

```env
# Owner's Notion credentials (optional - falls back to user settings)
NOTION_API_KEY=secret_xxx
NOTION_PAGE_ID=abc123
```

## Dependencies

- `@notionhq/client` - Official Notion SDK
