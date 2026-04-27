import sqlite3
import os

db_path = 'backend/database.db'

if not os.path.exists(db_path):
    print("Database file NOT FOUND at 'backend/database.db'")
    exit(1)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    print("Database Tables and Row Counts:")
    print("-" * 40)
    for table_name in tables:
        name = table_name[0]
        cursor.execute(f"SELECT COUNT(*) FROM {name}")
        count = cursor.fetchone()[0]
        print(f"{name.ljust(25)} | {count}")
    print("-" * 40)
except Exception as e:
    print(f"Error reading DB: {e}")
