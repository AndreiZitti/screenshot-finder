import { NextRequest, NextResponse } from 'next/server';
import { sendToNotion, testNotionConnection, NotionCredentials } from '@/lib/notion';

// Get credentials from env or request body
function getCredentials(bodyCredentials?: Partial<NotionCredentials>): NotionCredentials | null {
  // Priority: env variables for owner
  const envApiKey = process.env.NOTION_API_KEY;
  const envPageId = process.env.NOTION_PAGE_ID;
  
  if (envApiKey && envPageId) {
    return { apiKey: envApiKey, pageId: envPageId };
  }
  
  // Fall back to user-provided credentials
  if (bodyCredentials?.apiKey && bodyCredentials?.pageId) {
    return { apiKey: bodyCredentials.apiKey, pageId: bodyCredentials.pageId };
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, type, name, description, transcription, link, credentials: bodyCredentials } = body;
    
    const credentials = getCredentials(bodyCredentials);
    
    if (!credentials) {
      return NextResponse.json(
        { error: 'Notion credentials not configured. Please set up in Settings.' },
        { status: 400 }
      );
    }
    
    // Test connection action
    if (action === 'test') {
      const result = await testNotionConnection(credentials);
      return NextResponse.json(result);
    }
    
    // Send to Notion action
    if (!type) {
      return NextResponse.json(
        { error: 'Missing type parameter' },
        { status: 400 }
      );
    }
    
    const result = await sendToNotion({
      credentials,
      type,
      name,
      description,
      transcription,
      link,
    });
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Notion API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
