 Number.prototype.bin = function() {
    return (
        '0'.repeat(32 - (this >>> 0).toString(2).length) +
        (this >>> 0).toString(2)
    ).match(/.{4}/g).join(' ');
};

const A = 0b10110011101010100100011101010111;
const X = A ^ (A >>> 11);

console.log(`A:  ${A.bin()}`);
console.log(`X:  ${X.bin()}`);

let B = (X >>> (32 - 11)) << (32 - 11);
//for(let i = 32 - 11 - 1, y = 31; i >= 0; i--, y--) {
for(let i = 12, j = 1; i <= 32; i++, j++) {
    B = B | (((1 << 32 - i) & X) ^ (((1 << 32 - j) & B) >>> 11));
    //B = B | (((1 << 32 - i) & X) ^ (((1 << j) & X) >>> 11));
    // B = ((1 << y) & B) ^ ((1 << i) & X);
    // console.log('   ' + (((1 << i) & X)).bin());
    // console.log('   ' + ((1 << y) & B).bin());
}
let i = 12;
let j = 1;
// B = B | (((1 << 32 - i) & X) ^ (((1 << 32 - j) & X) >>> 11));
// B = B | (((1 << 32 - 12 - 0) & X) ^ (((1 << 31) & X) >>> 11));
// B = B | (((1 << 32 - 12 - 1) & X) ^ (((1 << 31 - 1) & X) >>> 12));
// B = B | (((1 << 32 - 13 - 1) & X) ^ (((1 << 31 - 2) & X) >>> 13));

// 12
console.log('X12:' + ((1 << 32 - 12 - 3) & X).bin());
// 1
console.log('X1: ' + (((1 << 31) & X) >>> 11).bin());
// B = ((1 << 31) & B) ^ ((1 << 11) & X);

console.log(`B:  ${B.bin()}`);


console.log(reverseRightShiftXor(A ^ (A >>> 18), 18).bin());

function reverseRightShiftXor(number, shift) {
    let reversed = (number >>> (32 - shift)) << (32 - shift);
    for(let i = shift + 1, j = 1; i <= 32; i++, j++) {
        reversed |= ((1 << 32 - i) & number) ^ (((1 << 32 - j) & reversed) >>> shift);
    }
    return reversed;
}

function reverseLeftShiftAndXor(number, shift, mask) {
    let reversed = (number << (32 - shift)) >>> (32 - shift);
    for(let i = shift + 1, j = 1; i <= 32; i++, j++) {
        reversed |= ((1 >>> 32 - i) & number) ^ (((1 >>> 32 - j) & reversed) << shift);
    }
    return reversed;
}

function unBitshiftLeftXor(value, shift, mask) {
  // we part of the value we are up to (with a width of shift bits)
  let i = 0;
  // we accumulate the result here
  let result = 0;
  // iterate until we've done the full 32 bits
  while (i * shift < 32) {
    // create a mask for this part
    let partMask = (-1 >>> (32 - shift)) << (shift * i);
    // obtain the part
    let part = value & partMask;
    // unapply the xor from the next part of the integer
    value ^= (part << shift) & mask;
    // add the part to the result
    result |= part;
    i++;
  }
  return result;
}

// console.log(2636928640..bin());

const b = 0b10110011101010100100011101010111 | 0;
const bc = b ^ ((b << 7) & 2636928640);
console.log('b : ', b);
console.log('bc: ', unBitshiftLeftXor(bc, 7, 2636928640));


let input = 150999088;
input = reverseRightShiftXor(input, 18);
input = unBitshiftLeftXor(input, 15, 4022730752);
input = unBitshiftLeftXor(input, 7, 2636928640);
input = reverseRightShiftXor(input, 11);
console.log('input: ', input);
