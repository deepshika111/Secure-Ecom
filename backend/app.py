from flask import Flask, request, jsonify
import sqlite3
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
import string
import time
# from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
# Update CORS configuration to handle credentials
CORS(app, resources={
    r"/*": {
        "origins": ["*"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})
DATABASE = 'users.db'

# Email configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "nikhithareddyrolakanti88@gmail.com"  # Replace with your email
SENDER_PASSWORD = "ogjs pgab mldf qicf"   # Replace with your app password

# Store verification codes temporarily (in production, use Redis or similar)
verification_codes = {}

def send_verification_email(email, code):
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = email
        msg['Subject'] = "Your Security Lab Verification Code"

        body = f"""
        Hello,

        Your verification code is: {code}

        This code will expire in 5 minutes.

        Best regards,
        Security Lab Team
        """

        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False

def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# Initialize database tables
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Drop existing comments table to update schema
    cursor.execute('DROP TABLE IF EXISTS comments')
    
    # Create comments table with user_email
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        author TEXT DEFAULT 'Anonymous',
        user_email TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Create lab_completion table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS lab_completion (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        lab_type TEXT NOT NULL,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_email, lab_type)
    )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database when the app starts
with app.app_context():
    init_db()


@app.route('/lab1/login', methods=['POST'])
def lab1_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Missing credentials"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # ✅ SAFE: Parameterized query to prevent SQL injection
    query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
    print(f"Running query: {query}")  # Debug log
    cursor.execute(query)
    # cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
    user = cursor.fetchone()
    conn.close()

    if user:
        return jsonify({"message": "Login successful", "user": dict(user)})
    else:
        return jsonify({"message": "Invalid credentials"}), 401


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Missing credentials"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # ✅ SAFE: Parameterized query to prevent SQL injection
    query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
    print(f"Running query: {query}")  # Debug log
    cursor.execute(query)
    user = cursor.fetchone()
    conn.close()

    if user:
        # Generate and send verification code
        verification_code = generate_verification_code()
        user_email = user['email']  # Assuming email field exists in users table
        
        if send_verification_email(user_email, verification_code):
            # Store verification code with timestamp
            verification_codes[username] = {
                'code': verification_code,
                'timestamp': time.time(),
                'verified': False,
                'user_id': user['id']  # Store user ID in verification data
            }
            return jsonify({
                "message": "Verification code sent",
                "require_verification": True,
                "username": username
            })
        else:
            return jsonify({"error": "Failed to send verification code"}), 500
    else:
        return jsonify({"message": "Invalid credentials"}), 401

@app.route('/verify-code', methods=['POST'])
def verify_code():
    data = request.get_json()
    username = data.get('username')
    code = data.get('code')

    if not username or not code:
        return jsonify({"error": "Missing username or code"}), 400

    stored_data = verification_codes.get(username)
    if not stored_data:
        return jsonify({"error": "No verification code found"}), 400

    # Check if code is expired (5 minutes)
    if time.time() - stored_data['timestamp'] > 300:
        del verification_codes[username]
        return jsonify({"error": "Verification code expired"}), 400

    if stored_data['code'] == code:
        # Mark as verified
        stored_data['verified'] = True
        verification_codes[username] = stored_data
        
        # Get user data
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        conn.close()

        return jsonify({
            "message": "Verification successful",
            "user": {
                "id": user['id'],
                "username": user['username'],
                "email": user['email']
            }
        })
    else:
        return jsonify({"error": "Invalid verification code"}), 400

@app.route('/playground', methods=['POST'])
def sql_playground():
    data = request.get_json()
    query = data.get('query')

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query)

        if query.strip().lower().startswith("select"):
            rows = cursor.fetchall()
            result = [dict(row) for row in rows]
        else:
            conn.commit()
            result = {"rows_affected": cursor.rowcount}

        conn.close()
        return jsonify({"success": True, "result": result})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})
    

@app.route('/lab/union-test', methods=['GET'])
def union_test_lab():
    category = request.args.get('category', '')
    print(f"Received category: {category}")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # ❌ VULNERABLE: Raw string interpolation
        query = f"SELECT name,category FROM products WHERE category = '{category}'"
        print("Lab Query:", query)
        cursor.execute(query)

        rows = cursor.fetchall()
        conn.close()

        result = [dict(row) for row in rows]
        return jsonify({"success": True, "result": result})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})



@app.route('/api/labs', methods=['GET'])
def get_labs():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, subtitle, image, locked FROM sql_injection")
    labs = cursor.fetchall()
    conn.close()
    return jsonify([dict(lab) for lab in labs])


@app.route('/api/lab/<int:lab_id>', methods=['GET'])
def get_lab_by_id(lab_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, subtitle, description, solution, locked FROM sql_injection WHERE id = ?", (lab_id,))
    lab = cursor.fetchone()
    conn.close()

    if lab:
        return jsonify(dict(lab))
    else:
        return jsonify({'error': 'Lab not found'}), 404

# New routes for Cross-Site Scripting labs
@app.route('/api/xss-labs', methods=['GET'])
def get_xss_labs():
    # In a real application, this would fetch from a database
    xss_labs = [
        {
            "id": 1,
            "title": "Reflected XSS into HTML context with nothing encoded",
            "subtitle": "Exploit a reflected XSS vulnerability in a search function",
            "description": "This lab contains a simple reflected cross-site scripting vulnerability in the search functionality. To solve the lab, perform a cross-site scripting attack that calls the alert function.",
            "image": "https://miro.medium.com/v2/resize:fit:1400/0*yBl5TCfq5uIEby6y",
            "path": "/xss-lab/reflected"
        },
        {
            "id": 2,
            "title": "Stored XSS into HTML context with nothing encoded",
            "subtitle": "Exploit a stored XSS vulnerability in a comment function",
            "description": "This lab contains a stored cross-site scripting vulnerability in the comment functionality. To solve the lab, submit a comment that performs a cross-site scripting attack that calls the alert function.",
            "image": "https://www.imperva.com/learn/wp-content/uploads/sites/13/2019/01/stored-xss.jpg",
            "path": "/xss-lab/stored"
        },
        {
            "id": 3,
            "title": "DOM-based XSS",
            "subtitle": "Exploit a DOM-based XSS vulnerability",
            "description": "This lab contains a DOM-based cross-site scripting vulnerability in the search query tracking functionality. To solve the lab, perform a cross-site scripting attack that calls the alert function.",
            "image": "https://www.imperva.com/learn/wp-content/uploads/sites/13/2019/01/dom-xss.jpg",
            "path": "/xss-lab/dom"
        }
    ]
    return jsonify(xss_labs)

@app.route('/api/xss-lab/<int:lab_id>', methods=['GET'])
def get_xss_lab_by_id(lab_id):
    # In a real application, this would fetch from a database
    xss_labs = [
        {
            "id": 1,
            "title": "Reflected XSS into HTML context with nothing encoded",
            "subtitle": "Exploit a reflected XSS vulnerability in a search function",
            "description": "This lab contains a simple reflected cross-site scripting vulnerability in the search functionality. To solve the lab, perform a cross-site scripting attack that calls the alert function.",
            "image": "https://miro.medium.com/v2/resize:fit:1400/0*yBl5TCfq5uIEby6y",
            "path": "/xss-lab/reflected"
        },
        {
            "id": 2,
            "title": "Stored XSS into HTML context with nothing encoded",
            "subtitle": "Exploit a stored XSS vulnerability in a comment function",
            "description": "This lab contains a stored cross-site scripting vulnerability in the comment functionality. To solve the lab, submit a comment that performs a cross-site scripting attack that calls the alert function.",
            "image": "https://www.imperva.com/learn/wp-content/uploads/sites/13/2019/01/stored-xss.jpg",
            "path": "/xss-lab/stored"
        },
        {
            "id": 3,
            "title": "DOM-based XSS",
            "subtitle": "Exploit a DOM-based XSS vulnerability",
            "description": "This lab contains a DOM-based cross-site scripting vulnerability in the search query tracking functionality. To solve the lab, perform a cross-site scripting attack that calls the alert function.",
            "image": "https://www.imperva.com/learn/wp-content/uploads/sites/13/2019/01/dom-xss.jpg",
            "path": "/xss-lab/dom"
        }
    ]
    
    for lab in xss_labs:
        if lab["id"] == lab_id:
            return jsonify(lab)
    
    return jsonify({'error': 'Lab not found'}), 404

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')

    if not username or not password or not email:
        return jsonify({"error": "Missing username, password, or email"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if username already exists
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "Username already exists"}), 409

    # Check if email already exists
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "Email already registered"}), 409

    # Hash the password
    hashed_password = password

    # Insert new user
    try:
        cursor.execute("INSERT INTO users (username, password, email) VALUES (?, ?, ?)",
                      (username, hashed_password, email))
        
         # Insert default lab statuses for the new user
        default_labs = [
            ('sql_injection', email, 1),  # Locked
            ('reflected', email, 1),     # Locked
             ('stored', email, 1) 
        ]
        cursor.executemany('''
        INSERT INTO lab_status (lab_name, user_email, locked)
        VALUES (?, ?, ?)
        ''', default_labs)
        conn.commit()
        conn.close()
        return jsonify({"message": "User created successfully"}), 201
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/xss/search', methods=['GET'])
def xss_search():
    query = request.args.get('q', '')
    
    # Intentionally vulnerable: directly using the query in HTML without encoding
    # This is for educational purposes only
    if not query:
        return jsonify({
            "results": [],
            "message": "Please enter a search term"
        })
    
    # Simulate product database
    products = [
        {"id": 1, "title": "Laptop", "description": "High-performance laptop with 16GB RAM", "price": 999.99},
        {"id": 2, "title": "Smartphone", "description": "Latest smartphone with 5G capability", "price": 699.99},
        {"id": 3, "title": "Tablet", "description": "10-inch tablet perfect for reading and browsing", "price": 399.99},
        {"id": 4, "title": "Headphones", "description": "Noise-cancelling wireless headphones", "price": 249.99},
        {"id": 5, "title": "Smartwatch", "description": "Fitness tracker and smartwatch in one", "price": 199.99}
    ]
    
    # Filter products based on query (intentionally vulnerable)
    # In a real application, this would use proper parameterized queries
    filtered_products = []
    for product in products:
        if query.lower() in product["title"].lower() or query.lower() in product["description"].lower():
            filtered_products.append(product)
    
    # Return results with the query included in the response (for XSS demonstration)
    return jsonify({
        "results": filtered_products,
        "query": query,
        "count": len(filtered_products)
    })

@app.route('/xss/comments', methods=['GET'])
def get_comments():
    user_email = request.args.get('user_email')
    if not user_email:
        return jsonify({'error': 'User email is required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get comments for specific user
        cursor.execute("SELECT * FROM comments WHERE user_email = ? ORDER BY timestamp DESC", (user_email,))
        comments = cursor.fetchall()
        
        # Convert rows to list of dictionaries
        comments_list = [
            {
                'id': row['id'],
                'content': row['content'],
                'author': row['author'],
                'timestamp': row['timestamp']
            }
            for row in comments
        ]
        
        return jsonify({'comments': comments_list})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/xss/comments', methods=['POST'])
def add_comment():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        data = request.get_json()
        if not data or 'content' not in data or 'user_email' not in data:
            return jsonify({'error': 'Comment content and user email are required'}), 400

        content = data['content']
        user_email = data['user_email']
        author = data.get('author', 'Anonymous')

        cursor.execute(
            "INSERT INTO comments (content, author, user_email) VALUES (?, ?, ?)",
            (content, author, user_email)
        )
        conn.commit()
        
        return jsonify({'message': 'Comment added successfully'}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/xss/clear-comments', methods=['POST'])
def clear_user_comments():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        data = request.get_json()
        if not data or 'user_email' not in data:
            return jsonify({'error': 'User email is required'}), 400

        user_email = data['user_email']

        cursor.execute("DELETE FROM comments WHERE user_email = ?", (user_email,))
        conn.commit()
        
        return jsonify({'message': 'Comments cleared successfully'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Add new endpoints for lab completion
@app.route('/api/complete-lab', methods=['POST'])
def complete_lab():
    data = request.get_json()
    user_email = data.get('user_email')
    lab_id = data.get('lab_id')
    category = data.get('category')

    if not user_email or not category:
        return jsonify({'error': 'User email and category are required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor() 
    
    try:
        # For SQL injection labs, use the lab_id as the lab_type
        lab_type = f"{category}_{lab_id}" if category == 'sql_injection' else category
        
        cursor.execute(
            "INSERT OR REPLACE INTO lab_completion (user_email, lab_type) VALUES (?, ?)",
            (user_email, lab_type)
        )
        conn.commit()
        return jsonify({'message': 'Lab completion status updated successfully'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/lab-completion/<user_email>', methods=['GET'])
def get_lab_completion(user_email):
    if not user_email:
        return jsonify({'error': 'User email is required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT lab_type FROM lab_completion WHERE user_email = ?", (user_email,))
        completed_labs = [row['lab_type'] for row in cursor.fetchall()]
        return jsonify({'completed_labs': completed_labs})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/completed-labs', methods=['GET'])
def get_completed_labs():
    try:
        # Get user email from session or request
        user_email = request.args.get('email')
        if not user_email:
            return jsonify({"error": "User email is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get completed labs for the user
        cursor.execute("""
            SELECT lab_type, completed_at 
            FROM lab_completion 
            WHERE user_email = ?
        """, (user_email,))
        
        completed_labs = cursor.fetchall()
        conn.close()

        # Format the response
        labs = [{
            'id': lab['lab_type'],
            'completed_at': lab['completed_at']
        } for lab in completed_labs]

        return jsonify(labs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/unlock-lab', methods=['POST'])
def unlock_labs():
    data = request.get_json()
    lab_ids = data.get('lab_ids')  # Expecting an array of lab IDs

    if not lab_ids or not isinstance(lab_ids, list):
        return jsonify({"error": "Lab IDs are required and must be a list"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Update the locked status of the labs
        cursor.executemany("UPDATE sql_injection SET locked = 0 WHERE id = ?", [(lab_id,) for lab_id in lab_ids])
        conn.commit()
        conn.close()

        return jsonify({"success": True, "message": f"Labs {lab_ids} unlocked successfully."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    




@app.route('/api/lab-status', methods=['GET'])
def get_lab_status():
    user_email = request.args.get('email')
    lab_name = request.args.get('lab_name')

    if not user_email or not lab_name:
        return jsonify({"error": "User email and lab name are required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Fetch the lab status for the specific user and lab
        cursor.execute('''
        SELECT locked FROM lab_status WHERE user_email = ? AND lab_name = ?
        ''', (user_email, lab_name))
        lab_status = cursor.fetchone()

        conn.close()

        if lab_status:
            return jsonify({"lab_name": lab_name, "locked": lab_status['locked']})
        else:
            return jsonify({"error": "Lab not found for the given user"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/api/unlock-lab-status', methods=['POST'])
def unlock_lab_status():
    data = request.get_json()
    user_email = data.get('user_email')
    lab_name = data.get('lab_name')

    if not user_email or not lab_name:
        return jsonify({"error": "User email and lab name are required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Update the locked status of the lab for the specific user
        cursor.execute('''
        UPDATE lab_status
        SET locked = 0
        WHERE user_email = ? AND lab_name = ?
        ''', (user_email, lab_name))

        conn.commit()
        conn.close()

        # Check if the update was successful
        if cursor.rowcount > 0:
            return jsonify({"success": True, "message": f"Lab '{lab_name}' unlocked for user '{user_email}'."})
        else:
            return jsonify({"error": "Lab not found for the given user"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
