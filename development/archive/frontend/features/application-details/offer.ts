import { calculatePreview } from '../../../../../src/features/product/model.ts';

/** Fixed synthetic proposal. Browser quote is illustrative, never a bank offer. */
const principal = '1200000.00';
const termMonths = 24;
const annualRate = '0.26';
export const demoOffer = {
  id: 'demo-offer-1', contractVersion: 'demo-v1', principal, termMonths, annualRate,
  preview: calculatePreview(principal, termMonths, annualRate),
} as const;
