// Modules.
const request = require('request-promise-native').defaults({
    jar: true,
    json: true
});

// Return a binary (zero padded) representation of a 32 bits number.
Number.prototype.bin = function() {
   return (
       '0'.repeat(32 - (this >>> 0).toString(2).length) +
       (this >>> 0).toString(2)
   );
};

// Mersenne Twister masks.
const bitmask_1 = (2 ** 32) - 1;
const bitmask_2 = 2 ** 31;
const bitmask_3 = (2 ** 31) - 1;

// JavaScript version of the random.py script.
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

// Reverse an equation of the 'y ^= y >>> k' type.
function reverseRightShiftXor(number, shift) {
    // Copy first unchanged bits.
    let reversed = (number >>> (32 - shift)) << (32 - shift);
    // Reverse mask + shift of the following bits.
    for(let i = shift + 1, j = 1; i <= 32; i++, j++) {
        reversed |= ((1 << 32 - i) & number) ^ (((1 << 32 - j) & reversed) >>> shift);
    }
    return reversed;
}

// Reverse an equation of the 'y ^= (y << k) & x' type.
function unBitshiftLeftXor(value, shift, mask) {
    let i = 0;
    let result = 0;
    while (i * shift < 32) {
        const partMask = (-1 >>> (32 - shift)) << (shift * i);
        const part = value & partMask;
        value ^= (part << shift) & mask;
        result |= part;
        i++;
    }
    return result;
}

// Reverse MT _f function.
function reverseF(value) {
    value = reverseRightShiftXor(value, 18);
    value = unBitshiftLeftXor(value, 15, 4022730752);
    value = unBitshiftLeftXor(value, 7, 2636928640);
    value = reverseRightShiftXor(value, 11);
    return value;
}

async function cryptedMessage() {
    // Open session.
    await request.post({
        url: 'http://pac.fil.cool/uglix/bin/login',
        body: {
            user: 'failsafe',
            password: 'I_hope_you_never_logon_to_this'
        }
    });

    // Fetch message as buffer.
    return request.get({
        url: 'http://pac.fil.cool/uglix/home/failsafe/I_hope_you_never_read_this.bin',
        encoding: null
    });
}

function decrypt(crypted) {
    // Rebuild MT from the first 2 496 space characters.
    const seed = Array(624).fill(0);
    for(let i = 0; i < 624; i++) {
        seed[i] |= (crypted[i * 4 + 0] ^ 32) << 0;
        seed[i] |= (crypted[i * 4 + 1] ^ 32) << 8;
        seed[i] |= (crypted[i * 4 + 2] ^ 32) << 16;
        seed[i] |= (crypted[i * 4 + 3] ^ 32) << 24;
        seed[i] = reverseF(seed[i]);
    }

    // Set seed.
    const mt = new MersenneTwister();
    mt.setState(seed);

    // Alloc a buffer for the decrypted message.
    const decrypted = Buffer.allocUnsafe(crypted.length - 624 * 4);

    // Rebuild the message using the same instance of MT (same seed).
    let mask;
    for(let i = 624 * 4, j = 0; i < crypted.length; i++, j++) {
        // Get a new set of 32 random bits if needed.
        if(i % 4 === 0) {
            mask = mt.rand();
        }

        // Xor a byte of message with the corresponding random byte.
        decrypted[j] = crypted[i] ^ ((mask >> (8 * (i % 4))) & 0xFF);
    }

    // Encode to UTF-8, trim and return the message.
    return decrypted.toString('utf8').trim();
}

// Main.
cryptedMessage()
.then(message => console.log(decrypt(message)))
.catch(error => console.error(error.message));
