#!/bin/sh
set -eu
PGDATA="${PGDATA:-/var/lib/postgresql/data/pgdata}"
export PGDATA
export POSTGRES_USER="${POSTGRES_USER:-kapibank}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-kapibank_secret}"
export POSTGRES_DB="${POSTGRES_DB:-kapibank}"
export POSTGRES_SERVER=127.0.0.1
export POSTGRES_PORT=5432
# Runtime always uses the bundled PostgreSQL instance.
unset DATABASE_URL
PG_BINDIR=$(dirname "$(find /usr/lib/postgresql -path '*/bin/initdb' -type f | head -n 1)")
mkdir -p "$PGDATA" /run/postgresql
chown -R postgres:postgres /var/lib/postgresql /run/postgresql
chmod 700 "$PGDATA"
if [ ! -s "$PGDATA/PG_VERSION" ]; then
  runuser -u postgres -- "$PG_BINDIR/initdb" -D "$PGDATA" --encoding=UTF8 --locale=C.UTF-8 --auth-local=trust --auth-host=scram-sha-256
fi
api_pid=''
cleanup() {
  trap - INT TERM EXIT
  if [ -n "$api_pid" ]; then kill -TERM "$api_pid" 2>/dev/null || true; wait "$api_pid" 2>/dev/null || true; fi
  runuser -u postgres -- "$PG_BINDIR/pg_ctl" -D "$PGDATA" -m fast -w stop || true
}
trap cleanup EXIT
trap 'exit 0' INT TERM
runuser -u postgres -- "$PG_BINDIR/pg_ctl" -D "$PGDATA" -l /tmp/postgres.log -o '-h 127.0.0.1' -w start
# psycopg composes identifiers/literals safely, including non-default passwords.
python - <<'PY'
import os
import psycopg
from psycopg import sql
user,password,name=(os.environ[k] for k in ('POSTGRES_USER','POSTGRES_PASSWORD','POSTGRES_DB'))
with psycopg.connect('host=/var/run/postgresql user=postgres dbname=postgres',autocommit=True) as c:
    if not c.execute('SELECT 1 FROM pg_roles WHERE rolname=%s',(user,)).fetchone():
        c.execute(sql.SQL('CREATE ROLE {} LOGIN PASSWORD {}').format(sql.Identifier(user),sql.Literal(password)))
    else:
        c.execute(sql.SQL('ALTER ROLE {} PASSWORD {}').format(sql.Identifier(user),sql.Literal(password)))
    if not c.execute('SELECT 1 FROM pg_database WHERE datname=%s',(name,)).fetchone():
        c.execute(sql.SQL('CREATE DATABASE {} OWNER {}').format(sql.Identifier(name),sql.Identifier(user)))
PY
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8080}" &
api_pid=$!
wait "$api_pid"
