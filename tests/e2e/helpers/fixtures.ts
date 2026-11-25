export {
  generateRunId,
  seedProduct,
  seedOrder,
  seedCoupon,
  seedInventoryReservation,
  cleanTestFixtures,
} from '../../helpers/db-fixtures';
export type {
  SeedProductParams,
  SeedOrderParams,
  SeedCouponParams,
  SeedReservationParams,
} from '../../helpers/db-fixtures';


export async function seedAdminUser(
  client: any,
  params: { id?: string; email?: string; full_name?: string; role: string; is_active?: boolean }
): Promise<string> {
  const id = params.id || '00000000-0000-0000-0000-000000000000';
  const email = params.email || 'admin@test.com';
  const name = params.full_name || 'Admin User';
  const active = params.is_active ?? true;

  await client.query(
    `INSERT INTO public.admin_users (id, email, full_name, role, is_active)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       role = EXCLUDED.role,
       is_active = EXCLUDED.is_active,
       updated_at = clock_timestamp();`,
    [id, email, name, params.role, active]
  );

  return id;
}
