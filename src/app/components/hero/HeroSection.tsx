import { COPY } from '@/lib/copy';

type Variant = 'default' | 'barbearia' | 'salao' | 'ads';

interface HeroSectionProps {
  variant?: Variant;
}

export default function HeroSection({ variant = 'default' }: HeroSectionProps) {
  const hero = COPY[variant].hero;

  return (
    <section className="hero container">
      <span className="eyebrow">{hero.eyebrow}</span>

      <h1>{hero.title}</h1>

      <p>
        {hero.subtitle.split('\n').map((line, index) => (
          <span key={index}>
            {line}
            <br />
          </span>
        ))}
      </p>

      <div className="hero-actions">
        <a href="/register" className="btn btn-primary">
          {hero.primaryCta}
        </a>

        {hero.secondaryCta && (
          <a href="#como-funciona" className="btn btn-glass">
            {hero.secondaryCta}
          </a>
        )}
      </div>

      {hero.microcopy && (
        <p className="text-soft" style={{ marginTop: 16, fontSize: '0.9rem' }}>
          {hero.microcopy}
        </p>
      )}

      <div className="hero-glass-cards">
        <div className="glass-card">Agenda inteligente</div>
        <div className="glass-card">Equipe e comissões</div>
        <div className="glass-card">Pagamentos integrados</div>
      </div>
    </section>
  );
}
