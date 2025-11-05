"""
Encryption utilities for password manager.

IMPORTANT: The client performs the actual password encryption.
These utilities are for server-side operations (like 2FA secrets).

Client-side encryption flow:
1. User enters master password
2. Derive key using PBKDF2 with user's salt
3. Encrypt password with AES-256-GCM
4. Send encrypted data + IV + tag to server
5. Server stores encrypted data (cannot decrypt)
"""

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
from cryptography.hazmat.backends import default_backend
import os
import base64


class EncryptionService:
    """
    Server-side encryption for non-password data (like 2FA secrets).
    Uses app-level encryption key, not user's master password.
    """
    
    def __init__(self, key=None):
        """
        Initialize with encryption key.
        For 2FA secrets, use a server-side key.
        """
        if key is None:
            # In production, load from environment variable
            from django.conf import settings
            key = os.getenv('APP_ENCRYPTION_KEY')
            if not key:
                raise ValueError("APP_ENCRYPTION_KEY not set")
            key = base64.b64decode(key)
        self.key = key
    
    @staticmethod
    def generate_key():
        """Generate a new 256-bit encryption key"""
        return AESGCM.generate_key(bit_length=256)
    
    @staticmethod
    def generate_salt(size=32):
        """Generate a random salt for key derivation"""
        return os.urandom(size)
    
    @staticmethod
    def derive_key(password: str, salt: bytes, iterations: int = 100000) -> bytes:
        """
        Derive encryption key from password using PBKDF2.
        This should match the client-side key derivation.
        
        NOTE: This is for documentation/testing. In production,
        key derivation happens CLIENT-SIDE only.
        """
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=iterations,
            backend=default_backend()
        )
        return kdf.derive(password.encode())
    
    def encrypt(self, plaintext: bytes) -> tuple:
        """
        Encrypt data using AES-256-GCM.
        Returns (ciphertext, iv, tag)
        """
        aesgcm = AESGCM(self.key)
        iv = os.urandom(12)  # 96-bit IV for GCM
        
        # GCM mode returns ciphertext with authentication tag appended
        ciphertext_and_tag = aesgcm.encrypt(iv, plaintext, None)
        
        # Split ciphertext and tag
        ciphertext = ciphertext_and_tag[:-16]
        tag = ciphertext_and_tag[-16:]
        
        return ciphertext, iv, tag
    
    def decrypt(self, ciphertext: bytes, iv: bytes, tag: bytes) -> bytes:
        """
        Decrypt data using AES-256-GCM.
        Raises exception if authentication fails.
        """
        aesgcm = AESGCM(self.key)
        
        # Combine ciphertext and tag for GCM
        ciphertext_and_tag = ciphertext + tag
        
        try:
            plaintext = aesgcm.decrypt(iv, ciphertext_and_tag, None)
            return plaintext
        except Exception as e:
            raise ValueError("Decryption failed - invalid key or corrupted data") from e
    
    def encrypt_string(self, plaintext: str) -> tuple:
        """Encrypt a string and return (ciphertext, iv, tag)"""
        return self.encrypt(plaintext.encode('utf-8'))
    
    def decrypt_string(self, ciphertext: bytes, iv: bytes, tag: bytes) -> str:
        """Decrypt to string"""
        plaintext = self.decrypt(ciphertext, iv, tag)
        return plaintext.decode('utf-8')


def validate_encrypted_data(encrypted_password: bytes, iv: bytes, tag: bytes) -> bool:
    """
    Validate that encrypted data has correct format.
    This doesn't decrypt, just checks structure.
    """
    if not encrypted_password or not iv or not tag:
        return False
    
    # IV should be 12 bytes (96 bits) for GCM
    if len(iv) != 12:
        return False
    
    # Tag should be 16 bytes (128 bits) for GCM
    if len(tag) != 16:
        return False
    
    return True


def generate_password(length=16, use_symbols=True, use_numbers=True, 
                     use_uppercase=True, use_lowercase=True):
    """
    Generate a random password with specified requirements.
    This can be used by both server and client.
    """
    import secrets
    import string
    
    characters = ""
    if use_lowercase:
        characters += string.ascii_lowercase
    if use_uppercase:
        characters += string.ascii_uppercase
    if use_numbers:
        characters += string.digits
    if use_symbols:
        characters += "!@#$%^&*()_+-=[]{}|;:,.<>?"
    
    if not characters:
        raise ValueError("At least one character type must be selected")
    
    # Ensure password meets requirements
    password = ''.join(secrets.choice(characters) for _ in range(length))
    
    # Validate password meets criteria
    has_required = True
    if use_lowercase and not any(c in string.ascii_lowercase for c in password):
        has_required = False
    if use_uppercase and not any(c in string.ascii_uppercase for c in password):
        has_required = False
    if use_numbers and not any(c in string.digits for c in password):
        has_required = False
    if use_symbols and not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        has_required = False
    
    # Regenerate if doesn't meet criteria (rare case)
    if not has_required:
        return generate_password(length, use_symbols, use_numbers, 
                                use_uppercase, use_lowercase)
    
    return password