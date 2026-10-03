# Archived SQLite history

These SQL migrations and the schema snapshot are preserved from `d91d21c`.
Do not apply them to PostgreSQL. The active `prisma/migrations` directory is a
new PostgreSQL history with an empty-target baseline. No database is reset,
converted in place, deleted or committed by this change.

Archive copies of existing SQLite databases outside Git. Use a consistent SQLite
backup (including committed WAL contents), not a live file copy during writes.
The read-only importer never modifies this archive or the original database.
