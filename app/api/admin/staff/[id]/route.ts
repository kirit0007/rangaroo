import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminPermission, logAdminAction, AdminRole } from '@/lib/admin/adminAuth';

export const dynamic = 'force-dynamic';

const VALID_ROLES: AdminRole[] = [
  'SUPER_ADMIN',
  'STORE_ADMIN',
  'ORDER_MANAGER',
  'PRODUCT_MANAGER',
  'CONTENT_MANAGER',
  'SUPPORT_AGENT',
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminPermission(request, 'staff.manage');
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const supabase = createServerClient();

    const { data: staff, error } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, is_active, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json({ staff });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminPermission(request, 'staff.manage');
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const body = await request.json();
    const { role, isActive, is_active, full_name, fullName } = body;

    const name = fullName || full_name;
    const active = isActive !== undefined ? isActive : is_active;

    const supabase = createServerClient();

    // Check staff exists
    const { data: current, error: getErr } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single();

    if (getErr || !current) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Safety: Prevent self-deactivation if caller is modifying their own account
    if (auth.admin.id === id && active === false) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own active SUPER_ADMIN account' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (role !== undefined) {
      const cleanRole = role.toUpperCase() as AdminRole;
      if (!VALID_ROLES.includes(cleanRole)) {
        return NextResponse.json(
          { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.role = cleanRole;
    }

    if (active !== undefined) {
      updateData.is_active = Boolean(active);
    }

    if (name !== undefined) {
      updateData.full_name = name.trim();
    }

    const { data: updated, error: updErr } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 400 });
    }

    // Log admin audit action
    await logAdminAction({
      admin: auth.admin,
      action: 'staff.update',
      resourceType: 'admin_user',
      resourceId: id,
      changes: updateData,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      staff: updated,
      message: `Staff member ${updated.email} updated successfully`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminPermission(request, 'staff.manage');
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;

    // Safety: Prevent self-deletion
    if (auth.admin.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own active SUPER_ADMIN account' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Instead of destructive hard-delete, revoke access by deactivating
    const { data: revoked, error } = await supabase
      .from('admin_users')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !revoked) {
      return NextResponse.json({ error: error?.message || 'Staff member not found' }, { status: 404 });
    }

    // Audit log
    await logAdminAction({
      admin: auth.admin,
      action: 'staff.revoke_access',
      resourceType: 'admin_user',
      resourceId: id,
      changes: { is_active: false, revoked_user: revoked.email },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Access revoked for ${revoked.email}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
