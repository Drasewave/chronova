-- Comptes avec mot de passe (remplace le lien magique).
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
