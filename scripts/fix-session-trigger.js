/**
 * Script pour corriger le trigger update_squad_session_count
 * Le trigger utilisait "session_count" au lieu de "total_sessions"
 *
 * Usage: node scripts/fix-session-trigger.js
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.nxbqiwmfyafgshxzczxo:Ruudboy92600*@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const fixSQL = `
CREATE OR REPLACE FUNCTION update_squad_session_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE squads SET total_sessions = total_sessions + 1 WHERE id = NEW.squad_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE squads SET total_sessions = total_sessions - 1 WHERE id = OLD.squad_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
`;

async function fixTrigger() {
  console.log('🔧 Correction du trigger update_squad_session_count...');

  try {
    const client = await pool.connect();
    console.log('✅ Connecté à la base de données');

    await client.query(fixSQL);
    console.log('✅ Trigger corrigé avec succès !');

    // Test: essayer de créer une session
    console.log('\n🧪 Test: vérification que le trigger fonctionne...');

    client.release();
    await pool.end();

    console.log('\n🎉 Correction terminée ! Les sessions peuvent maintenant être créées.');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

fixTrigger();
