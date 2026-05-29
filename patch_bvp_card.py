# Este script será executado no terminal do Eli (frontend).
# Substitui o bloco do "Card serviço + horário + profissional" (linhas ~642-740)
# por uma versão que lista os itens do grupo quando há mais de 1 serviço.

path = 'src/features/booking/components/BookingViewPanel.tsx'
c = open(path).read()

start_marker = '              {/* Card serviço + horário + profissional */}'
end_marker   = '              {/* Card total + status de venda */}'

i_start = c.find(start_marker)
i_end   = c.find(end_marker)

if i_start == -1 or i_end == -1:
    print('ERRO: marcadores não encontrados', i_start, i_end)
    raise SystemExit(1)

new_block = '''              {/* Card de serviços — lista o grupo quando há múltiplos (estilo Booksy) */}
              {(() => {
                const group = detail?.groupItems && detail.groupItems.length > 1
                  ? detail.groupItems
                  : null

                if (group) {
                  // ── MODO GRUPO: vários serviços do mesmo agendamento ──
                  return (
                    <div style={{
                      background: '#fff',
                      borderRadius: 18,
                      overflow: 'hidden',
                      boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}>
                      {/* Data do grupo */}
                      <div style={{
                        padding: '14px 18px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        borderBottom: '1px solid rgba(0,0,0,0.06)',
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: colors.red.subtle,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Calendar size={16} color={colors.red.DEFAULT} strokeWidth={2}/>
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f0f14' }}>{dateLabel}</div>
                          <div style={{ fontSize: 12, color: colors.gray.dimText, marginTop: 2 }}>
                            {group.length} serviços
                          </div>
                        </div>
                      </div>

                      {/* Lista de serviços */}
                      {group.map((it, gi) => {
                        const itStart = dayjs(it.startAt).tz('America/Sao_Paulo').format('HH:mm')
                        const itEnd   = dayjs(it.endAt).tz('America/Sao_Paulo').format('HH:mm')
                        const itPrice = it.service.price ?? 0
                        return (
                          <div key={it.id} style={{
                            padding: '14px 18px',
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            borderBottom: gi < group.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                          }}>
                            <div style={{
                              width: 4, height: 40, borderRadius: 2,
                              background: it.service.color ?? colors.red.DEFAULT,
                              flexShrink: 0,
                            }}/>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                alignItems: 'baseline', gap: 8,
                              }}>
                                <span style={{
                                  fontSize: 14, fontWeight: 700, color: '#0f0f14',
                                  letterSpacing: '-0.01em',
                                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>
                                  {it.service.name}
                                </span>
                                {itPrice > 0 && (
                                  <span style={{
                                    fontSize: 14, fontWeight: 800, color: '#0f0f14',
                                    fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                                  }}>
                                    R$ {itPrice.toFixed(2).replace('.',',')}
                                  </span>
                                )}
                              </div>
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                marginTop: 3, fontSize: 12, color: colors.gray.dimText,
                                fontVariantNumeric: 'tabular-nums',
                              }}>
                                <Clock size={11} color={colors.gray.dimText} strokeWidth={2}/>
                                {itStart}–{itEnd}
                                {it.professional?.name && (
                                  <>
                                    <span style={{ opacity: 0.4 }}>·</span>
                                    {it.professional.name}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                }

                // ── MODO SINGLE: 1 serviço (layout original) ──
                return (
                  <div style={{
                    background: '#fff',
                    borderRadius: 18,
                    overflow: 'hidden',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}>
                    {/* Serviço */}
                    <div style={{
                      padding: '16px 18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{
                          width: 4, height: 40, borderRadius: 2,
                          background: detail?.service.color ?? colors.red.DEFAULT,
                          flexShrink: 0,
                        }}/>
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: 15, fontWeight: 700,
                            color: '#0f0f14',
                            letterSpacing: '-0.01em',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {detail?.service.name ?? serviceName}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                            <Clock size={11} color={colors.gray.dimText} strokeWidth={2}/>
                            <span style={{ fontSize: 12, color: colors.gray.dimText }}>
                              {detail?.service.duration ? `${detail.service.duration}min` : `${bookingStart}–${bookingEnd}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      {price > 0 && (
                        <span style={{
                          fontSize: 17, fontWeight: 800,
                          color: '#0f0f14',
                          fontVariantNumeric: 'tabular-nums',
                          flexShrink: 0, marginLeft: 12,
                        }}>
                          R$ {price.toFixed(2).replace('.',',')}
                        </span>
                      )}
                    </div>

                    {/* Horário */}
                    <div style={{
                      padding: '14px 18px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      borderBottom: profName ? '1px solid rgba(0,0,0,0.06)' : 'none',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: colors.red.subtle,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Calendar size={16} color={colors.red.DEFAULT} strokeWidth={2}/>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f0f14' }}>{dateLabel}</div>
                        <div style={{
                          fontSize: 13, color: colors.gray.dimText, marginTop: 2,
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {bookingStart} – {bookingEnd}
                        </div>
                      </div>
                    </div>

                    {/* Profissional */}
                    {profName && (
                      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: 'rgba(71,85,105,0.08)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <User size={16} color="#475569" strokeWidth={2}/>
                        </div>
                        <div>
                          <div style={{
                            fontSize: 11, fontWeight: 700,
                            color: colors.gray.dimText,
                            textTransform: 'uppercase',
                            letterSpacing: '.07em',
                            marginBottom: 2,
                          }}>Profissional</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f0f14' }}>{profName}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

'''

c = c[:i_start] + new_block + c[i_end:]
open(path, 'w').write(c)
print('OK — bloco substituído. groupItems no render:', 'detail.groupItems' in c)
