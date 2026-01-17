import { COPY } from '@/lib/copy';

export default function FinalCTA() {
  const cta = COPY.default.finalCta;

  return (
    <section className="final-cta">
      <h2>{cta.title}</h2>
      <p>{cta.subtitle}</p>

      <div className="hero-actions">
        <a href="/register" className="btn btn-primary">
          {cta.button}
        </a>
      </div>

      <p className="text-soft" style={{ marginTop: 16, fontSize: '0.9rem' }}>
        {cta.microcopy}
      </p>
    </section>
  );
}
