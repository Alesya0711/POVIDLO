import { calcAPCA, fontLookupAPCA } from 'apca-w3';
import { writeFileSync } from 'node:fs';

export const colors = {
  canvas: '#FAF7F0', surface: '#FFFFFF', oat: '#EEE7DB',
  ink: '#302820', secondary: '#574C41', muted: '#62564A',
  forest: '#354B3A', sage: '#DFE6D8', caramel: '#D5A06A',
  caramelSoft: '#EAC9A2', honey: '#F2D8A7', warning: '#684410', error: '#81382F',
  errorSurface: '#F9E8E1',
};
const definitions = [
  ['Основной текст', 'ink', 'canvas', 16, 400, 90],
  ['Текст на белом', 'ink', 'surface', 16, 400, 90],
  ['Подписи', 'secondary', 'canvas', 16, 500, 75],
  ['Вторичный текст', 'muted', 'canvas', 18, 400, 75],
  ['Основная кнопка', 'canvas', 'forest', 16, 700, 75],
  ['Успешный статус', 'forest', 'sage', 16, 600, 75],
  ['Карамельный акцент', 'ink', 'caramelSoft', 18, 700, 60],
  ['Предупреждение', 'warning', 'honey', 18, 600, 60],
  ['Ошибка', 'error', 'errorSurface', 16, 600, 75],
];
const pairs = definitions.map(([name, fg, bg, size, weight, target]) => {
  const lc = calcAPCA(colors[fg], colors[bg]);
  const minimum = Number(fontLookupAPCA(lc)[weight / 100]);
  const pass = Math.abs(lc) >= target && minimum >= 0 && size >= minimum;
  return { name, fg: colors[fg], bg: colors[bg], size, weight, target,
    lc: Number(lc.toFixed(2)), lookupMinimumPx: minimum, pass };
});
const report = { library: 'apca-w3@0.1.9', algorithm: '0.0.98G-4g',
  note: 'APCA draft guidance; signed Lc preserves text/background polarity. Font lookup is guidance, not a font-specific certification.', colors, pairs };
writeFileSync(new URL('../../design/palette-report.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.table(pairs);
if (pairs.some(pair => !pair.pass)) process.exitCode = 1;
