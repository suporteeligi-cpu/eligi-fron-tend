export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>O sistema operacional da sua empresa.</h1>

        <p>
          Agenda, equipe, clientes, pagamentos e crescimento.
          <br />
          Tudo conectado. Tudo sob controle.
        </p>

        <div className="hero-actions">
          <a href="/register" className="btn-primary">
            Criar minha empresa
          </a>
          <a href="#como-funciona" className="btn-secondary">
            Ver como funciona
          </a>
        </div>
      </div>

      <div className="hero-glass-cards">
       <div className="glass-card floating delay-1">Agenda</div>
       <div className="glass-card floating delay-2">Faturamento</div>
       <div className="glass-card floating delay-3">Equipe</div>
      </div>

    </section>
  );
}
