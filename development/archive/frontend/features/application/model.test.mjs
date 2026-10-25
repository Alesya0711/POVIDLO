import test from 'node:test';
import assert from 'node:assert/strict';
import { validateApplication } from './model.ts';
import { findDemoProduct } from '../recommendations/fixtures.ts';
const product = findDemoProduct('demo-equipment-1');
const valid = { company: 'Тестовая мастерская', legalForm: 'ip', email: 'demo@example.ru', purpose: 'equipment', principal: '1 250 000,50', termMonths: '24', comment: '' };
test('accepts optional empty comment and formatted money without altering input', () => {
  const before = { ...valid };
  assert.deepEqual(validateApplication(valid, product), {});
  assert.deepEqual(valid, before);
});
test('rejects missing identity fields and product-incompatible selections', () => {
  const errors = validateApplication({ ...valid, company: ' ', email: 'wrong', legalForm: 'unsupported', purpose: 'growth' }, product);
  for (const field of ['company', 'email', 'legalForm', 'purpose']) assert.ok(errors[field]);
});
test('blocks out-of-range or malformed financing parameters and long text', () => {
  for (const patch of [{ principal: '0' }, { principal: '5000000.01' }, { termMonths: '24.5' }, { termMonths: '37' }, { company: 'x'.repeat(151) }, { comment: 'x'.repeat(501) }]) assert.ok(Object.keys(validateApplication({ ...valid, ...patch }, product)).length);
  assert.deepEqual(validateApplication({ ...valid, principal: product.maximumPrincipal, termMonths: String(product.maximumTermMonths), comment: 'x'.repeat(500) }, product), {});
});
