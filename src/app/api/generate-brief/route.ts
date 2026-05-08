import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';
import type { QuestionnaireData } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─────────────────────────────────────────────────────────────────
// SYSTEM ROLE — who the AI is and how it behaves
//
// KEY FIX: The role and the prompt must agree on the output format.
// Previously the role said "3 ideas" but the prompt gave a 5-section
// single-brief structure — the prompt won, producing 1 response.
// Now both say: produce exactly 3 numbered directions.
// ─────────────────────────────────────────────────────────────────
const SYSTEM_ROLE = `You are the creative studio assistant for Yu JunJie, a Singapore-based oil painter \
who works primarily in portraiture and landscape. His work is known for showing layers and depth \
amongst people and our environment — showcasing the disparity of the world: \
"What you see may not be what is there."

Your job is to translate a client's questionnaire answers into a creative brief. \
You will always produce exactly 3 numbered creative directions. Each direction is a distinct \
interpretation of the client's answers — not variations of the same idea, but genuinely different \
angles the artist could take.

Your writing style is direct, unhurried, and precise — like a good editor, not a salesperson. \
You write in flowing prose, not bullet points. You never use filler phrases like "certainly!", \
"great choice!", or "I'd be happy to help". You do not promise prices or turnaround times. \
You do not second-guess the client's choices — you synthesise them into coherent creative directions.

If the client has given sparse answers, you read between the lines and make educated creative \
suggestions while noting they are suggestions. If the answers are rich, you reflect their \
specificity back clearly.

Always end your response — after the 3 ideas — with a single line: \
"Key creative tension: [one sentence naming the most interesting challenge shared across all three directions.]"

Then on a new line add: \
"Prefer to discuss directly? Reach out and we can talk through your vision in person."`;

// ─────────────────────────────────────────────────────────────────
// USER PROMPT — explicit format instruction forces 3 outputs
//
// The FORMAT block is what actually controls the structure.
// The system role sets tone/persona; the prompt sets shape.
// Both must agree — if they conflict, the prompt wins.
//
// MODEL SETTINGS:
//   model        — "gpt-4o-mini" is fine for this task
//   temperature  — 0.8 gives creative variety across the 3 directions
//   max_tokens   — 1200 gives enough room for 3 full paragraphs
// ─────────────────────────────────────────────────────────────────
function buildPrompt(data: QuestionnaireData): string {
  return `A client has completed the commission questionnaire. Their answers are below.
Generate exactly 3 numbered creative directions for this commission.

CLIENT ANSWERS
──────────────
Type of painting : ${data.type   ?? 'Not specified'}
Size             : ${data.size   ?? 'Not specified'}
Budget           : ${data.budget ?? 'Not specified'}
Theme / mood     : ${data.theme  ?? 'Not specified'}
Inspiration      : ${data.insp   ?? 'Not specified'}
Client name      : ${data.name   ?? 'Not given'}

FORMAT — follow this exactly:

1. [Direction name]
[2–3 sentences: what is painted, how it is composed, the mood and palette, and how it connects \
to the client's inspiration. Flowing prose, no sub-bullets.]

2. [Direction name]
[Same structure — a genuinely different interpretation, not a variation of idea 1.]

3. [Direction name]
[Same structure — a third distinct angle.]

Key creative tension: [one sentence]

Prefer to discuss directly? Reach out and we can talk through your vision in person.

Write the brief now. Do not add any preamble before "1.".`;
}

export async function POST(req: NextRequest) {
  try {
    const data: QuestionnaireData = await req.json();

    const response = await openai.chat.completions.create({
      model       : 'gpt-4o-mini', // fine for this task; swap to 'gpt-4o' for richer output
      temperature : 0.8,           // higher = more creative variation across the 3 directions
      max_tokens  : 1200,          // increased from 1000 — 3 ideas need more room
      messages    : [
        { role: 'system', content: SYSTEM_ROLE },
        { role: 'user',   content: buildPrompt(data) },
      ],
    });

    const brief =
      response.choices[0]?.message?.content ??
      'Brief could not be generated. Please contact directly with your details.';

    // Save to Supabase
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