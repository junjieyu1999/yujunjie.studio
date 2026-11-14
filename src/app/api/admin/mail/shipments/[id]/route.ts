// PATCH  /api/admin/mail/shipments/[id] — update status, tracking, notes or costs
// DELETE /api/admin/mail/shipments/[id] — remove a shipment row
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { parseBody, SHIPMENT_SCHEMA, isUuid, friendlyDbError } from '@/lib/mailValidation';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  if (!isUuid(params.id)) return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });

  const parsed = parseBody(await req.json().catch(() => null), SHIPMENT_SCHEMA);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('mail_shipments')
      .update(parsed.data)
      .eq('id', params.id)
      .select()
      .maybeSingle();
    if (error) {
      console.error('PATCH shipment error:', error);
      const f = friendlyDbError(error);
      return NextResponse.json({ error: f.message }, { status: f.status });
    }
    if (!data) return NextResponse.json({ error: 'Shipment not found.' }, { status: 404 });
    return NextResponse.json({ shipment: data });
  } catch (err) {
    console.error('PATCH shipment error:', err);
    return NextResponse.json({ error: 'Update failed.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  if (!isUuid(params.id)) return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('mail_shipments')
      .delete()
      .eq('id', params.id)
      .select('id');
    if (error) {
      console.error('DELETE shipment error:', error);
      const f = friendlyDbError(error);
      return NextResponse.json({ error: f.message }, { status: f.status });
    }
    if (!data || data.length === 0) return NextResponse.json({ error: 'Shipment not found.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE shipment error:', err);
    return NextResponse.json({ error: 'Delete failed.' }, { status: 500 });
  }
}
