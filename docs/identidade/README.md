# Identidade Visual Eligi

Fonte oficial: **Eligi Pack Oficial de Identidade Visual v1.0** (28 paginas).
O PDF fica em `docs/identidade/Eligi_Pack_Identidade_Visual_v1_0.pdf`.

## O que e lei

| Camada | Arquivo | Regra |
|---|---|---|
| Token | `src/shared/brand.tokens.json` | fonte canonica, editada a mao |
| Token gerado | `src/shared/brand.generated.ts` | **nunca** editado a mao, sai de `npm run brand` |
| Tema do produto | `src/shared/theme.ts` | consome os tokens, nao redefine cor de marca |

`npm run brand:check` roda no portao estatico. Arquivo gerado fora de sincronia derruba o build.

## As tres decisoes que o pack nao fechou sozinho

1. **A interface do produto e CLARA.** O preto profundo do pack vale para marca, landing,
   auth, Brain, documentos e pecas. A pagina 22 do pack precisa de emenda no v1.1.
2. **Vermelho com funcao dupla.** `#FE0000` na marca, no simbolo e sobre fundo escuro.
   `#dc2626` em interface clara e texto pequeno - `#FE0000` sobre branco da 4,03 e reprova AA.
3. **Token antes de documento.** Recibo em PDF, NFS-e, e-mail e papel timbrado entram
   depois dos tokens, para nao serem refeitos duas vezes.

## Limite conhecido

Sem monorepo, `brand.tokens.json` e **copiado** entre `front-end`, `front-end-public`,
`eligi-brain` e `back-end`. Mexeu em um, roda o gerador e sobe os quatro.
O check garante que ninguem edita o `.ts` na mao - nao garante sincronia entre repos.
Eliminar a copia exige pacote npm privado ou workspace: divida declarada.
