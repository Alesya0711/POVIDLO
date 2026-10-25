import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePreview, loadCalculator, validateCalculator } from '../../../src/features/product/model.ts';
import { findDemoProduct } from '../../archive/frontend/features/recommendations/fixtures.ts';

const product = findDemoProduct('demo-equipment-1');
test('preview agrees with the documented annuity example and comparison fixture', () => {
  assert.deepEqual(calculatePreview('2000000.00', 24, '0.24'), { monthlyPayment: '105742.19', totalRepayment: '2537812.56', totalInterest: '537812.56' });
  assert.deepEqual(calculatePreview('1250000.50', 24, '0.24'), { monthlyPayment: '66088.90', totalRepayment: '1586133.60', totalInterest: '336133.10' });
});
test('zero rate and half-up kopeck rounding use the documented model', () => {
  assert.deepEqual(calculatePreview('1200.00', 12, '0'), { monthlyPayment: '100.00', totalRepayment: '1200.00', totalInterest: '0.00' });
  assert.deepEqual(calculatePreview('1.01', 2, '0'), { monthlyPayment: '0.51', totalRepayment: '1.02', totalInterest: '0.01' });
});
test('longer term reduces monthly payment while increasing total interest', () => {
  const short = calculatePreview('1000000.00', 12, '0.24');
  const long = calculatePreview('1000000.00', 36, '0.24');
  assert.ok(Number(long.monthlyPayment) < Number(short.monthlyPayment));
  assert.ok(Number(long.totalInterest) > Number(short.totalInterest));
});
test('invalid amounts, months and rate never become a zero-payment preview', () => {
  for (const [principal, months, rate] of [['0',24,'0.24'],['-100',24,'0.24'],['1e6',24,'0.24'],['1000000',0,'0.24'],['1000000',12.5,'0.24'],['1000000',24,'-0.2'],['1000000',24,'NaN']]) assert.throws(() => calculatePreview(principal, months, rate), RangeError);
});
test('product boundaries are inclusive and invalid inputs retain field errors', () => {
  for (const values of [{ principal: '100000.00', termMonths: '6' },{ principal: '5000000.00', termMonths: '36' }]) assert.deepEqual(validateCalculator(values, product), { principal: '', termMonths: '' });
  assert.ok(validateCalculator({ principal: '99999.99', termMonths: '24' }, product).principal);
  assert.ok(validateCalculator({ principal: '5000000.01', termMonths: '24' }, product).principal);
  for (const termMonths of ['5','37','24.5','']) assert.ok(validateCalculator({ principal: '1000000', termMonths }, product).termMonths);
});
function withStorage(raw, fallback, baseKey, denied = false) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem() { if (denied) throw new Error('Blocked'); return raw; } } });
  try { return loadCalculator(product.id, fallback, baseKey); }
  finally { if (previous) Object.defineProperty(globalThis, 'sessionStorage', previous); else delete globalThis.sessionStorage; }
}
test('calculator restores edits for the same request but does not override a new quiz request', () => {
  const saved = JSON.stringify({ version: 1, baseKey: '1000000.00:24', principal: '750000', termMonths: '36' });
  const fallback = { principal: '1000000', termMonths: '24' };
  assert.deepEqual(withStorage(saved, fallback, '1000000.00:24').values, { principal: '750000', termMonths: '36' });
  assert.equal(withStorage(saved, fallback, '2000000.00:24').restored, false);
  assert.deepEqual(withStorage(saved, fallback, '2000000.00:24').values, fallback);
});
test('missing, corrupt or blocked calculator storage leaves the calculator usable', () => {
  const fallback = { principal: '1000000', termMonths: '24' };
  assert.deepEqual(withStorage(null, fallback, '1000000.00:24').values, fallback);
  assert.ok(withStorage('{broken', fallback, '1000000.00:24').notice);
  assert.ok(withStorage(null, fallback, '1000000.00:24', true).notice);
  assert.equal(findDemoProduct('unknown-product'), null);
});
