import { calcAPCA, fontLookupAPCA } from 'apca-w3';
import { readFileSync, writeFileSync } from 'node:fs';

const { colors } = JSON.parse(readFileSync(new URL('../../design/palette-report.json', import.meta.url), 'utf8'));
const definitions = [
  ['Основной текст', 'ink', 'canvas', 18, 400, 90],
  ['Пояснения', 'muted', 'canvas', 18, 400, 75],
  ['Навигация и подписи', 'secondary', 'canvas', 16, 600, 75],
  ['Заголовки', 'secondary', 'canvas', 30, 800, 60],
  ['Акцентный заголовок', 'forest', 'canvas', 40, 800, 60],
  ['Кнопка', 'canvas', 'forest', 16, 700, 75],
  ['Текст тёмного раздела', 'canvas', 'forest', 18, 400, 90],
  ['Подпись маскота', 'ink', 'surface', 16, 600, 75],
  ['Номер шага', 'ink', 'oat', 18, 800, 60],
  ['Недоступный вход', 'secondary', 'oat', 16, 700, 60],
];
const pairs = definitions.map(([name, fg, bg, size, weight, target]) => {
  const lc = calcAPCA(colors[fg], colors[bg]);
  const minimum = Number(fontLookupAPCA(lc)[weight / 100]);
  return { name, foreground: colors[fg], background: colors[bg], size, weight,
    target, lc: Number(lc.toFixed(2)), lookupMinimumPx: minimum,
    pass: Math.abs(lc) >= target && minimum >= 0 && size >= minimum };
});
writeFileSync(new URL('../../design/home-contrast-report.json', import.meta.url), JSON.stringify({ library: 'apca-w3@0.1.9', font: 'Nunito Sans Variable', note: 'Project thresholds and generic font lookup; not font-specific or whole-site certification.', pairs }, null, 2) + '\n');
console.table(pairs);
if (pairs.some(pair => !pair.pass)) process.exitCode = 1;
