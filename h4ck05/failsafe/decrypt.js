const fs = require('fs');

const bitmask_1 = (2 ** 32) - 1
const bitmask_2 = 2 ** 31
const bitmask_3 = (2 ** 31) - 1

Number.prototype.bin = function() {
   return (
       '0'.repeat(32 - (this >>> 0).toString(2).length) +
       (this >>> 0).toString(2)
   );
};

class MersenneTwister {
    constructor() {
        this.MT = Array(624).fill(0).map((e, i) => i +1);
        this.index = 0;
    }

    rand() {
        if(this.index === 624) {
            this.generateNumbers();
        }

        const x = this.MT[this.index];
        this.index++;

        return this.f(x);
    }

    seed(value) {
        this.MT[0] = value;
        for(let i = 1; i < 624; i++) {
            this.MT[i] = ((1812433253 * this.MT[i-1]) ^ ((this.MT[i-1] >>> 30) + i)) & bitmask_1;
        }
        this.index = 624;
    }

    setState(state) {
        this.MT = state;
        this.index = 624;
    }

    generateNumbers() {
        for(let i = 0; i < 624; i++) {
            const y = (this.MT[i] & bitmask_2) + (this.MT[(i + 1 ) % 624] & bitmask_3);
            this.MT[i] = this.MT[(i + 397) % 624] ^ (y >>> 1);
            if(y % 2 !== 0) {
                this.MT[i] ^= 2567483615;
            }
        }
        this.index = 0;
    }

    f(y) {
        y ^= y >>> 11;
        y ^= (y << 7) & 2636928640;
        y ^= (y << 15) & 4022730752;
        y ^= y >>> 18;
        return y;
    }
}

function reverseRightShiftXor(number, shift) {
    let reversed = (number >>> (32 - shift)) << (32 - shift);
    for(let i = shift + 1, j = 1; i <= 32; i++, j++) {
        reversed |= ((1 << 32 - i) & number) ^ (((1 << 32 - j) & reversed) >>> shift);
    }
    return reversed;
}

function unBitshiftLeftXor(value, shift, mask) {
  let i = 0;
  let result = 0;
  while (i * shift < 32) {
    let partMask = (-1 >>> (32 - shift)) << (shift * i);
    let part = value & partMask;
    value ^= (part << shift) & mask;
    result |= part;
    i++;
  }
  return result;
}

function reverseF(value) {
    value = reverseRightShiftXor(value, 18);
    value = unBitshiftLeftXor(value, 15, 4022730752);
    value = unBitshiftLeftXor(value, 7, 2636928640);
    value = reverseRightShiftXor(value, 11);
    return value;
}

const crypted = fs.readFileSync('I_hope_you_never_read_this.bin');

const seeds = Array(624).fill(0);
for(let i = 0; i < 624; i++) {
    seeds[i] |= (crypted[i * 4 + 0] ^ 32) << 0;
    seeds[i] |= (crypted[i * 4 + 1] ^ 32) << 8;
    seeds[i] |= (crypted[i * 4 + 2] ^ 32) << 16;
    seeds[i] |= (crypted[i * 4 + 3] ^ 32) << 24;
    seeds[i] = reverseF(seeds[i]);
}

const mt = new MersenneTwister();
mt.setState(seeds);

const decrypted = Buffer.allocUnsafe(crypted.length - 624 * 4);

let mask;
for(let i = 624 * 4, j = 0; i < crypted.length; i++, j++) {
    if(i % 4 === 0) {
        mask = mt.rand();
    }

    const maskByte = (mask >> (8 * (i % 4))) & 0xFF;
    decrypted[j] = crypted[i] ^ maskByte;
    // console.log(crypted[i] ^ maskByte);
}
console.log(decrypted.toString('utf8').trim());
