// @eligi:brand-gen-lintclean
// Gerador dos tokens de marca do Eligi.
//   npm run brand         -> regenera src/shared/brand.generated.ts
//   npm run brand:check   -> falha se o arquivo gerado estiver fora de sincronia
// Fonte canonica: src/shared/brand.tokens.json
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, '..', 'src', 'shared', 'brand.tokens.json');
const OUT = resolve(HERE, '..', 'src', 'shared', 'brand.generated.ts');

/** Remove chaves de documentacao (prefixo _) do objeto emitido em TS. */
function strip(value) {
  if (Array.isArray(value)) return value.map(strip);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (key.startsWith('_')) continue;
      out[key] = strip(val);
    }
    return out;
  }
  return value;
}

function build() {
  if (!existsSync(SRC)) {
    console.error('[brand] fonte ausente: ' + SRC);
    process.exit(1);
  }
  let tokens;
  try {
    tokens = JSON.parse(readFileSync(SRC, 'utf8'));
  } catch (err) {
    console.error('[brand] JSON invalido em brand.tokens.json: ' + err.message);
    process.exit(1);
  }
  const body = JSON.stringify(strip(tokens), null, 2);
  return [
    '// GERADO POR scripts/gen-brand.mjs - NAO EDITAR A MAO',
    '// Fonte: src/shared/brand.tokens.json (Eligi Pack de Identidade Visual v1.0)',
    '// Regenerar: npm run brand',
    '',
    'export const brand = ' + body + ' as const;',
    '',
    'export type BrandTokens = typeof brand;',
    '',
  ].join('\n');
}

const generated = build();
const check = process.argv.includes('--check');

if (check) {
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (current !== generated) {
    console.error('[brand] brand.generated.ts esta fora de sincronia com brand.tokens.json.');
    console.error('[brand] rode: npm run brand');
    process.exit(1);
  }
  console.log('[brand] tokens em sincronia.');
} else {
  writeFileSync(OUT, generated, 'utf8');
  console.log('[brand] brand.generated.ts atualizado.');
}
