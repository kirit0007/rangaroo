import { Client } from 'pg';
import { ensureDatabaseRunning } from '../../helpers/connection';

// Ensure default mock environment variables for Supabase client initialization in test runner
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_test_service_role_key_for_e2e_isolation';
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_test_anon_key_for_e2e_isolation';
}

export type DatabaseRole = 'anon' | 'authenticated' | 'service_role' | 'products_view_owner' | 'postgres';

export async function getTestDatabaseUrl(): Promise<string> {
  return await ensureDatabaseRunning();
}

/**
 * Creates a raw PostgreSQL client connected as superuser (postgres).
 */
export async function createSuperuserClient(): Promise<Client> {
  const url = await getTestDatabaseUrl();
  const client = new Client({ connectionString: url });
  await client.connect();
  return client;
}

/**
 * Creates an independent PostgreSQL client session with a specific role set.
 * In PostgreSQL, unprivileged roles with NOLOGIN cannot log in directly over TCP,
 * so setting the role in the session (SET ROLE <role>) is the authoritative way
 * to test permissions as that role.
 */
export async function createRoleClient(role: DatabaseRole): Promise<{
  client: Client;
  role: DatabaseRole;
  cleanup: () => Promise<void>;
}> {
  const client = await createSuperuserClient();

  if (role !== 'postgres') {
    await client.query(`SET ROLE ${role};`);
  }

  return {
    client,
    role,
    cleanup: async () => {
      try {
        if (role !== 'postgres') {
          await client.query('RESET ROLE;');
        }
      } catch {}
      try {
        await client.end();
      } catch {}
    },
  };
}

/**
 * Helper to run a query under a specified role and return the result or error.
 */
export async function queryAsRole(
  role: DatabaseRole,
  sql: string,
  params: any[] = []
): Promise<{ rows: any[]; rowCount: number | null }> {
  const { client, cleanup } = await createRoleClient(role);
  try {
    const res = await client.query(sql, params);
    return { rows: res.rows, rowCount: res.rowCount };
  } finally {
    await cleanup();
  }
}
