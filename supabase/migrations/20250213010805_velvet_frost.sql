/*
  # Cleanup Document Storage Tables

  This migration removes all document-related tables and their dependencies.
  
  1. Changes
    - Drop all document-related tables with CASCADE to handle dependencies
    - Drop any related types
    - Ensures clean removal of all document storage functionality
*/

-- Drop tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS document_shares CASCADE;
DROP TABLE IF EXISTS document_versions CASCADE;
DROP TABLE IF EXISTS document_storage CASCADE;

-- Drop any related types
DROP TYPE IF EXISTS document_status CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS share_permission CASCADE;