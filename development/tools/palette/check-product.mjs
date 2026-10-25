import { calcAPCA, fontLookupAPCA } from 'apca-w3';
import { readFileSync, writeFileSync } from 'node:fs';

const { colors } = JSON.parse(readFileSync(new URL('../../design/palette-report.json', import.meta.url), 'utf8'));
const definitions = [
  ['Заголовок продукта', 'secondary', 'canvas', 36, 800, 60],
  ['Описание', 'muted', 'canvas', 18, 400, 75],
  ['Требования', 'ink', 'canvas', 18, 700, 75],
  ['Текст калькулятора', 'ink', 'surface', 16, 600, 75],
  ['Ввод суммы и срока', 'ink', 'surface', 24, 700, 75],
  ['Результат расчёта', 'forest', 'sage', 28, 800, 60],
  ['Подпись результата', 'forest', 'sage', 16, 600, 75],
  ['Ошибка поля', 'error', 'errorSurface', 16, 600, 75],
  ['Плашка заявки', 'ink', 'oat', 16, 600, 75],
  ['Основное действие', 'canvas', 'forest', 16, 700, 75],
];
const pairs = definitions.map(([name, fg, bg, size, weight, target]) => {
  const lc = calcAPCA(colors[fg], colors[bg]);
  const minimum = Number(fontLookupAPCA(lc)[weight / 100]);
  return { name, foreground: colors[fg], background: colors[bg], size, weight, target, lc: Number(lc.toFixed(2)), lookupMinimumPx: minimum, pass: Math.abs(lc) >= target && minimum >= 0 && size >= minimum };
});
writeFileSync(new URL('../../design/product-contrast-report.json', import.meta.url), JSON.stringify({ library: 'apca-w3@0.1.9', font: 'Nunito Sans Variable', note: 'Project thresholds and generic font lookup; not font-specific or whole-site certification.', pairs }, null, 2) + '\n');
console.table(pairs);
if (pairs.some(pair => !pair.pass)) process.exitCode = 1;
