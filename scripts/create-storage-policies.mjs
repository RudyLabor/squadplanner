import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Drop existing policies if they exist (to avoid conflicts)
    const dropPolicies = [
      "DROP POLICY IF EXISTS \"avatars_public_select\" ON storage.objects",
      "DROP POLICY IF EXISTS \"avatars_auth_insert\" ON storage.objects",
      "DROP POLICY IF EXISTS \"avatars_auth_update\" ON storage.objects",
      "DROP POLICY IF EXISTS \"avatars_auth_delete\" ON storage.objects",
    ];

    for (const sql of dropPolicies) {
      await client.query(sql);
    }
    console.log('Old policies dropped');

    // Create new policies
    const createPolicies = [
      "CREATE POLICY \"avatars_public_select\" ON storage.objects FOR SELECT USING (bucket_id = 'avatars')",
      "CREATE POLICY \"avatars_auth_insert\" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated')",
      "CREATE POLICY \"avatars_auth_update\" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated')",
      "CREATE POLICY \"avatars_auth_delete\" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated')",
    ];

    for (const sql of createPolicies) {
      await client.query(sql);
      console.log('Created policy:', sql.substring(0, 60) + '...');
    }

    console.log('All storage policies created successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
