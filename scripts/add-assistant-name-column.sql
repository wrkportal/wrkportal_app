-- Add missing assistantName column to User table
-- Run this in your Neon production database if assistantName is missing

DO $$
BEGIN
    -- assistantName
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'assistantName') THEN
        ALTER TABLE "User" ADD COLUMN "assistantName" TEXT;
        RAISE NOTICE 'Column assistantName added successfully';
    ELSE
        RAISE NOTICE 'Column assistantName already exists';
    END IF;
END $$;
