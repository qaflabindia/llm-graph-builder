import os
import json
import logging
from cryptography.fernet import Fernet
from pathlib import Path

# Path to the encryption key and the vault file
# Path to the encryption key and the vault file
# Using absolute paths to ensure persistence in Docker container where /code is the volume
VAULT_KEY_PATH = Path("/code/.vault.key")
VAULT_FILE_PATH = Path("/code/.secrets.json.enc")

def _get_key():
    """Retrieve or generate the encryption key."""
    if not VAULT_KEY_PATH.exists():
        key = Fernet.generate_key()
        with open(VAULT_KEY_PATH, "wb") as key_file:
            key_file.write(key)
        # Add to .gitignore if not already there
        _add_to_gitignore(".vault.key")
        _add_to_gitignore(".secrets.json.enc")
    else:
        with open(VAULT_KEY_PATH, "rb") as key_file:
            key = key_file.read()
    return key

def _add_to_gitignore(filename):
    """Ensure sensitive files are ignored by git."""
    gitignore_path = Path(".gitignore")
    if gitignore_path.exists():
        with open(gitignore_path, "a+") as f:
            f.seek(0)
            content = f.read()
            if filename not in content:
                f.write(f"\n{filename}")
    else:
        with open(gitignore_path, "w") as f:
            f.write(filename)

def _load_vault():
    """Load and decrypt the vault."""
    if not VAULT_FILE_PATH.exists():
        return {}
    
    fernet = Fernet(_get_key())
    try:
        with open(VAULT_FILE_PATH, "rb") as vault_file:
            encrypted_data = vault_file.read()
            if not encrypted_data:
                return {}
            decrypted_data = fernet.decrypt(encrypted_data)
            return json.loads(decrypted_data)
    except Exception as e:
        logging.error(f"Error loading secret vault: {e}")
        return {}

def _save_vault(data):
    """Encrypt and save the vault."""
    fernet = Fernet(_get_key())
    encrypted_data = fernet.encrypt(json.dumps(data).encode())
    with open(VAULT_FILE_PATH, "wb") as vault_file:
        vault_file.write(encrypted_data)

def set_secret(name, value):
    """Store a secret in the vault."""
    vault = _load_vault()
    vault[name] = value
    _save_vault(vault)

def get_secret(name, default=None):
    """Retrieve a secret from the vault."""
    vault = _load_vault()
    return vault.get(name, default)

def list_secret_keys():
    """List all secret keys available in the vault."""
    vault = _load_vault()
    return list(vault.keys())

def delete_secret(name):
    """Delete a secret from the vault."""
    vault = _load_vault()
    if name in vault:
        del vault[name]
        _save_vault(vault)
