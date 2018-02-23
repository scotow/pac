#include <stdint.h>
#include <stdio.h>

uint32_t K[4], IV[4];
FILE *output;

int main()
{
	srand48(time(NULL));

	K[0] = mrand48();
	K[1] = mrand48();
	K[2] = mrand48();
	K[3] = mrand48();

	IV[0] = mrand48();
	IV[1] = mrand48();
	IV[2] = mrand48();
	IV[3] = mrand48();

	printf("Randomly generated key : %x-%x-%x-%x\n", K[0], K[1], K[2], K[0])

	ciphertext = aes_128_CBC(plaintext, message_size, K, IV);

	output = fopen("ciphertext.bin", "w");
	fwrite(IV, 16, 1, output);
	fwrite(ciphertext, message_size, 1, output);
	fclose(output);
}
