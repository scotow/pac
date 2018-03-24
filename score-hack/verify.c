#include <string.h>
#include <openssl/hmac.h>

#include "verify.h"

unsigned char message[] = "CBC.BAD.PAD:827:5@402336";
unsigned char token[] = {0x89, 0x99, 0x0c, 0x2f, 0x52, 0x48, 0xdd, 0x84, 0x69, 0xa0, 0x32, 0xdb, 0x5c, 0xff, 0xe3, 0xcb};


int verify(char *key) {
    return verify_digest(HMAC(EVP_md5(), key, 32, message, 24, NULL, NULL));
}

static int verify_digest(unsigned char *digest) {
    size_t i;
    for (i = 0; i < 16; i++) {
        if(digest[i] != token[i]) {
            return 0;
        }
    }

    return 1;
}