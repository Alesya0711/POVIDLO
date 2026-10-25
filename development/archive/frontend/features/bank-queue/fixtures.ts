import { demoApplication } from '../application-details/fixtures';
import type { DetailState } from '../application-details/fixtures';

export interface QueueItem {
  id: string; label: string; company: string; legalForm: string;
  principal: string; termMonths: number; purpose: string; status: DetailState;
}
/** Synthetic staff examples, independent of the application form and user profile. */
export const queueItems: QueueItem[] = [
  { ...demoApplication, status: 'needs_info' },
  { id: 'demo-application-2', label: 'ДЕМО-002', company: 'Тестовый магазин', legalForm: 'ООО', principal: '800000.00', termMonths: 18, purpose: 'Оборотные средства', status: 'received' },
  { id: 'demo-application-3', label: 'ДЕМО-003', company: 'Демо кафе', legalForm: 'ИП', principal: '1000000.00', termMonths: 24, purpose: 'Развитие бизнеса', status: 'review' },
  { id: 'demo-application-4', label: 'ДЕМО-004', company: 'Учебная пекарня', legalForm: 'ООО', principal: '2500000.00', termMonths: 36, purpose: 'Покупка оборудования', status: 'offer' },
  { id: 'demo-application-5', label: 'ДЕМО-005', company: 'Пример сервиса', legalForm: 'ИП', principal: '500000.00', termMonths: 12, purpose: 'Оборотные средства', status: 'approved' },
  { id: 'demo-application-6', label: 'ДЕМО-006', company: 'Демо студия', legalForm: 'ООО', principal: '1200000.00', termMonths: 24, purpose: 'Развитие бизнеса', status: 'declined' },
];
