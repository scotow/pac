#include <stdint.h>
#include "drand48.h"

uint64_t rand48_state;

void my_srand48(uint32_t seed) {
  rand48_state = 0x330e + (seed << 16);
}

uint32_t my_mrand48() {
  rand48_state = (0x00000005deece66d * rand48_state + 11) & 0x0000ffffffffffff;
  return (rand48_state >> 16);
}
