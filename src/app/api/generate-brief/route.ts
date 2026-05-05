import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';
import type { QuestionnaireData } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const data: QuestionnaireData = await req.json();

    const prompt = `You are helping oil painter Yu JunJie receive a commission brief. A potential client has filled in a questionnaire. Write a clear, objective creative brief in plain language that the artist can use to understand exactly what to create.

Client answers:
- Type of painting: ${data.type ?? 'Not specified'}
- Size: ${data.size ?? 'Not specified'}
- Budget: ${data.budget ?? 'Not specified'}
- Theme / mood: ${data.theme ?? 'Not specified'}
- Inspiration (memories, music, places, etc.): ${data.insp ?? 'Not specified'}
- Client name: ${data.name ?? 'Not given'}

Write a brief of 150–200 words structured as:
1. What to paint (subject, composition direction)
2. Mood and atmosphere (lighting, palette direction)
3. Size and format recommendation
4. Budget context
5. Key creative note from the inspiration

Be specific, practical, and useful for an artist starting a new piece. No conversational filler.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const brief =
      response.choices[0]?.message?.content ??
      'Brief generated. Please contact directly with your details.';

    // Save commission + brief to Supabase
    await supabase.from('commissions').insert({
      painting_type: data.type ?? null,
      size: data.size ?? null,
      budget: data.budget ?? null,
      theme: data.theme ?? null,
      inspiration: data.insp ?? null,
      client_name: data.name ?? null,
      client_email: data.email ?? null,
      ai_brief: brief,
    });

    return NextResponse.json({ brief });
  } catch (err) {
    console.error('generate-brief error:', err);
    return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 });
  }
}
