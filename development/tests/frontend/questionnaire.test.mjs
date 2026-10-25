import assert from 'node:assert/strict';
import test from 'node:test';
import { emptyAnswers, isAnswers, loadDraft, normalizeMoney, toRequest, validateStep } from '../../../src/features/questionnaire/model.ts';

const valid = { industry: 'trade', industryDescription: '', legalForm: 'ip', businessAgeMonths: '24', purpose: 'working_capital', principal: '1 250 000,50', termMonths: '24' };
test('route snapshots reject missing and malformed fields before preparing a request', () => {
  assert.equal(isAnswers(valid), true);
  for (const value of [null, [], {}, { ...valid, principal: 1000 }, { ...valid, industryDescription: 'x'.repeat(201) }]) assert.equal(isAnswers(value), false);
  const unsupported = { ...valid, purpose: 'unknown' };
  assert.equal(isAnswers(unsupported), true);
  assert.equal(toRequest(unsupported), null);
});
function restore(raw, throws = false) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem() { if (throws) throw new Error('Storage blocked'); return raw; } } });
  try { return loadDraft(); }
  finally { if (previous) Object.defineProperty(globalThis, 'localStorage', previous); else delete globalThis.localStorage; }
}

test('money accepts spaced rubles and exact kopecks without rounding the request', () => {
  assert.equal(normalizeMoney('1\u202f250\u00a0000,50'), '1250000.50');
  assert.equal(normalizeMoney('0,01'), '0.01');
  assert.equal(normalizeMoney('999999999999.99'), '999999999999.99');
  for (const value of ['0', '0.00', '-10', '1e6', '1,2,3', '12.345', 'NaN', '1000000000000']) assert.equal(normalizeMoney(value), null, value);
});
test('numeric fields reject fractional, negative and out-of-range months', () => {
  for (const value of ['0', '-1', '12.5', '1e2', '601']) assert.ok(validateStep(5, { ...valid, termMonths: value }));
  for (const value of ['1', '24', '600']) assert.equal(validateStep(5, { ...valid, termMonths: value }), null);
  assert.equal(validateStep(2, { ...valid, businessAgeMonths: '0' }), null);
  assert.ok(validateStep(2, { ...valid, businessAgeMonths: '1201' }));
});
test('unsupported legal forms and empty custom descriptions cannot complete the questionnaire', () => {
  assert.equal(toRequest({ ...valid, legalForm: 'self_employed' }), null);
  assert.equal(toRequest({ ...valid, industry: 'other', industryDescription: '   ' }), null);
  const custom = toRequest({ ...valid, industry: 'other', industryDescription: '  Студия керамики  ' });
  assert.equal(custom.industry, 'other');
  assert.equal(custom.industryDescription, 'Студия керамики');
  assert.equal(toRequest({ ...valid, industry: 'other', industryDescription: 'x'.repeat(201) }), null);
  assert.deepEqual(toRequest(valid), { industry: 'trade', legalForm: 'ip', businessAgeMonths: 24, purpose: 'working_capital', principal: '1250000.50', termMonths: 24 });
});
test('valid completed draft restores the summary; incomplete draft returns to missing field', () => {
  assert.equal(restore(JSON.stringify({ version: 1, step: 6, answers: valid })).draft.step, 6);
  const restored = restore(JSON.stringify({ version: 1, step: 6, answers: { ...valid, legalForm: '' } })).draft;
  assert.equal(restored.step, 1);
  assert.equal(restored.answers.principal, valid.principal);
});
test('corrupt, unknown and inaccessible storage fall back without crashing', () => {
  for (const value of ['null', '{broken', JSON.stringify({ version: 2, step: 6, answers: valid }), JSON.stringify({ version: 1, step: 99, answers: valid }), JSON.stringify({ version: 1, step: 0, answers: { ...valid, principal: 500 } })]) {
    const restored = restore(value);
    assert.deepEqual(restored.draft.answers, emptyAnswers);
    assert.ok(restored.notice);
  }
  assert.ok(restore(null, true).notice);
  assert.equal(restore(null).notice, '');
  assert.equal(restore(JSON.stringify({ version: 1, step: 0, answers: emptyAnswers })).notice, '');
});
