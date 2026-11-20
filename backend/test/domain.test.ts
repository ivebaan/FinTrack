import assert from "node:assert/strict";
import test from "node:test";
import { add, subtract, money } from "../src/domain/money.js";
import { transitionStatus } from "../src/domain/verification.js";
import { maskTin } from "../src/domain/tin.js";

test("PHP money remains decimal-safe and half-up", () => {
  assert.equal(money("1.005"), "1.01");
  assert.equal(add("0.10", "0.20"), "0.30");
  assert.equal(subtract("1.00", "0.10"), "0.90");
});

test("verification approval requires verified email", () => {
  assert.throws(
    () => transitionStatus("MANUAL_REVIEW", "APPROVED", false),
    /EMAIL_VERIFICATION_REQUIRED/
  );
  assert.equal(transitionStatus("MANUAL_REVIEW", "APPROVED", true), "APPROVED");
});

test("TIN is masked in routines", () => {
  assert.equal(maskTin("123456789"), "•••-•••-6789");
});
