from cryptography.fernet import Fernet
import os

def generate_key():
    key = Fernet.generate_key()
    with open('secret.key', 'wb') as key_file:
        key_file.write(key)

def load_key():
    return open('secret.key', 'rb').read()

def encrypt_file(file_path):
    key = load_key()
    f = Fernet(key)

    with open(file_path, 'rb') as file:
        file_data = file.read()

    encrypted_data = f.encrypt(file_data)

    with open(file_path + '.enc', 'wb') as file:
        file.write(encrypted_data)

if __name__ == '__main__':
    if not os.path.exists('secret.key'):
        generate_key()
    encrypt_file('.env')
    print("Encryption complete.")
