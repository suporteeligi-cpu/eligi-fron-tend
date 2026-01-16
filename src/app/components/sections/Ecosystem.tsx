const items = [
  'Agenda inteligente',
  'Equipe e comissões',
  'Pagamentos integrados',
  'Métricas em tempo real',
  'Fiscal automático',
  'Automação e notificações'
];

export default function Ecosystem() {
  return (
    <section className="ecosystem">
      <h2>Não é um app. É um ecossistema.</h2>

      <div className="ecosystem-grid">
        {items.map(item => (
          <div key={item} className="glass-card">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
