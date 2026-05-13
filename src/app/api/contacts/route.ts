import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, reason, message } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('contacts')
      .insert({ name, email, reason: reason || null, message: message || null });

    if (error) {
      console.error('Supabase insert error:', error.message);
      return NextResponse.json({ error: 'Failed to save contact' }, { status: 500 });
    }

    if (resend) {
      await resend.emails.send({
        from: 'Studio Contact <onboarding@resend.dev>',
        to: 'yujunjiestudio@gmail.com',
        replyTo: `${name} <${email}>`,
        subject: `New enquiry from ${name}${reason ? ` — ${reason}` : ''}`,
        text: [
          `Name:    ${name}`,
          `Email:   ${email}`,
          `Reason:  ${reason || '—'}`,
          ``,
          `Message:`,
          message || '(none)',
        ].join('\n'),
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
