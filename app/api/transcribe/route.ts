import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transcribeAudio } from '@/lib/whisper';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const audio = formData.get('audio') as File;

    if (!audio) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Limit file size (max 25MB for audio)
    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    if (audio.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Audio file exceeds 25MB limit' },
        { status: 400 }
      );
    }

    console.log('Received audio file:', audio.name, audio.size, 'bytes', audio.type);

    const transcription = await transcribeAudio(audio);

    console.log('Transcription result:', transcription);

    return NextResponse.json({ transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
