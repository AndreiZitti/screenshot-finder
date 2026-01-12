import { Client } from '@notionhq/client';

export interface NotionCredentials {
  apiKey: string;
  pageId: string;
}

export function createNotionClient(apiKey: string): Client {
  return new Client({ auth: apiKey });
}

export function extractPageId(pageUrlOrId: string): string {
  // Handle full URLs like https://notion.so/Page-Name-abc123def456
  // or just the ID
  const match = pageUrlOrId.match(/([a-f0-9]{32}|[a-f0-9-]{36})$/i);
  if (match) {
    return match[1].replace(/-/g, '');
  }
  // Try to extract from URL with dashes
  const urlMatch = pageUrlOrId.match(/([a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12})/i);
  if (urlMatch) {
    return urlMatch[1].replace(/-/g, '');
  }
  return pageUrlOrId;
}

export interface SendToNotionParams {
  credentials: NotionCredentials;
  type: 'discovery' | 'note';
  name?: string;
  description?: string;
  transcription?: string;
  link?: string;
}

export async function sendToNotion(params: SendToNotionParams): Promise<{ success: boolean; error?: string }> {
  const { credentials, type, name, description, transcription, link } = params;
  
  const client = createNotionClient(credentials.apiKey);
  const pageId = extractPageId(credentials.pageId);
  
  const timestamp = new Date().toLocaleString();
  
  let text: string;
  if (type === 'note') {
    text = `[${timestamp}] Note: ${transcription}`;
  } else {
    text = `[${timestamp}] ${name}`;
    if (description) {
      text += ` - ${description}`;
    }
    if (link) {
      text += ` (${link})`;
    }
  }

  try {
    await client.blocks.children.append({
      block_id: pageId,
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: { content: text },
              },
            ],
          },
        },
      ],
    });
    return { success: true };
  } catch (error) {
    console.error('Notion API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send to Notion';
    return { success: false, error: message };
  }
}

export async function testNotionConnection(credentials: NotionCredentials): Promise<{ success: boolean; pageName?: string; error?: string }> {
  const client = createNotionClient(credentials.apiKey);
  const pageId = extractPageId(credentials.pageId);
  
  try {
    const page = await client.pages.retrieve({ page_id: pageId });
    // Extract page title
    let pageName = 'Untitled';
    if ('properties' in page && page.properties.title) {
      const titleProp = page.properties.title;
      if ('title' in titleProp && Array.isArray(titleProp.title) && titleProp.title.length > 0) {
        pageName = titleProp.title[0].plain_text;
      }
    }
    return { success: true, pageName };
  } catch (error) {
    console.error('Notion connection test failed:', error);
    const message = error instanceof Error ? error.message : 'Connection failed';
    return { success: false, error: message };
  }
}
