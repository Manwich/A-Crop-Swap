#!/usr/bin/env bash
# Runs the blueprint acceptance checks against supabase/schema.sql on a throwaway local database.
# Needs a local Postgres you can connect to (PGHOST/PGPORT/PGUSER as usual), with superuser rights.
set -euo pipefail
cd "$(dirname "$0")"
db="cropswap_test_$$"
createdb "$db"
trap 'dropdb --if-exists "$db"' EXIT
psql -d "$db" -v ON_ERROR_STOP=1 -q -f supabase_stub.sql -f ../schema.sql -f acceptance.sql 2>&1 \
  | grep -E 'pass |FAIL|ERROR|PASSED'
