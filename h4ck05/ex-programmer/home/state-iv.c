#include <stdlib.h>
#include <stdint.h>
#include <stdio.h>

int main(int argc, char const *argv[]) {
    FILE *file;
    uint32_t iv_0, iv_1;
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

    fread(&iv_0, sizeof(uint32_t), 1, file);
    fread(&iv_1, sizeof(uint32_t), 1, file);
    fclose(file);

    // iv_0 = 0x4379c97c;
    // iv_1 = 0xa873f624;

    printf("iv_0: %x\n", iv_0);
    printf("iv_1: %x\n", iv_1);

    unsigned int i;
    for(i = 0; i <= 0xFFFF; i++) {
        v = (iv_0 << 16) | i;
        v = (0x00000005deece66d * v + 11) & 0x0000ffffffffffff;
        // printf("%llx\n", v);
        if((v >> 16) == iv_1) {
            printf("%x\n", i);
        }
    }

    return 0;
}
