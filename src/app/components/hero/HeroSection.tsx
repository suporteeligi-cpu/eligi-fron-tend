import { COPY } from '@/lib/copy';

type Variant = 'default' | 'barbearia' | 'salao' | 'ads';

const variant: Variant = 'default'; // troque aqui quando quiser

export default function HeroSection() {
  const hero = COPY[variant].hero;

  return (
    <section className="hero">
      <span className="eyebrow">{hero.eyebrow}</span>

      <h1>{hero.title}</h1>

      <p>
        {hero.subtitle.split('\n').map((line, i) => (
          <span key={i}>
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
    </section>
  );
}
