# Assistente Eligi (orbe) — ARQUIVADO

<!-- @eligi:assistente-arquivado -->

Removido de producao em out/2026 por falta de uso. Este diretorio guarda o
**visual** como referencia para quando o assistente for retomado. Nada aqui
entra no build: os arquivos de `source/` levam a extensao `.txt` de proposito,
para o `tsc`, o ESLint e o Next nao enxergarem.

## Onde esta o codigo completo

Tag git **`archive/assistente-v1`**, criada nos dois repos imediatamente antes da remocao.

```bash
# ver o front como estava
git show archive/assistente-v1:src/features/agenda/components/assistant/orbEngine.ts

# restaurar a pasta inteira no front
git checkout archive/assistente-v1 -- src/features/agenda/components/assistant
```

No `back-end`, a mesma tag guarda `src/modules/assistant/` (rota
`POST /assistant/ask`) e o registro em `src/app.ts`.

## O que tem em `source/` (copia fiel do front)

| Arquivo | Papel |
|---|---|
| `orbEngine.ts` | motor do orbe em Canvas 2D, fora do React; particulas com blending aditivo, estilo "Morph" (globo em espera, reator quando ativo) |
| `OrbCanvas.tsx` | ponte React -> engine; para o `requestAnimationFrame` com o painel fechado |
| `AssistantFab.tsx` | botao flutuante arrastavel com snap nas 2 laterais; posicao em `localStorage` como `{side, yRatio}` (chave `eligi-assistant-fab`) |
| `AssistantSheet.tsx` | painel de vidro fosco que sobe da base, scrim desfocado, halo e ondas |
| `AssistantLauncher.tsx` | monta FAB + sheet via `createPortal(document.body)` para escapar do stacking context da agenda |
| `constants.ts` | z-index (`ASSISTANT_Z`), chave de storage e parametros visuais |
| `useMicLevel.ts` / `useLevelPulse.ts` | nivel do microfone -> vibracao das particulas |
| `useSpeechRecognition.ts` / `useSpeechSynthesis.ts` / `speech.types.ts` | voz (STT/TTS do navegador) |
| `assistant.api.ts` | cliente da rota `POST /assistant/ask` |

## Licoes que valem reaproveitar

- **iOS:** um unico `AudioContext` (singleton) — Safari tem limite e o mic morria
  no 2o uso. `SpeechRecognition.stop()`, nunca `abort()`. TTS precisa de
  `speech.unlock()` dentro do gesto do usuario (toque no mic), senao fica mudo.
- **Escopo:** BASIC_STAFF limitado no `where` do Prisma, nunca em `.filter()`
  depois da query.
- **LLM externo:** so recebia pergunta generica do setor, nunca dado de
  agendamento ou cliente; guarda `citaAlguemDaConta` impedia nome de
  profissional de vazar. Provedor plugavel por `ASSISTANT_LLM_PROVIDER`.
- **Fala:** horario falado por extenso ("oito e meia da manha"), nunca "08:30".
