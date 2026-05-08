import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';
import type { QuestionnaireData } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─────────────────────────────────────────────────────────────────
// SYSTEM ROLE — defines who the AI is and how it thinks
//
// HOW TO EDIT:
//   Change the text inside SYSTEM_ROLE to adjust the AI's persona,
//   tone, and constraints. Some things you can control here:
//
//   • Persona      — "You are a meticulous studio assistant…"
//   • Tone         — "Write with warmth but professional distance."
//   • Language     — "Avoid jargon. Write for someone unfamiliar with oil painting."
//   • Constraints  — "Never suggest a price. Never promise a deadline."
//   • Style        — "Write in flowing prose, no bullet points."
// ─────────────────────────────────────────────────────────────────
const SYSTEM_ROLE = `You are the creative studio assistant for Yu JunJie, a Singapore-based oil painter \
who works primarily in portraiture and landscape. His works is know for showing layers and depths amonghts people and our environment. 
Showcasing the disparity of the world "What you see may not be what is there".\
Your job is to translate a client's questionnaire \
answers into a clear, practical creative brief for clients to help them articulate their vision and for the artist to understand the commission. \

Your writing style is direct, unhurried, and precise — like a good editor, not a salesperson. \
You write in flowing prose, not bullet points. You never use filler phrases like "certainly!", \
"great choice!", or "I'd be happy to help". You do not promise prices or turnaround times. \
You do not second-guess the client's choices — you synthesise them into a coherent creative direction.

If the client has given sparse answers, you read between the lines and make educated creative \
suggestions while noting they are suggestions. If the answers are rich, you reflect their specificity \
back clearly. Always end the brief with a single "Key creative tension" — one sentence that names \
the most interesting challenge in the piece.

Only generate 3 ideas(numbered) for each of the submission to prevent an overwhelming amount of information.\
Always give the option to contact directly if the client prefers that over the AI-generated brief.
`;

// ─────────────────────────────────────────────────────────────────
// USER PROMPT — the actual instructions sent per request
//
// HOW TO EDIT:
//   Add, remove or rename fields by changing the template literals.
//   The structure (numbered sections) tells the AI how to organise
//   its output. Change section names to change what gets written.
//
// MODEL SETTINGS (in the API call below):
//   model        — "gpt-4o" is best quality; "gpt-4o-mini" is faster + cheaper
//   temperature  — 0.0 = very factual/predictable, 1.0 = more creative/varied
//                  For briefs, 0.5–0.7 is the sweet spot
//   max_tokens   — controls maximum response length (1000 ≈ ~750 words)
// ─────────────────────────────────────────────────────────────────
function buildPrompt(data: QuestionnaireData): string {
  return `A client has completed the commission questionnaire. Their answers are below. \
Write a creative brief of 180–220 words for the artist.

CLIENT ANSWERS
──────────────
Type of painting : ${data.type      ?? 'Not specified'}
Size             : ${data.size      ?? 'Not specified'}
Budget           : ${data.budget    ?? 'Not specified'}
Theme / mood     : ${data.theme     ?? 'Not specified'}
Inspiration      : ${data.insp      ?? 'Not specified'}
Client name      : ${data.name      ?? 'Not given'}

BRIEF STRUCTURE (write in this order, no headings, flowing prose, brief but rich, no bullet points):
1. Subject and composition — what to paint and how it should be framed
2. Mood and atmosphere — the emotional register, lighting quality, palette direction
3. Format note — size and support recommendation based on their choice and budget
4. Creative synthesis — how the inspiration connects to the subject
5. Key creative tension — one sentence naming the most interesting challenge

Write the brief now.`;
}

export async function POST(req: NextRequest) {
  try {
    const data: QuestionnaireData = await req.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',       // swap to 'gpt-4o-mini' to reduce cost
      temperature: 0.8,       // 0.0 = factual, 1.0 = creative — adjust to taste
      max_tokens: 1000,
      messages: [
        { role: 'system', content: SYSTEM_ROLE },
        { role: 'user',   content: buildPrompt(data) },
      ],
    });

    const brief =
      response.choices[0]?.message?.content ??
      'Brief could not be generated. Please contact directly with your details.';

    // Save the full commission + AI brief to Supabase
    await supabase.from('commissions').insert({
      painting_type : data.type   ?? null,
      size          : data.size   ?? null,
      budget        : data.budget ?? null,
      theme         : data.theme  ?? null,
      inspiration   : data.insp   ?? null,
      client_name   : data.name   ?? null,
      client_email  : data.email  ?? null,
      ai_brief      : brief,
    });

    return NextResponse.json({ brief });
  } catch (err) {
    console.error('generate-brief error:', err);
    return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 });
  }
}
