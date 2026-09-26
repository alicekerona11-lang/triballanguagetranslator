"""
Database schema, connection management, and initial data seeding for the
Tribal Language Learning & Classroom Communication Platform.
Uses standard library sqlite3 with full ACID compliance and foreign keys.
"""

import os
import sqlite3
import hashlib
import secrets
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tribal_edu.db")

def hash_password(password: str) -> str:
    """Hashes password using PBKDF2-HMAC-SHA256 with 100,000 iterations and a unique salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"pbkdf2_sha256$100000${salt}${key.hex()}"

def verify_password(password: str, hashed_str: str) -> bool:
    """Verifies a password against the stored PBKDF2 hash using constant-time comparison."""
    try:
        algorithm, iterations, salt, key_hex = hashed_str.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        test_key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), int(iterations))
        import hmac
        return hmac.compare_digest(test_key.hex(), key_hex)
    except Exception:
        return False

def get_connection():
    """Returns a SQLite connection with foreign keys enabled and Row factory."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Creates all required database tables and seeds demo accounts and curricula."""
    conn = get_connection()
    cur = conn.cursor()

    # 1. Roles Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS roles (
        role_name TEXT PRIMARY KEY,
        description TEXT
    );
    """)

    # 2. Users Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT DEFAULT 'ACTIVE',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (role) REFERENCES roles(role_name)
    );
    """)

    # 3. Sessions & Token Revocations Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        is_revoked INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # 4. Schools Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS schools (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        district TEXT NOT NULL,
        state TEXT NOT NULL
    );
    """)

    # 5. Classes Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS classes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        school_id TEXT NOT NULL,
        teacher_id TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
    );
    """)

    # 6. Students Profile Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        class_id TEXT NOT NULL,
        roll_no TEXT NOT NULL,
        school_id TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
    );
    """)

    # 7. Teachers Profile Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS teachers (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        school_id TEXT NOT NULL,
        designation TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
    );
    """)

    # 8. Curricula Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS curricula (
        id TEXT PRIMARY KEY,
        course_name TEXT NOT NULL,
        language TEXT NOT NULL,
        classes TEXT NOT NULL,
        status TEXT DEFAULT 'Approved',
        version TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    # 9. Learning Materials Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS learning_materials (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL, -- PDF, Flashcards, Audio
        course_id TEXT,
        file_path TEXT,
        status TEXT DEFAULT 'Cached Offline',
        created_at TEXT NOT NULL,
        FOREIGN KEY (course_id) REFERENCES curricula(id) ON DELETE SET NULL
    );
    """)

    # 10. Flashcards Table (Ol Chiki)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS flashcards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        script TEXT NOT NULL,
        roman TEXT NOT NULL,
        hindi_meaning TEXT NOT NULL,
        english_meaning TEXT NOT NULL,
        example_word TEXT NOT NULL
    );
    """)

    # 11. Lessons Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        lesson_number TEXT NOT NULL,
        title_santali TEXT NOT NULL,
        title_hindi TEXT NOT NULL,
        content TEXT NOT NULL,
        duration TEXT NOT NULL,
        type TEXT NOT NULL,
        order_index INTEGER DEFAULT 0,
        FOREIGN KEY (course_id) REFERENCES curricula(id) ON DELETE CASCADE
    );
    """)

    # 12. Student Progress Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS student_progress (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        lesson_id TEXT NOT NULL,
        progress_percent INTEGER DEFAULT 0,
        status TEXT DEFAULT 'Not Started', -- 'Completed', 'In Progress', 'Not Started'
        completed_at TEXT,
        updated_at TEXT NOT NULL,
        UNIQUE (student_id, lesson_id),
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );
    """)

    # 13. Translations Log Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS translations (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        source_text TEXT NOT NULL,
        source_lang TEXT NOT NULL,
        target_text TEXT NOT NULL,
        target_lang TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    """)

    # 14. Sync Queue Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT DEFAULT 'SYNCED',
        created_at TEXT NOT NULL,
        synced_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # 15. System Logs Table (Audit Trail)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS system_logs (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        user_id TEXT,
        ip_address TEXT,
        details TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    conn.commit()

    # Seed initial roles
    roles = [
        ("STUDENT", "Student in Tribal Education Program"),
        ("TEACHER", "Certified Bilingual Primary / Secondary Teacher"),
        ("AUTHORITY", "District / State Education Administrator")
    ]
    cur.executemany("INSERT OR IGNORE INTO roles (role_name, description) VALUES (?, ?);", roles)

    # Seed initial schools
    school_id = "SCH-001"
    cur.execute("""
    INSERT OR IGNORE INTO schools (id, name, code, district, state)
    VALUES (?, ?, ?, ?, ?);
    """, (school_id, "Government Tribal Residential School, Dumka", "UDISE+ 20140204901", "Dumka", "Jharkhand"))

    # Seed initial demo users with Password@123
    now = datetime.now(timezone.utc).isoformat()
    demo_password_hash = hash_password("Password@123")

    users_seed = [
        ("USR-STU-01", "Sunita Murmu", "student@example.com", demo_password_hash, "STUDENT", "ACTIVE", now, now),
        ("USR-TEA-01", "Smt. Sunita Soren", "teacher@example.com", demo_password_hash, "TEACHER", "ACTIVE", now, now),
        ("USR-AUT-01", "Dr. Sunil Kumar Verma", "authority@example.com", demo_password_hash, "AUTHORITY", "ACTIVE", now, now)
    ]
    cur.executemany("""
    INSERT OR IGNORE INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    """, users_seed)

    # Seed Teacher Profile
    tea_profile_id = "TEA-001"
    cur.execute("""
    INSERT OR IGNORE INTO teachers (id, user_id, school_id, designation)
    VALUES (?, ?, ?, ?);
    """, (tea_profile_id, "USR-TEA-01", school_id, "Assistant Primary Teacher (Bilingual)"))

    # Seed Class
    class_id = "CLS-001"
    cur.execute("""
    INSERT OR IGNORE INTO classes (id, name, school_id, teacher_id, created_at)
    VALUES (?, ?, ?, ?, ?);
    """, (class_id, "Class 5 - Language & Environmental Studies", school_id, tea_profile_id, now))

    # Seed Student Profile
    stu_profile_id = "STU-001"
    cur.execute("""
    INSERT OR IGNORE INTO students (id, user_id, class_id, roll_no, school_id)
    VALUES (?, ?, ?, ?, ?);
    """, (stu_profile_id, "USR-STU-01", class_id, "0501", school_id))

    # Additional Students in Class 5 for teacher view
    extra_students = [
        ("USR-STU-02", "Birsa Hembrom", "birsa@example.com", "0502", 64, "Yesterday", "Needs Review"),
        ("USR-STU-03", "Maino Hansda", "maino@example.com", "0503", 81, "Today", "Excellent"),
        ("USR-STU-04", "Hopna Tudu", "hopna@example.com", "0504", 58, "Today", "On Track"),
        ("USR-STU-05", "Shanti Soren", "shanti@example.com", "0505", 90, "2 days ago", "Completed Module 1")
    ]
    for uid, name, email, roll, prog, last_act, stat in extra_students:
        cur.execute("""
        INSERT OR IGNORE INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'STUDENT', 'ACTIVE', ?, ?);
        """, (uid, name, email, demo_password_hash, now, now))
        cur.execute("""
        INSERT OR IGNORE INTO students (id, user_id, class_id, roll_no, school_id)
        VALUES (?, ?, ?, ?, ?);
        """, (f"STU-{roll}", uid, class_id, roll, school_id))

    # Seed Curricula
    curricula_seed = [
        ("CUR-01", "Primary Santali-Hindi Bridge Curriculum", "Santali (Ol Chiki) ↔ Hindi", "Classes 1 to 5", "Approved", "v2.4", now),
        ("CUR-02", "Foundational Ol Chiki Literacy & Phonics", "Santali (Ol Chiki)", "Class 1 & 2", "Approved", "v3.1", now),
        ("CUR-03", "Environmental Studies & Tribal Heritage", "Bilingual (Santali / Hindi)", "Classes 4 & 5", "Under Review", "v1.2", now),
        ("CUR-04", "Mundari Oral Folk Tales & Number Sense", "Mundari ↔ Hindi", "Class 1 & 2", "Pilot Stage", "v0.9", now),
        ("CUR-05", "Ho Language Early Childhood Balvatika Module", "Ho (Warang Chiti) ↔ Hindi", "Balvatika", "Draft", "v0.4", now)
    ]
    cur.executemany("""
    INSERT OR IGNORE INTO curricula (id, course_name, language, classes, status, version, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?);
    """, curricula_seed)

    # Seed Lessons
    lessons_seed = [
        ("LES-01", "CUR-01", "Lesson 01", "ᱚᱞ ᱪᱤᱠᱤ ᱢᱩᱬᱩᱛ ᱟᱠᱷᱚᱨ (Ol Chiki Alphabet Basics)", "ओल चिकी मूल वर्णमाला परिचय", 
         "The Ol Chiki script was created by Guru Gomke Pandit Raghunath Murmu in 1925. It contains 30 primary phonetic characters that naturally represent the rich sounds of Santali speech without requiring external diacritics.", 
         "15 mins", "Phonics & Script", 1),
        ("LES-02", "CUR-01", "Lesson 02", "ᱟᱵᱚᱣᱟᱜ ᱚᱲᱟᱜ ᱟᱨ ᱜᱷᱟᱨᱚᱸᱡᱽ (Our Home & Family)", "हमारा घर और परिवार शब्दावली", 
         "Everyday Santali terms for home life: Oṛak' (House/Home), Baba (Father), Aayo (Mother), Boyha (Brother/Sibling), and Kaka (Uncle). Learn how to introduce family members in both Santali and Hindi.", 
         "20 mins", "Vocabulary & Reading", 2),
        ("LES-03", "CUR-01", "Lesson 03", "ᱫᱟᱨᱮ ᱱᱟᱹᱲᱤ ᱟᱨ ᱡᱤᱵᱽ ᱡᱤᱭᱟᱹᱞᱤ (Trees & Forest Animals)", "पेड़-पौधे एवं वन जीव", 
         "Explore forest ecology: Dare (Tree), Sakam (Leaf), Baha (Flower), Kul (Tiger), and Bir (Forest). Learn foundational environmental science using indigenous tribal ecological knowledge.", 
         "25 mins", "Environmental Studies", 3),
        ("LES-04", "CUR-01", "Lesson 04", "ᱮᱞᱠᱷᱟ ᱟᱨ ᱞᱮᱠᱷᱟ ᱑ ᱠᱷᱚᱱ ᱒᱐ (Numbers 1 to 20)", "गिनती १ से २० तक", 
         "Numeracy bridge from 1 to 20: Mit' (1), Bar (2), Pe (3), Pun (4), Mõrẽ (5), Turui (6), Eyae (7), Irəl (8), Are (9), Gəl (10). Understanding counting in bilingual contexts.", 
         "18 mins", "Bilingual Numeracy", 4)
    ]
    cur.executemany("""
    INSERT OR IGNORE INTO lessons (id, course_id, lesson_number, title_santali, title_hindi, content, duration, type, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, lessons_seed)

    # Seed Student 01 progress
    cur.execute("""
    INSERT OR IGNORE INTO student_progress (id, student_id, lesson_id, progress_percent, status, completed_at, updated_at)
    VALUES (?, ?, ?, 100, 'Completed', ?, ?);
    """, ("PRG-01", stu_profile_id, "LES-01", now, now))
    cur.execute("""
    INSERT OR IGNORE INTO student_progress (id, student_id, lesson_id, progress_percent, status, completed_at, updated_at)
    VALUES (?, ?, ?, 72, 'In Progress', NULL, ?);
    """, ("PRG-02", stu_profile_id, "LES-02", now))

    # Seed Learning Materials
    materials_seed = [
        ("MAT-01", "Primary Bridge Textbook - Grade 5 (PDF)", "PDF", "CUR-01", "/materials/grade5_bridge.pdf", "Cached Offline", now),
        ("MAT-02", "Ol Chiki Foundational Phonics Deck (120 Cards)", "Flashcards", "CUR-02", "/materials/olchiki_deck.json", "Cached Offline", now),
        ("MAT-03", "Forest Tales Oral Pronunciation Audio Collection", "Audio", "CUR-01", "/materials/forest_tales.mp3", "Cached Offline", now)
    ]
    cur.executemany("""
    INSERT OR IGNORE INTO learning_materials (id, title, type, course_id, file_path, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?);
    """, materials_seed)

    # Seed Flashcards
    flashcards_seed = [
        ("ᱚ", "Laa", "धरती / ज़मीन", "Earth / Soil", "ᱚᱛ (Ot - Earth)"),
        ("ᱛ", "At", "हाथ / पंजा", "Hand / Palm", "ᱛᱤ (Ti - Hand)"),
        ("ᱜ", "Ag", "धनुष", "Bow (Archery)", "ᱟᱜ (Aak - Bow)"),
        ("ᱝ", "Ang", "हवा / वायु", "Wind / Air", "ᱦᱚᱭ (Hoy - Wind)"),
        ("ᱞ", "Al", "लिखना / लिपि", "Writing / Script", "ᱚᱞ ᱪᱤᱠᱤ (Ol Chiki - Script)"),
        ("ᱟ", "Aah", "मुँह / वाणी", "Mouth / Voice", "ᱟᱲᱟᱝ (Arang - Sound)"),
        ("ᱠ", "Ak", "हंस / चिड़िया", "Goose / Bird", "ᱪᱮᱬᱮ (Chene - Bird)"),
        ("ᱡ", "Aj", "पेड़ / वृक्ष", "Tree / Plant", "ᱫᱟᱨᱮ (Dare - Tree)"),
        ("ᱢ", "Am", "आँख / दृष्टि", "Eye / Sight", "ᱢᱮᱫ (Med - Eye)"),
        ("ᱣ", "Aw", "जल / पानी", "Water / Stream", "ᱫᱟᱜ (Dak - Water)")
    ]
    cur.executemany("""
    INSERT OR IGNORE INTO flashcards (script, roman, hindi_meaning, english_meaning, example_word)
    VALUES (?, ?, ?, ?, ?);
    """, flashcards_seed)

    # Seed Initial Translations
    translations_seed = [
        ("TRN-01", "USR-TEA-01", "नमस्ते बच्चों, आज हम प्रकृति के बारे में पढ़ेंगे।", "hi", "ᱡᱚᱦᱟᱨ ᱯᱟᱹᱴᱷᱩᱣᱟᱹ ᱠᱚ, ᱛᱮᱦᱮᱧ ᱫᱚ ᱟᱵᱚ ᱯᱨᱚᱠᱨᱤᱛᱤ ᱵᱟᱵᱚᱛ ᱵᱚᱱ ᱯᱟᱲᱦᱟᱣᱜ-ᱟ ᱾", "sat", now),
        ("TRN-02", "USR-TEA-01", "अपनी किताबें खोलिए।", "hi", "ᱟᱯᱮᱭᱟᱜ ᱯᱩᱛᱷᱤ ᱠᱚ ᱡᱷᱤᱡᱽ ᱯᱮ ᱾", "sat", now)
    ]
    cur.executemany("""
    INSERT OR IGNORE INTO translations (id, user_id, source_text, source_lang, target_text, target_lang, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?);
    """, translations_seed)

    conn.commit()
    conn.close()
    print("Database initialized and seeded successfully.")

if __name__ == "__main__":
    init_db()
