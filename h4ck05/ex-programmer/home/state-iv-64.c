#include <stdlib.h>
#include <stdint.h>
#include <stdio.h>

uint64_t reverse_dran64(uint64_t value) {
    value -= 11;
    value *= 8868678245928342373U;
    return value;
}

int main(int argc, char const *argv[]) {
    FILE *file;
    uint32_t K[4], IV[4];
    uint64_t state, iv_0_state;
    uint32_t i;

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

    // printf("IV[0]: %x\n", IV[0]);
    // printf("IV[1]: %x\n", IV[1]);

    for(i = 0; i < 4; i++) {
        IV[i] = __builtin_bswap32(IV[i]);
    }

    // printf("IV[0]: %x\n", IV[0]);
    // printf("IV[1]: %x\n", IV[1]);

    for(i = 0; i < 0xFFFFFFFF; i++) {
        iv_0_state = IV[0];
        iv_0_state = (iv_0_state << 32) | i;
        if(((0x00000005deece66d * iv_0_state + 11) >> 32) == IV[1]) {
            break;
        }
    }
    printf("State at IV[0]: %llx\n", iv_0_state);
    state = iv_0_state;

    // IV from file.
    for(i = 0; i < 4; i++) {
        printf("IV_FILE[%d]: %x\n", i, IV[i]);
    }

    // IV generated.
    for(i = 0; i < 4; i++) {
        printf("IV_RAND[%d]: %llx\n", i, state >> 32);
        state = (0x00000005deece66d * state + 11);
    }

    state = iv_0_state;
    // Key.
    for(i = 4; i --> 0;) {
        state = reverse_dran64(state);
        K[i] = state >> 32;
    }

    for(i = 0; i < 8; i++) {
        printf("RAND[%d]: %llx\n", i, state >> 32);
        state = (0x00000005deece66d * state + 11);
    }

    printf("Key: %x%x%x%x\n", K[0], K[1], K[2], K[3]);

    return EXIT_SUCCESS;
}
