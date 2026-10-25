import test from 'node:test';
import assert from 'node:assert/strict';
import { annualRateFromPercent, validateDecision, previewDecision } from './model.ts';
const draft = { outcome: 'offer', principal: '1200000.00', termMonths: '24', ratePercent: '26', reason: 'Тестовое обоснование условий.' };
test('converts percentage to a decimal rate exactly and rejects ambiguous values', () => {
  assert.equal(annualRateFromPercent('26,50'), '0.265');
  assert.equal(annualRateFromPercent('0'), '0');
  assert.equal(annualRateFromPercent('100'), '1');
  for (const value of ['-1', '100.01', '1e2', '26%', '', 'NaN', '26.123']) assert.equal(annualRateFromPercent(value), null);
});
test('uses the same illustrative annuity result as the client offer', () => {
  assert.deepEqual(validateDecision(draft), {});
  assert.deepEqual(previewDecision(draft), { monthlyPayment: '64649.48', totalRepayment: '1551587.52', totalInterest: '351587.52' });
  assert.deepEqual(previewDecision({ ...draft, outcome: 'approve', principal: '1200', termMonths: '12', ratePercent: '0' }), { monthlyPayment: '100.00', totalRepayment: '1200.00', totalInterest: '0.00' });
});
test('rejects invalid terms and never presents a zero or negative-interest quote', () => {
  for (const patch of [{ principal: '0' }, { termMonths: '0' }, { termMonths: '24.5' }, { termMonths: '601' }, { ratePercent: '101' }, { reason: ' ' }, { reason: 'x'.repeat(1001) }, { outcome: 'unknown' }]) {
    assert.ok(Object.keys(validateDecision({ ...draft, ...patch })).length);
    assert.equal(previewDecision({ ...draft, ...patch }), null);
  }
  assert.equal(previewDecision({ ...draft, principal: '0.01', termMonths: '600', ratePercent: '0' }), null);
});
test('decline requires a reason without validating hidden offer fields or modifying the draft', () => {
  const declined = { ...draft, outcome: 'decline', principal: '', termMonths: '', ratePercent: '' };
  const before = { ...declined };
  assert.deepEqual(validateDecision(declined), {});
  assert.equal(previewDecision(declined), null);
  assert.ok(validateDecision({ ...declined, reason: '' }).reason);
  assert.deepEqual(declined, before);
});
