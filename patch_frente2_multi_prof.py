#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# patch_frente2_multi_prof.py
# ─────────────────────────────────────────────────────────────────────────────
# Frente 2 — múltiplos profissionais por booking.
# Adiciona o segmented control por item (Opção C, nível Booksy):
#   ↳ Após anterior  (sequencial)  |  ∥ Em paralelo
#
# Decisões travadas:
#   1) paralelo = mesmo início do ITEM ANTERIOR (idx-1)
#   2) ao virar paralelo, auto-seleciona o PRÓXIMO PROFISSIONAL LIVRE no horário
#   3) tempos armazenados + cascata: editar um item re-snapeia os itens 'after'
#      seguintes (1º item nunca é derivado)
#
# Alvo: src/features/booking/components/SideCheckoutPanel.tsx
# (NÃO toca backend nem AgendaGrid — ambos já suportam groupId + ghost por profId)
#
# Uso (na raiz do front-end):
#   python3 patch_frente2_multi_prof.py [caminho_opcional_do_arquivo]
#
# Segurança:
#   - Confere cada âncora (imprime True/False por edição).
#   - Se QUALQUER âncora não bater EXATAMENTE 1x, NADA é escrito (aborta).
#   - Faz backup em .backup/ antes de gravar.
# ─────────────────────────────────────────────────────────────────────────────

import sys, os, time

DEFAULT_PATH = "src/features/booking/components/SideCheckoutPanel.tsx"

EDITS = [

  # ── 1. ServiceItem: novo campo `mode` ──────────────────────────────────────
  {
    "name": "1. ServiceItem.mode",
    "old": """interface ServiceItem {
  service:   Service
  startTime: string
  endTime:   string
  profId:    string
}""",
    "new": """interface ServiceItem {
  service:   Service
  startTime: string
  endTime:   string
  profId:    string
  mode?:     'after' | 'parallel'   // só relevante para idx >= 1 (1º item não tem âncora)
}""",
  },

  # ── 2. Helpers de cadeia (após getInitials) ────────────────────────────────
  {
    "name": "2. Helpers recomputeFrom / pickFreeProf / toMin",
    "old": """function getInitials(name: string) {
  return name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
}""",
    "new": """function getInitials(name: string) {
  return name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
}

// ─── Helpers de cadeia (Frente 2: paralelo/sequencial) ─────────────────────────
function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

// Re-deriva startTime/endTime a partir de `fromIdx`.
// Itens [0..fromIdx) ficam intactos (valores manuais preservados);
// itens [fromIdx..] têm o start derivado da cadeia conforme o `mode`:
//   'parallel' → mesmo início do item anterior · 'after' → começa no fim do anterior.
// O 1º item (idx 0) nunca é derivado: mantém o start, só recalcula o fim.
function recomputeFrom(items: ServiceItem[], fromIdx: number): ServiceItem[] {
  const out: ServiceItem[] = items.slice(0, Math.max(0, fromIdx)).map(x => ({ ...x }))
  for (let i = Math.max(0, fromIdx); i < items.length; i++) {
    const it = items[i]
    if (i === 0) {
      const endTime = it.service ? addMinutes(it.startTime, it.service.duration) : it.endTime
      out.push({ ...it, endTime })
      continue
    }
    const prev      = out[i - 1]
    const startTime = it.mode === 'parallel'
      ? prev.startTime
      : (prev.endTime || prev.startTime)
    const endTime   = it.service ? addMinutes(startTime, it.service.duration) : startTime
    out.push({ ...it, startTime, endTime })
  }
  return out
}

// Escolhe o 1º profissional que NÃO está ocupado por outro item do painel
// no intervalo [start, end). Usado ao virar um item para 'parallel'.
// Fallback: null (mantém o prof atual) quando todos estão ocupados.
function pickFreeProf(
  items: ServiceItem[], idx: number, start: string, end: string,
  professionals: AgendaProfessional[],
): string | null {
  const s = toMin(start)
  const e = toMin(end || start)
  const used = new Set<string>()
  items.forEach((it, i) => {
    if (i === idx || !it.profId) return
    const is = toMin(it.startTime)
    const ie = toMin(it.endTime || it.startTime)
    if (is < e && ie > s) used.add(it.profId)
  })
  return professionals.find(p => !used.has(p.id))?.id ?? null
}""",
  },

  # ── 3. handleServiceSelect (define mode + cascata) ──────────────────────────
  {
    "name": "3. handleServiceSelect",
    "old": """  function handleServiceSelect(svc: Service) {
    setItems(prev => {
      const next = [...prev]

      if (addingSvcIdx === -1) {
        const last   = next[next.length - 1]
        const startT = (last?.endTime && last.endTime !== '')
          ? last.endTime
          : (last?.startTime || time || '09:00')
        const endT   = addMinutes(startT, svc.duration)
        next.push({
          service:   svc,
          startTime: startT,
          endTime:   endT,
          profId:    next[0]?.profId ?? professionals[0]?.id ?? '',
        })
      } else {
        const idx    = addingSvcIdx
        const startT = idx === 0
          ? (next[0]?.startTime || time || '09:00')
          : (next[idx-1]?.endTime || next[idx-1]?.startTime || '09:00')
        const endT   = addMinutes(startT, svc.duration)
        next[idx] = { ...next[idx], service: svc, startTime: startT, endTime: endT }
      }
      return next
    })
    setAddingSvcIdx(-1)
  }""",
    "new": """  function handleServiceSelect(svc: Service) {
    setItems(prev => {
      const next = prev.map(x => ({ ...x }))
      let changedIdx: number

      if (addingSvcIdx === -1) {
        // Novo item: nasce sequencial ('after') e herda o prof do 1º item.
        // start/fim são derivados logo abaixo pela cadeia (recomputeFrom).
        next.push({
          service:   svc,
          startTime: next[next.length - 1]?.startTime || time || '09:00',
          endTime:   '',
          profId:    next[0]?.profId ?? professionals[0]?.id ?? '',
          mode:      'after',
        })
        changedIdx = next.length - 1
      } else {
        // Edição do serviço de um item existente: troca o serviço e deixa
        // a cadeia recalcular os tempos (a duração pode ter mudado).
        changedIdx = addingSvcIdx
        next[changedIdx] = { ...next[changedIdx], service: svc }
      }

      return recomputeFrom(next, changedIdx)
    })
    setAddingSvcIdx(-1)
  }""",
  },

  # ── 4. updateItemTime (cascata nos itens seguintes) ─────────────────────────
  {
    "name": "4. updateItemTime (cascata)",
    "old": """  function updateItemTime(idx: number, field: 'startTime'|'endTime', val: string) {
    setItems(prev => {
      const next = [...prev]
      next[idx]  = { ...next[idx], [field]: val }
      if (field === 'startTime' && next[idx].service) {
        next[idx].endTime = addMinutes(val, next[idx].service.duration)
      }
      return next
    })
  }""",
    "new": """  function updateItemTime(idx: number, field: 'startTime'|'endTime', val: string) {
    setItems(prev => {
      const next = prev.map(x => ({ ...x }))
      next[idx]  = { ...next[idx], [field]: val }
      if (field === 'startTime' && next[idx].service) {
        next[idx].endTime = addMinutes(val, next[idx].service.duration)
      }
      // Ajuste manual é "rei" para ESTE item; os itens seguintes (após idx)
      // re-snapeiam conforme seus modos.
      return recomputeFrom(next, idx + 1)
    })
  }""",
  },

  # ── 5. removeItem (cascata após remover) ────────────────────────────────────
  {
    "name": "5. removeItem (cascata)",
    "old": """  function removeItem(idx: number) {
    setItems(prev => prev.filter((_,i) => i !== idx))
  }""",
    "new": """  function removeItem(idx: number) {
    setItems(prev => recomputeFrom(prev.filter((_,i) => i !== idx), idx))
  }""",
  },

  # ── 6. setItemMode (antes do bloco SAVE) ────────────────────────────────────
  {
    "name": "6. setItemMode",
    "old": """  // ── SAVE ──────────────────────────────────────────────────────────────────
  async function handleSave(allowOverlap = false) {""",
    "new": """  // ── Alterna modo do item (Frente 2): sequencial ⇄ paralelo ────────────────
  function setItemMode(idx: number, mode: 'after' | 'parallel') {
    if (idx < 1) return  // 1º item não tem âncora
    setItems(prev => {
      const next = prev.map(x => ({ ...x }))
      next[idx]  = { ...next[idx], mode }
      // Re-deriva o start deste item (e cascateia para os seguintes).
      const recomputed = recomputeFrom(next, idx)
      // Ao virar paralelo, puxa o próximo profissional livre nesse horário —
      // senão o paralelo com o mesmo prof nasceria em conflito.
      if (mode === 'parallel') {
        const it   = recomputed[idx]
        const free = pickFreeProf(recomputed, idx, it.startTime, it.endTime, professionals)
        if (free) recomputed[idx] = { ...recomputed[idx], profId: free }
      }
      return recomputed
    })
  }

  // ── SAVE ──────────────────────────────────────────────────────────────────
  async function handleSave(allowOverlap = false) {""",
  },

  # ── 7. CSS do segmented control ─────────────────────────────────────────────
  {
    "name": "7. CSS .cp-seg-btn",
    "old": """        .add-svc-btn:hover{background:${colors.red.subtle};border-color:${colors.red.DEFAULT}}
      `}</style>""",
    "new": """        .add-svc-btn:hover{background:${colors.red.subtle};border-color:${colors.red.DEFAULT}}
        .cp-seg-btn{flex:1;padding:8px 6px;border-radius:9px;border:1px solid ${colors.gray.borderMd};background:${colors.background.page};font-size:12px;font-weight:600;cursor:pointer;color:${colors.gray[700]};transition:all ${transitions.fast};font-family:${typography.fontFamily};white-space:nowrap;display:flex;align-items:center;justify-content:center;gap:4px}
        .cp-seg-btn.sel{background:${colors.red.gradient};color:#fff;border-color:transparent;box-shadow:0 2px 8px ${colors.red.glow}}
      `}</style>""",
  },

  # ── 8. UI do segmented control (entre header e botão de serviço) ────────────
  {
    "name": "8. UI segmented control no card",
    "old": """                        {idx>0&&<button onClick={()=>removeItem(idx)} style={{background:'none',border:'none',cursor:'pointer',padding:2,display:'flex'}}><Trash2 size={14} color={colors.gray.dimText}/></button>}
                      </div>

                      <button className={`cp-svc${item.service?' has-value':''}`} style={{borderRadius:0,border:'none',borderBottom:`1px solid ${colors.gray.border}`}} onClick={()=>{setAddingSvcIdx(idx);setShowSvcSheet(true)}}>""",
    "new": """                        {idx>0&&<button onClick={()=>removeItem(idx)} style={{background:'none',border:'none',cursor:'pointer',padding:2,display:'flex'}}><Trash2 size={14} color={colors.gray.dimText}/></button>}
                      </div>

                      {/* Frente 2: relação temporal com o item anterior (só do 2º item em diante) */}
                      {idx > 0 && (
                        <div style={{display:'flex',gap:6,padding:'10px 14px',borderBottom:`1px solid ${colors.gray.border}`}}>
                          <button className={`cp-seg-btn${(item.mode ?? 'after')==='after'?' sel':''}`} onClick={()=>setItemMode(idx,'after')}>↳ Após anterior</button>
                          <button className={`cp-seg-btn${item.mode==='parallel'?' sel':''}`} onClick={()=>setItemMode(idx,'parallel')}>∥ Em paralelo</button>
                        </div>
                      )}

                      <button className={`cp-svc${item.service?' has-value':''}`} style={{borderRadius:0,border:'none',borderBottom:`1px solid ${colors.gray.border}`}} onClick={()=>{setAddingSvcIdx(idx);setShowSvcSheet(true)}}>""",
  },

]


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_PATH

    if not os.path.isfile(path):
        print(f"[ERRO] Arquivo não encontrado: {path}")
        print("       Rode na raiz do front-end ou passe o caminho como argumento.")
        sys.exit(1)

    with open(path, encoding="utf-8") as f:
        content = f.read()

    print(f"Alvo: {path}\n")
    print("Conferindo âncoras (cada uma deve aparecer exatamente 1x):\n")

    all_ok = True
    for e in EDITS:
        n = content.count(e["old"])
        ok = (n == 1)
        status = "OK  " if ok else "FALHA"
        print(f"  [{status}] {e['name']:42s} -> {ok}  (ocorrências: {n})")
        if not ok:
            all_ok = False

    if not all_ok:
        print("\n>>> ABORTADO: alguma âncora não bateu exatamente 1x. NADA foi escrito.")
        print("    Me mande a saída acima e eu ajusto a âncora.")
        sys.exit(2)

    new_content = content
    for e in EDITS:
        new_content = new_content.replace(e["old"], e["new"], 1)

    os.makedirs(".backup", exist_ok=True)
    backup = os.path.join(".backup", os.path.basename(path) + "." + str(int(time.time())))
    with open(backup, "w", encoding="utf-8") as f:
        f.write(content)
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"\nTodas as 8 âncoras OK. Backup salvo em: {backup}")
    print("Arquivo atualizado com sucesso.")
    print("\nPróximo passo: npm run lint && npm run build")


if __name__ == "__main__":
    main()
