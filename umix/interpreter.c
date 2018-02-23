#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>

#define C (w & 7)
#define B (w >> 3) & 7
#define A (w >> 6) & 7

typedef unsigned int uint;

#define MAX_ARRAY 10000000
uint **ARRAY;
uint *ARRAY_SIZE;
uint first;
uint *NEXT;


uint ulloc(uint size)
{
	int k = first;
	first = NEXT[first];
	ARRAY[k] = calloc(size, 4);
	ARRAY_SIZE[k] = size;
	return k;
}


void ufree(uint idx)
{
	free(ARRAY[idx]);
	ARRAY[idx] = NULL;
	NEXT[idx] = first;
	first = idx;
}

int main(int argc, char **argv)
{
	ARRAY = calloc(MAX_ARRAY, sizeof(uint *));
	ARRAY_SIZE = calloc(MAX_ARRAY, sizeof(uint));
	NEXT = calloc(MAX_ARRAY, sizeof(uint));
	for (int i = 0; i < MAX_ARRAY - 1; i++)
		NEXT[i] = i + 1;

	/* load code */
	FILE *f = fopen(argv[1], "rb");
	if (!f)
		return -1;

	struct stat buf;
	if (stat(argv[1], &buf))
		return -1;
	assert(0 == ulloc(buf.st_size >> 2));

	int a, n = 4, i = 0;
	while (EOF != (a = fgetc(f))) {
		if (!n--) {
			i++;
			n = 3;
		}
		ARRAY[0][i] = (ARRAY[0][i] << 8) | a;
	}
	fclose(f);

	/* spin cycle */
	uint reg[8] = {0, 0, 0, 0, 0, 0, 0, 0};
	uint ip = 0;
	for (;;) {
		uint w = ARRAY[0][ip++];

		switch (w >> 28) {
		case 0:
			if (reg[C])
				reg[A] = reg[B];
			break;
		case 1:
			reg[A] = ARRAY[reg[B]][reg[C]];
			break;
		case 2:
			ARRAY[reg[A]][reg[B]] = reg[C];
			break;
		case 3:
			reg[A] = reg[B] + reg[C];
			break;
		case 4:
			reg[A] = reg[B] * reg[C];
			break;
		case 5:
			reg[A] = reg[B] / reg[C];
			break;
		case 6:
			reg[A] = ~(reg[B] & reg[C]);
			break;
		case 7:
			return 0;
		case 8:
			reg[B] = ulloc(reg[C]);
			break;
		case 9:
			ufree(reg[C]);
			break;
		case 10:
			putchar(reg[C]);
                        fflush(stdout);
			break;
		case 11:
			reg[C] = getchar();
			break;
		case 12:
			if (reg[B]) {
				int size = ARRAY_SIZE[reg[B]];
				ufree(0);
				assert(0 == ulloc(size));
				memcpy(ARRAY[0], ARRAY[reg[B]], size * 4);
			}
			ip = reg[C];
			break;
		case 13:
			reg[7 & (w >> 25)] = w & 0177777777;
		}
	}
}
