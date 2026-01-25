-- Migration: Add allowedSections field to User and TenantInvitation tables
-- This allows fine-grained section access control for invited users

-- Add allowedSections to User table (stored as JSON text, null = full access)
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "allowedSections" TEXT;

-- Add allowedSections to TenantInvitation table (stored as JSON text, null = full access)
ALTER TABLE "TenantInvitation" 
ADD COLUMN IF NOT EXISTS "allowedSections" TEXT;
