const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { encryptBuffer, decryptBuffer } = require("../src/utils/cryptoService");

const original = Buffer.from("CONFIDENTIAL: launch codes 12345");

// TEST 1: encrypt karke decrypt karo, original wapas aana chahiye
const enc = encryptBuffer(original);
const dec = decryptBuffer(enc.ciphertext, enc.encKey, enc.encIv, enc.encTag);

console.log("Original  :", original.toString());
console.log("Encrypted :", enc.ciphertext.toString("hex"));
console.log("Decrypted :", dec.toString());
console.log("TEST 1 roundtrip:", dec.equals(original) ? "PASS" : "FAIL");

// TEST 2: same text dobara encrypt karo, output alag hona chahiye
const enc2 = encryptBuffer(original);
console.log(
    "TEST 2 different output each time:",
    enc.ciphertext.equals(enc2.ciphertext) ? "FAIL" : "PASS"
);

// TEST 3: encrypted data ka ek byte badlo, decrypt fail hona chahiye
const tampered = Buffer.from(enc.ciphertext);
tampered[0] = tampered[0] ^ 0xff;

try {
    decryptBuffer(tampered, enc.encKey, enc.encIv, enc.encTag);
    console.log("TEST 3 tamper detection: FAIL (change pakda nahi gaya)");
} catch (err) {
    console.log("TEST 3 tamper detection: PASS (error aaya:", err.message + ")");
}