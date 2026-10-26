#!/usr/bin/env bash
#
# Back up the CCDS Quick Shop SQLite database.
#
# Usage:
#   scripts/backup-db.sh --container <name>  # Database inside a running Docker container.
#   scripts/backup-db.sh --file <path>       # Database file on this machine.
#
# Options:
#   --db-path <path>  Database path inside the container (default: /app/db.sqlite3).
#   --out <dir>       Directory to write the backup to (default: ./backups).
#
# Environment:
#   SQLITE3  sqlite3 binary to use (default: sqlite3).
#
# When sqlite3 is available (locally for --file, inside the container for
# --container), SQLite's online backup is used, which gives a consistent copy
# even while the server is running. Otherwise the database file and any
# journal files are copied as-is and checked afterwards.
#
# To restore, stop the server and copy the backup over the database file, e.g.:
#   docker stop <name>
#   docker cp backups/db-<timestamp>.sqlite3 <name>:/app/db.sqlite3
#   docker start <name>

set -euo pipefail

SQLITE3="${SQLITE3:-sqlite3}"
container=""
file=""
db_path="/app/db.sqlite3"
out_dir="backups"

usage() {
	sed -n '3,14p' "$0" | sed 's/^# \{0,1\}//'
	exit 1
}

while [ $# -gt 0 ]; do
	case "$1" in
		--container) container="${2:-}"; shift 2 ;;
		--file) file="${2:-}"; shift 2 ;;
		--db-path) db_path="${2:-}"; shift 2 ;;
		--out) out_dir="${2:-}"; shift 2 ;;
		-h|--help) usage ;;
		*) echo "Unknown argument: $1" >&2; usage ;;
	esac
done

if { [ -z "$container" ] && [ -z "$file" ]; } || { [ -n "$container" ] && [ -n "$file" ]; }; then
	echo "Specify exactly one of --container or --file." >&2
	usage
fi

have_sqlite3() {
	command -v "$SQLITE3" >/dev/null 2>&1
}

mkdir -p "$out_dir"
timestamp="$(date +%Y%m%d-%H%M%S)"
dest="$out_dir/db-$timestamp.sqlite3"

if [ -n "$file" ]; then
	if [ ! -f "$file" ]; then
		echo "Database file not found: $file" >&2
		exit 1
	fi
	if have_sqlite3; then
		echo "Creating online backup of $file..."
		"$SQLITE3" "$file" ".backup '$dest'"
	else
		echo "sqlite3 not found, copying $file directly..."
		cp "$file" "$dest"
		for suffix in -journal -wal -shm; do
			if [ -f "$file$suffix" ]; then
				cp "$file$suffix" "$dest$suffix"
			fi
		done
	fi
else
	if ! running="$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null)"; then
		echo "Docker container not found: $container" >&2
		exit 1
	fi
	if [ "$running" = "true" ] && docker exec "$container" sh -c "command -v sqlite3" >/dev/null 2>&1; then
		echo "Creating online backup of $container:$db_path..."
		tmp="/tmp/db-backup-$timestamp.sqlite3"
		docker exec "$container" sqlite3 "$db_path" ".backup '$tmp'"
		docker cp "$container:$tmp" "$dest"
		docker exec "$container" rm -f "$tmp"
	else
		if [ "$running" = "true" ]; then
			echo "WARNING: copying the database while the server is running. Stop the container" >&2
			echo "         first (docker stop $container) for a guaranteed consistent copy." >&2
		fi
		echo "Copying $container:$db_path..."
		docker cp "$container:$db_path" "$dest"
		for suffix in -journal -wal -shm; do
			docker cp "$container:$db_path$suffix" "$dest$suffix" >/dev/null 2>&1 || true
		done
	fi
fi

if [ ! -s "$dest" ]; then
	echo "Backup failed: $dest is missing or empty." >&2
	exit 1
fi

if have_sqlite3; then
	# Opening the copy also rolls back any hot journal copied alongside it.
	integrity="$("$SQLITE3" "$dest" "PRAGMA integrity_check;")"
	if [ "$integrity" != "ok" ]; then
		echo "Integrity check FAILED for $dest:" >&2
		echo "$integrity" >&2
		exit 1
	fi
	rm -f "$dest-journal" "$dest-wal" "$dest-shm"
	echo "Integrity check: ok"
	echo "Applied migrations:"
	"$SQLITE3" "$dest" "SELECT '  ' || version FROM schema_migrations ORDER BY version;"
	echo "Row counts:"
	for table in orders order_items products coupons sale_periods admin_users; do
		echo "  $table: $("$SQLITE3" "$dest" "SELECT COUNT(*) FROM $table;")"
	done
else
	echo "sqlite3 not found, skipping integrity check."
fi

if command -v sha256sum >/dev/null 2>&1; then
	sha256sum "$dest" > "$dest.sha256"
fi

echo "Backup written to $dest"
