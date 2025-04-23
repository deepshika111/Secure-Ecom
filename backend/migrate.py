import sqlite3

def migrate_database():
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()

    # Add email column if it doesn't exist
    try:
    #     cursor.execute('ALTER TABLE users ADD COLUMN email TEXT')
    #     print("Added email column to users table")
    # except sqlite3.OperationalError:
    #     print("Email column already exists")
        cursor.execute('''
        UPDATE lab_status
        SET locked = 1
        WHERE lab_name = 'reflected'
        ''')
        print("Updated locked value to 1 for lab_name = 'reflected'")
    except sqlite3.OperationalError as e:
        print(f"Error updating lab_status table: {e}")
    

    conn.commit()
    conn.close()

if __name__ == '__main__':
    migrate_database() 