-- Fix the session count trigger that uses wrong column name
-- The trigger was using 'session_count' but the column is 'total_sessions'

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
