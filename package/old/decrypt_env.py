from cryptography.fernet import Fernet

def load_key():
    return open('secret.key', 'rb').read()

def decrypt_file(file_path):
    key = load_key()
    f = Fernet(key)

    with open(file_path, 'rb') as file:
        encrypted_data = file.read()

    decrypted_data = f.decrypt(encrypted_data)

    with open('.env.decrypted', 'wb') as file:
        file.write(decrypted_data)

if __name__ == '__main__':
    decrypt_file('.env.enc')
    print("Decryption complete.")
