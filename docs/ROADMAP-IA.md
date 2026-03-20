# Roadmap — motor de recomendação do Plano10k

## Implementado (neste repo)

1. **Fonte única do catálogo** — `src/data/courses.ts` é a verdade; `npm run sync:courses` copia para `supabase/functions/generate-plan/` (courses + `inferPilar` + `planLimits`). O `prebuild` roda o sync automaticamente.
2. **Pilar inferido** — `src/lib/inferPilar.ts` classifica trilhas (comercial, técnico, copy, operação, outro) para o prompt e futuros filtros.
3. **Limites por disponibilidade** — `src/lib/planLimits.ts` define faixas de aulas/semana e impls/semana conforme `horasDisponiveis` (q28).
4. **Respostas do quiz no prompt** — `formatAnswersSummary` envia texto legível; a Edge Function usa em `buildPrompt`.
5. **Política editorial** — meta R$10k, comercial como eixo, fundação quando necessário, ações comerciais recorrentes (ver `supabase/functions/generate-plan/prompt.ts`).
6. **Desequilíbrio técnico vs comercial** — diretriz extra quando `tecnico - comercial >= 22` (ou o inverso).
7. **Validação pós-JSON** — links ∈ catálogo; total de aulas 35–72; **uma retentativa** com temperatura menor se falhar.

## Próximos passos sugeridos

- Tabela `courses` no Supabase + seed a partir do TS (edição sem redeploy do array).
- Pré-filtro do catálogo por pilar antes do Gemini (menos tokens, mais aderência).
- Telemetria (hash do prompt, tempo, erros de validação).
- Feedback na UI (“semana útil?”).
