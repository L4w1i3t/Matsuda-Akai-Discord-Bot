from cryptography.fernet import Fernet

def decrypt_env():
    key_file = 'secret.key'
    encrypted_file = '.env.enc'
    decrypted_file = '.env.decrypted'

    # Load the key
    with open(key_file, 'rb') as file:
        key = file.read()

    # Initialize the Fernet object
    fernet = Fernet(key)

    # Read the encrypted file
    with open(encrypted_file, 'rb') as file:
        encrypted_data = file.read()

    # Decrypt the data
    decrypted_data = fernet.decrypt(encrypted_data)

    # Write the decrypted data to the .env.decrypted file
    with open(decrypted_file, 'wb') as file:
        file.write(decrypted_data)

    print("Decryption complete.")
