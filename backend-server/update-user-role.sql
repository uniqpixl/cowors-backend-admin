-- Update user role to SuperAdmin
UPDATE "user" 
SET role = 'SuperAdmin' 
WHERE email = 'admin@cowors.com';
