"""
Authentication, Cryptography, and JWT RBAC Engine.
Implements RFC 7519 HS256 tokens, PBKDF2 password verification,
and strict role-based access control without external dependencies.
"""

import os
import json
import base64
import hmac
import hashlib
import time
import secrets
from datetime import datetime, timezone
from backend.database import get_connection, verify_password, hash_password

SECRET_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".jwt_secret")

def get_or_create_secret() -> bytes:
    """Retrieves or creates a secure 256-bit server secret for JWT signing."""
    if os.path.exists(SECRET_FILE):
        with open(SECRET_FILE, "rb") as f:
            secret = f.read().strip()
            if secret:
                return secret
    new_secret = secrets.token_bytes(32)
    with open(SECRET_FILE, "wb") as f:
        f.write(new_secret)
    return new_secret

JWT_SECRET = get_or_create_secret()

class AuthException(Exception):
    status_code = 401
    def __init__(self, message):
        super().__init__(message)
        self.message = message

class InvalidCredentialsError(AuthException):
    status_code = 401

class RoleMismatchError(AuthException):
    status_code = 403

class TokenExpiredError(AuthException):
    status_code = 401

class AccessDeniedError(AuthException):
    status_code = 403

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")

def _b64url_decode(s: str) -> bytes:
    padding = "=" * ((4 - len(s) % 4) % 4)
    return base64.urlsafe_b64decode(s + padding)

def create_jwt(payload: dict, expires_in_seconds: int = 86400) -> str:
    """Creates an RFC 7519 compliant HS256 JWT token."""
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    full_payload = {
        **payload,
        "iat": now,
        "exp": now + expires_in_seconds,
        "jti": secrets.token_hex(16)
    }

    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(full_payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    
    signature = hmac.new(JWT_SECRET, signing_input, hashlib.sha256).digest()
    signature_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"

def verify_jwt(token: str) -> dict:
    """Verifies HS256 signature, expiration, and database revocation status."""
    if not token or not isinstance(token, str):
        raise AuthException("Missing or invalid authentication token.")

    parts = token.strip().split(".")
    if len(parts) != 3:
        raise AuthException("Malformed authentication token.")

    header_b64, payload_b64, signature_b64 = parts
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")

    expected_sig = hmac.new(JWT_SECRET, signing_input, hashlib.sha256).digest()
    try:
        actual_sig = _b64url_decode(signature_b64)
    except Exception:
        raise AuthException("Invalid token signature encoding.")

    if not hmac.compare_digest(expected_sig, actual_sig):
        raise AuthException("Invalid token signature.")

    try:
        payload_bytes = _b64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        raise AuthException("Invalid token payload.")

    # Check Expiration
    now = int(time.time())
    if "exp" in payload and payload["exp"] < now:
        raise TokenExpiredError("Your session has expired. Please log in again.")

    # Check Revocation in Database
    jti = payload.get("jti")
    if jti:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT is_revoked FROM sessions WHERE token_id = ?;", (jti,))
        row = cur.fetchone()
        conn.close()
        if row and row["is_revoked"] == 1:
            raise AuthException("Your session has been logged out. Please log in again.")

    return payload

def authenticate_user(email: str, password: str, expected_role: str = None, client_ip: str = "127.0.0.1") -> tuple[dict, str]:
    """
    Validates user credentials against database, checks role match,
    and returns (user_dict, token).
    """
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, name, email, password_hash, role, status
        FROM users
        WHERE LOWER(email) = LOWER(?);
    """, (email.strip(),))
    user = cur.fetchone()

    now_iso = datetime.now(timezone.utc).isoformat()

    if not user or not verify_password(password, user["password_hash"]):
        # Audit log failed attempt
        cur.execute("""
            INSERT INTO system_logs (id, event_type, user_id, ip_address, details, created_at)
            VALUES (?, 'AUTH_FAILED', ?, ?, ?, ?);
        """, (secrets.token_hex(12), email, client_ip, "Invalid credentials provided", now_iso))
        conn.commit()
        conn.close()
        raise InvalidCredentialsError("Invalid ID/email or password.")

    if user["status"] != "ACTIVE":
        conn.close()
        raise AuthException("Account is inactive. Please contact administration.")

    # Strict Role Restriction Check
    if expected_role and user["role"].upper() != expected_role.upper():
        cur.execute("""
            INSERT INTO system_logs (id, event_type, user_id, ip_address, details, created_at)
            VALUES (?, 'ROLE_MISMATCH', ?, ?, ?, ?);
        """, (secrets.token_hex(12), user["id"], client_ip, f"User role {user['role']} attempted {expected_role} login", now_iso))
        conn.commit()
        conn.close()
        raise RoleMismatchError("You are not authorized to access this login.")

    # Issue JWT Token
    token = create_jwt({
        "sub": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"]
    })

    # Decode JTI from newly created token to register session
    payload = verify_jwt(token)
    token_id = payload["jti"]
    expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc).isoformat()

    # Register active session
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    cur.execute("""
        INSERT INTO sessions (token_id, user_id, token_hash, created_at, expires_at, is_revoked)
        VALUES (?, ?, ?, ?, ?, 0);
    """, (token_id, user["id"], token_hash, now_iso, expires_at))

    # Audit log successful login
    cur.execute("""
        INSERT INTO system_logs (id, event_type, user_id, ip_address, details, created_at)
        VALUES (?, 'LOGIN_SUCCESS', ?, ?, ?, ?);
    """, (secrets.token_hex(12), user["id"], client_ip, f"Successful login as {user['role']}", now_iso))

    conn.commit()
    conn.close()

    user_data = {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"]
    }
    return user_data, token

def revoke_token(token: str, client_ip: str = "127.0.0.1") -> bool:
    """Revokes active token in session store on logout."""
    try:
        payload = verify_jwt(token)
        jti = payload.get("jti")
        if jti:
            conn = get_connection()
            cur = conn.cursor()
            cur.execute("UPDATE sessions SET is_revoked = 1 WHERE token_id = ?;", (jti,))
            now_iso = datetime.now(timezone.utc).isoformat()
            cur.execute("""
                INSERT INTO system_logs (id, event_type, user_id, ip_address, details, created_at)
                VALUES (?, 'LOGOUT', ?, ?, 'User successfully logged out', ?);
            """, (secrets.token_hex(12), payload.get("sub"), client_ip, now_iso))
            conn.commit()
            conn.close()
            return True
    except Exception:
        pass
    return False

def reset_password_demo(email: str, new_password: str) -> bool:
    """Development / Demo password reset workflow updating SQLite database."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(?);", (email.strip(),))
    user = cur.fetchone()
    if not user:
        conn.close()
        raise AuthException("No registered account found with that email address.")

    new_hash = hash_password(new_password)
    now_iso = datetime.now(timezone.utc).isoformat()
    cur.execute("""
        UPDATE users
        SET password_hash = ?, updated_at = ?
        WHERE id = ?;
    """, (new_hash, now_iso, user["id"]))

    cur.execute("""
        INSERT INTO system_logs (id, event_type, user_id, ip_address, details, created_at)
        VALUES (?, 'PASSWORD_RESET', ?, '127.0.0.1', 'Password successfully reset via Demo Reset Flow', ?);
    """, (secrets.token_hex(12), user["id"], now_iso))

    conn.commit()
    conn.close()
    return True
