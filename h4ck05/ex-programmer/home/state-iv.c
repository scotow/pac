#include <stdlib.h>
#include <stdint.h>
#include <stdio.h>

int main(int argc, char const *argv[]) {
    FILE *file;
    uint32_t IV[4];
    uint64_t v;

    if(argc != 2) {
        fprintf(stderr, "Ciphertext required.\n");
        exit(EXIT_FAILURE);
    }

    file = fopen(argv[1], "r");
    if(file == NULL) {
        fprintf(stderr, "Error while opening file.\n");
        exit(EXIT_FAILURE);
    }

    fread(IV, 16, 1, file);
    fclose(file);

    printf("IV[0]: %x\n", IV[0]);
    printf("IV[1]: %x\n", IV[1]);

    IV[0] = __builtin_bswap32(IV[0]);
    IV[1] = __builtin_bswap32(IV[1]);

    printf("IV[0]: %x\n", IV[0]);
    printf("IV[1]: %x\n", IV[1]);

    unsigned int i;
    for(i = 0; i <= 0xFFFF; i++) {
        v = IV[0] << 16;
        // v = v << 16;
        v = v | i;
        v = (0x00000005deece66d * v + 11) & 0x0000ffffffffffff;
        if((v >> 16) == IV[1]) {
            printf("Found: %x", i);
        }
    }

    return EXIT_SUCCESS;
}
