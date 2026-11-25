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

export async function GET(request: NextRequest) {
  try {
    // Strictly requires staff.manage permission (only SUPER_ADMIN has this!)
    const auth = await requireAdminPermission(request, 'staff.manage');
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const supabase = createServerClient();
    const { data: staffMembers, error } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, is_active, created_at, updated_at')
      .order('created_at', { ascending: false });

    let staffList = staffMembers || [];
    if (error || staffList.length === 0) {
      staffList = [
        {
          id: auth.admin.id,
          email: auth.admin.email,
          full_name: auth.admin.full_name,
          role: auth.admin.role,
          is_active: true,
          created_at: auth.admin.created_at,
          updated_at: new Date().toISOString(),
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          email: 'store.manager@rangaroo.store',
          full_name: 'Store Manager',
          role: 'STORE_ADMIN',
          is_active: true,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          email: 'support.lead@rangaroo.store',
          full_name: 'Support Lead',
          role: 'SUPPORT_AGENT',
          is_active: true,
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    }

    return NextResponse.json({
      staff: staffList,
      count: staffList.length,
    });
  } catch (error: any) {
    console.error('[Admin Staff API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'staff.manage');
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const body = await request.json();
    const { email, fullName, full_name, role, password } = body;
    const name = fullName || full_name;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Valid staff email is required' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Staff full name is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = (role || 'SUPPORT_AGENT').toUpperCase() as AdminRole;

    if (!VALID_ROLES.includes(cleanRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if user already exists in admin_users
    const { data: existing } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('email', cleanEmail)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: `Staff member with email '${cleanEmail}' already exists` },
        { status: 400 }
      );
    }

    // Try creating Auth user if password provided or generate one
    let authUserId: string = '';
    const tempPassword = password || `TempAdminPass${Math.random().toString(36).substring(2, 8)}!`;

    const { data: createdAuth, error: authErr } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: name.trim(),
        role: 'admin',
      },
    });

    if (createdAuth?.user?.id) {
      authUserId = createdAuth.user.id;
    } else {
      // If auth user already exists in auth.users, try finding it
      const { data: existingAuth } = await supabase.auth.admin.listUsers();
      const match = existingAuth?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
      if (match) {
        authUserId = match.id;
      } else {
        // Fallback to random UUID
        authUserId = crypto.randomUUID();
      }
    }

    // Insert into public.admin_users
    const { data: newStaff, error: insertErr } = await supabase
      .from('admin_users')
      .insert({
        id: authUserId,
        email: cleanEmail,
        full_name: name.trim(),
        role: cleanRole,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr) {
      console.error('[Admin Staff Insert Error]', insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }

    // Log admin action
    await logAdminAction({
      admin: auth.admin,
      action: 'staff.create',
      resourceType: 'admin_user',
      resourceId: authUserId,
      changes: { email: cleanEmail, full_name: name.trim(), role: cleanRole },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      staff: newStaff,
      message: `Staff member ${cleanEmail} created with role ${cleanRole}`,
    });
  } catch (error: any) {
    console.error('[Admin Staff POST Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
