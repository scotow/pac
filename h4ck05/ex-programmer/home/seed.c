#include <stdlib.h>
#include <stdint.h>
#include <stdio.h>
#include "drand48.h"

int main(int argc, char const *argv[]) {
    FILE *file;
    uint32_t IV[4];
    uint32_t seed;

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

    IV[0] = __builtin_bswap32(IV[0]);
    IV[1] = __builtin_bswap32(IV[1]);
    IV[2] = __builtin_bswap32(IV[2]);
    IV[3] = __builtin_bswap32(IV[3]);

    for(seed = 0; seed < 0xFFFFFFFF; seed++) {
        my_srand48(seed);

        // Discard first 4 results.
        my_mrand48(); my_mrand48(); my_mrand48(); my_mrand48();

        if(my_mrand48() == IV[0] && my_mrand48() == IV[1] && my_mrand48() == IV[2] && my_mrand48() == IV[3]) {
            printf("%x\n", seed);
            break;
        }

        if(seed % (0xFFFFFFFF / 100) == 0) {
            putchar('.');
            fflush(stdout);
        }
    }

    return EXIT_SUCCESS;
}
