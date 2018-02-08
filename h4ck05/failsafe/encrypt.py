import random

def encrypt(plaintext, key):
    # seed the PRNG
    random.seed(key)

    # encode the (unicode) plaintext into a sequence of bytes
    plain_bytes = plaintext.encode()

    # generate the ciphertext by XORing a (pseudo-)random mask with the plaintext
    ciphertext = bytearray()

    for i in range(len(plain_bytes)):
        if (i % 4) == 0:
            # get 32 pseudo-random bits
            mask_word = random.getrandbits(32)

        # extract the next unused 8 bits from mask_word
        mask_byte = (mask_word >> (8 * (i % 4))) & 0xff
        encrypted_byte = plain_bytes[i] ^ mask_byte
        ciphertext.append(encrypted_byte)

    return bytes(ciphertext)
