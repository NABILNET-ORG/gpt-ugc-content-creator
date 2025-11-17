#!/usr/bin/env python3
"""
Supabase Database Migration Tool
Connects to Supabase via Session Pooler and runs schema migrations.
"""

import psycopg2
from psycopg2 import sql
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys
from datetime import datetime

# Supabase connection string
DATABASE_URL = "postgresql://postgres.cflcjeupixrimucbyhit:SisI2009@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

def log(message):
    """Print timestamped log message"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}", flush=True)

def connect_to_supabase():
    """Establish connection to Supabase"""
    try:
        log("Connecting to Supabase...")
        conn = psycopg2.connect(DATABASE_URL)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        log("[OK] Connected to Supabase successfully")
        return conn
    except Exception as e:
        log(f"[ERROR] Failed to connect to Supabase: {e}")
        sys.exit(1)

def read_schema_file():
    """Read the schema SQL file"""
    try:
        log("Reading schema file: src/db/schema.sql")
        with open('src/db/schema.sql', 'r', encoding='utf-8') as f:
            schema_sql = f.read()
        log(f"[OK] Schema file read successfully ({len(schema_sql)} characters)")
        return schema_sql
    except Exception as e:
        log(f"[ERROR] Failed to read schema file: {e}")
        sys.exit(1)

def run_migration(conn, schema_sql):
    """Execute the schema migration"""
    try:
        log("Starting database migration...")
        cursor = conn.cursor()

        # Execute the schema SQL
        cursor.execute(schema_sql)

        log("[OK] Migration executed successfully")
        cursor.close()
    except Exception as e:
        log(f"[ERROR] Migration failed: {e}")
        sys.exit(1)

def audit_tables(conn):
    """Audit and verify created tables"""
    try:
        log("\n" + "="*60)
        log("DATABASE AUDIT")
        log("="*60)

        cursor = conn.cursor()

        # Check for all expected tables
        expected_tables = ['users', 'projects', 'videos', 'payments', 'credits']

        for table_name in expected_tables:
            # Check if table exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = %s
                );
            """, (table_name,))

            exists = cursor.fetchone()[0]

            if exists:
                # Get row count
                cursor.execute(sql.SQL("SELECT COUNT(*) FROM {}").format(
                    sql.Identifier(table_name)
                ))
                count = cursor.fetchone()[0]

                # Get column count
                cursor.execute("""
                    SELECT COUNT(*)
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = %s;
                """, (table_name,))
                col_count = cursor.fetchone()[0]

                log(f"[OK] Table '{table_name}': {count} rows, {col_count} columns")
            else:
                log(f"[MISSING] Table '{table_name}': NOT FOUND")

        # Check indexes
        log("\n" + "-"*60)
        log("Checking Indexes...")
        log("-"*60)

        cursor.execute("""
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND indexname LIKE 'idx_%'
            ORDER BY indexname;
        """)

        indexes = cursor.fetchall()
        log(f"Found {len(indexes)} custom indexes:")
        for idx in indexes:
            log(f"  [OK] {idx[0]}")

        cursor.close()
        log("\n" + "="*60)
        log("AUDIT COMPLETE")
        log("="*60 + "\n")

    except Exception as e:
        log(f"[ERROR] Audit failed: {e}")

def list_all_tables(conn):
    """List all tables in the public schema"""
    try:
        log("\n" + "="*60)
        log("ALL TABLES IN PUBLIC SCHEMA")
        log("="*60)

        cursor = conn.cursor()
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)

        tables = cursor.fetchall()
        if tables:
            for table in tables:
                log(f"  - {table[0]}")
        else:
            log("  (No tables found)")

        cursor.close()
        log("="*60 + "\n")

    except Exception as e:
        log(f"[ERROR] Failed to list tables: {e}")

def main():
    """Main execution flow"""
    log("="*60)
    log("SUPABASE DATABASE MIGRATION TOOL")
    log("="*60 + "\n")

    # Connect to Supabase
    conn = connect_to_supabase()

    # List existing tables (before migration)
    log("BEFORE MIGRATION:")
    list_all_tables(conn)

    # Read schema file
    schema_sql = read_schema_file()

    # Run migration
    run_migration(conn, schema_sql)

    # List tables (after migration)
    log("\nAFTER MIGRATION:")
    list_all_tables(conn)

    # Audit tables
    audit_tables(conn)

    # Close connection
    conn.close()
    log("Connection closed")

    log("\n" + "="*60)
    log("[SUCCESS] MIGRATION COMPLETED SUCCESSFULLY")
    log("="*60)
    log("\nYour Supabase database is now ready!")
    log("All API endpoints should now work correctly.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("\n\n[CANCELLED] Migration cancelled by user")
        sys.exit(1)
    except Exception as e:
        log(f"\n\n[ERROR] Unexpected error: {e}")
        sys.exit(1)
