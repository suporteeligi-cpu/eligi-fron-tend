// src/features/anamnesis/components/AnamnesisModule.tsx
// @eligi:anamnese-front-modulo
// Pagina central das Fichas de anamnese (Fatia 2a): lista de fichas, ver e
// excluir a pedido do cliente, e o estado de modulo desligado.
// Dashboard claro; botao principal grafite, vermelho so em alerta de saude e
// acao destrutiva. Layout por @media (o layout do dashboard ja cuida da navbar).
'use client'

import { ClipboardList, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAnamnesisSettings } from '../hooks/useAnamnesisSettings'
import { canEraseRecords, canSeeContent, canToggleModule } from '../permissions'
import RecordsList from './RecordsList'

export default function AnamnesisModule() {
  const { user, loading: authLoading } = useAuth()
  const settings = useAnamnesisSettings()
  const role = user?.role
  const contentAccess = canSeeContent(role)
  const ready = !authLoading && !settings.loading

  return (
    <div className="an">
      <style>{CSS}</style>

      <header className="an-head">
        <h1 className="an-h1">Fichas de anamnese</h1>
        <p className="an-lead">Pré-atendimento e termo de consentimento dos seus clientes.</p>
      </header>

      {!ready && (
        <div aria-busy="true">
          <div className="an-skel" style={{ height: 46, marginBottom: 12 }} />
          <div className="an-skel" style={{ height: 200 }} />
        </div>
      )}

      {ready && settings.error && (
        <div className="an-state" role="alert">
          <p className="an-state-t">{settings.error}</p>
          <button type="button" className="an-btn-ghost" onClick={settings.retry}>Tentar de novo</button>
        </div>
      )}

      {ready && !settings.error && !settings.enabled && (
        <section className="an-off" aria-label="Fichas de anamnese desligadas">
          <div className="an-off-ic"><ClipboardList size={22} color="#111114" aria-hidden /></div>
          {canToggleModule(role) ? (
            <>
              <h2 className="an-off-t">Ative as fichas de anamnese</h2>
              <p className="an-off-s">
                Antes do atendimento, o cliente responde sobre saúde e alergias e aceita o termo de consentimento.
                Fica tudo guardado na ficha dele.
              </p>
              <ul className="an-off-list">
                <li><Sparkles size={16} aria-hidden /><span>Perguntas prontas por tipo de serviço, que você ajusta.</span></li>
                <li><TriangleAlert size={16} aria-hidden /><span>Alergias e cuidados de saúde aparecem em destaque para quem atende.</span></li>
                <li><ShieldCheck size={16} aria-hidden /><span>Só o dono, o gerente e quem atende o cliente veem as respostas. Cada abertura fica registrada.</span></li>
              </ul>
              {settings.saveError && <p className="an-off-err" role="alert">{settings.saveError}</p>}
              <button type="button" className="an-btn-primary" onClick={settings.activate} disabled={settings.saving}>
                {settings.saving ? 'Ativando…' : 'Ativar fichas de anamnese'}
              </button>
            </>
          ) : (
            <>
              <h2 className="an-off-t">As fichas de anamnese estão desligadas</h2>
              <p className="an-off-s">Peça ao dono do estabelecimento para ativar.</p>
            </>
          )}
        </section>
      )}

      {ready && !settings.error && (
        <RecordsList
          contentAccess={contentAccess}
          canErase={canEraseRecords(role)}
          hideWhenEmpty={!settings.enabled}
        />
      )}
    </div>
  )
}

const CSS = `
.an{max-width:1080px;margin:0 auto;padding:4px 16px 96px;font-family:var(--font-sans);color:#111114}
@media (min-width:720px){.an{padding:8px 24px 64px}}
.an-head{margin-bottom:18px}
.an-h1{font-family:var(--font-display);font-size:28px;font-weight:700;letter-spacing:-.04em;margin:0;color:#111114;line-height:1.1}
.an-lead{margin:6px 0 0;font-size:14.5px;color:#4b4b52}
@media (min-width:720px){.an-h1{font-size:34px}}
.an-skel{border-radius:14px;background:linear-gradient(90deg,#ececf0,#f5f5f7,#ececf0);background-size:200% 100%;animation:an-sh 1.2s linear infinite}
@keyframes an-sh{to{background-position:-200% 0}}
@media (prefers-reduced-motion:reduce){.an-skel{animation:none}}
.an-state{background:#fff;border:1px solid rgba(17,17,20,.07);border-radius:16px;padding:28px 20px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;margin-top:10px}
.an-state-t{margin:0;font-size:15px;font-weight:600;color:#111114}
.an-state-s{margin:0;font-size:13.5px;color:#8a8a93}
.an-btn-ghost{min-height:44px;padding:0 16px;border-radius:12px;border:1px solid rgba(17,17,20,.12);background:#fff;color:#111114;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer}
.an-btn-ghost:hover{background:#f5f5f7}
.an-btn-ghost:disabled{opacity:.6;cursor:not-allowed}
.an-btn-primary{min-height:48px;padding:0 20px;border-radius:12px;border:0;background:#111114;color:#fff;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer}
.an-btn-primary:hover{background:#26262c}
.an-btn-primary:disabled{opacity:.6;cursor:not-allowed}
.an-off{background:#fff;border:1px solid rgba(17,17,20,.07);border-radius:18px;padding:22px 20px;margin-bottom:18px;max-width:640px}
.an-off-ic{width:44px;height:44px;border-radius:12px;background:#f0f0f3;display:grid;place-items:center;margin-bottom:12px}
.an-off-t{font-family:var(--font-display);font-size:22px;font-weight:700;letter-spacing:-.03em;margin:0;color:#111114}
.an-off-s{margin:8px 0 0;font-size:14.5px;line-height:1.5;color:#4b4b52}
.an-off-list{list-style:none;margin:14px 0 18px;padding:0;display:flex;flex-direction:column;gap:10px}
.an-off-list li{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.45;color:#111114}
.an-off-list li svg{flex-shrink:0;margin-top:2px;color:#4b4b52}
.an-off-list li span{color:#111114}
.an-off-err{margin:0 0 12px;font-size:13.5px;color:#a32d2d}
@media (max-width:639px){.an-off .an-btn-primary{width:100%}}

.an-tools{display:flex;flex-direction:column;gap:10px;margin-bottom:12px}
@media (min-width:720px){.an-tools{flex-direction:row;align-items:center}}
.an-search{flex:1;min-height:46px;display:flex;align-items:center;gap:8px;padding:0 6px 0 14px;background:#fff;border:1px solid rgba(17,17,20,.12);border-radius:12px;color:#8a8a93}
.an-search:focus-within{border-color:#111114}
.an-search input{flex:1;min-width:0;border:0;outline:0;background:none;font-family:inherit;font-size:16px;color:#111114;height:44px}
.an-search input::-webkit-search-cancel-button{display:none}
.an-search-x{width:36px;height:36px;border-radius:10px;border:0;background:none;color:#4b4b52;display:grid;place-items:center;cursor:pointer}
.an-search-x:hover{background:#f0f0f3}
.an-chips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:0 -16px;padding:0 16px}
.an-chips::-webkit-scrollbar{display:none}
@media (min-width:720px){.an-chips{margin:0;padding:0}}
.an-chip{min-height:40px;padding:0 15px;border-radius:999px;border:1px solid rgba(17,17,20,.12);background:#fff;color:#111114;font-family:inherit;font-size:14px;font-weight:600;white-space:nowrap;cursor:pointer;flex-shrink:0}
.an-chip:hover{background:#f5f5f7}
.an-chip.is-on{background:#111114;border-color:#111114;color:#fff}
.an-note{display:flex;gap:8px;align-items:flex-start;margin:0 0 12px;font-size:13px;line-height:1.45;color:#4b4b52;background:#f0f0f3;border-radius:12px;padding:10px 12px}
.an-note svg{flex-shrink:0;margin-top:2px}
.an-note span{color:#4b4b52}

.an-rows{background:#fff;border:1px solid rgba(17,17,20,.07);border-radius:16px;overflow:hidden}
.an-thead{display:none}
.an-row{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"name go" "tpl go" "st go" "date go";column-gap:10px;row-gap:3px;width:100%;text-align:left;padding:14px 14px 14px 16px;border:0;border-bottom:1px solid rgba(17,17,20,.07);background:#fff;font-family:inherit;color:#111114}
.an-row:last-child{border-bottom:0}
.an-row.is-btn{cursor:pointer}
.an-row.is-btn:hover{background:#fafafb}
.an-c-name{grid-area:name;font-family:var(--font-display);font-size:16px;font-weight:700;letter-spacing:-.02em;color:#111114;overflow-wrap:anywhere}
.an-c-tpl{grid-area:tpl;font-size:13.5px;color:#4b4b52;overflow-wrap:anywhere}
.an-c-st{grid-area:st;display:flex;flex-wrap:wrap;gap:6px;margin-top:5px}
.an-c-date{grid-area:date;display:flex;gap:6px;flex-wrap:wrap;font-size:12.5px;margin-top:3px}
.an-c-d1{display:none;color:#111114}
.an-c-d2{color:#8a8a93;font-variant-numeric:tabular-nums}
.an-c-go{grid-area:go;align-self:center;color:#8a8a93;display:grid;place-items:center;width:20px}
.an-pill{display:inline-flex;align-items:center;gap:4px;min-height:24px;padding:0 9px;border-radius:999px;font-size:12px;font-weight:700;border:1px solid transparent}
.an-pill.is-ok{color:#0f6e56;background:rgba(29,158,117,.12);border-color:rgba(29,158,117,.28)}
.an-pill.is-warn{color:#b45309;background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.30)}
.an-pill.is-bad{color:#a32d2d;background:rgba(220,38,38,.08);border-color:rgba(220,38,38,.24)}
@media (min-width:900px){
  .an-thead{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1.3fr) 190px 150px 28px;gap:14px;padding:11px 16px;border-bottom:1px solid rgba(17,17,20,.07)}
  .an-thead span{font-family:var(--font-mono);font-size:10.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#8a8a93}
  .an-row{grid-template-columns:minmax(0,1.4fr) minmax(0,1.3fr) 190px 150px 28px;grid-template-areas:"name tpl st date go";gap:14px;align-items:center;padding:14px 16px}
  .an-c-st,.an-c-date{margin-top:0}
  .an-c-date{flex-direction:column;gap:1px}
  .an-c-d1{display:block;font-size:14px;font-variant-numeric:tabular-nums}
  .an-c-tpl{font-size:14px;color:#111114}
}
.an-more{display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:12px}
.an-foot{display:flex;align-items:center;gap:6px;margin:14px 0 0;font-size:12.5px;color:#8a8a93}
.an-foot span{color:#8a8a93}
`
