Number.prototype.bin = function() {
    return (
        '0'.repeat(32 - (this >>> 0).toString(2).length) +
        (this >>> 0).toString(2)
    ).match(/.{4}/g).join(' ');
};

const A = 0b10110011101110100100011101010111;
const X = A ^ (A >>> 11);

console.log(`A: ${A.bin()}`);
console.log(`X: ${X.bin()}`);

let B = (X >>> (32 - 11)) << (32 - 11);
for(let i = 32 - 11, y = 31; i >= 0; i--, y--) {
    B = ((1 << y) & B) ^ ((1 << i) & X);
    console.log('   ' + (((1 << i) & X) << 10).bin());
    // console.log('   ' + ((1 << y) & B).bin());
}

console.log(`B: ${B.bin()}`);
