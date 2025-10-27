-- Rename existing roles
UPDATE "Role"
SET name = 'dueño'
WHERE name = 'owner';

UPDATE "Role"
SET name = 'facilitador'
WHERE name = 'admin';

UPDATE "Role"
SET name = 'worldbuilder'
WHERE name = 'member';

UPDATE "Role"
SET name = 'lector'
WHERE name = 'viewer';
