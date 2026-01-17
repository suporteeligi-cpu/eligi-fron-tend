export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-card glass">
        <h1>Entrar no ELIGI</h1>

        <p className="auth-description">
          Acesse o painel da sua empresa.
        </p>

        <form className="auth-form">
          <input
            type="email"
            placeholder="E-mail"
            required
          />

          <input
            type="password"
            placeholder="Senha"
            required
          />

          <button className="btn btn-primary" type="submit">
            Entrar
          </button>
        </form>

        <p className="auth-footer">
          Ainda não tem conta? <a href="/register">Criar agora</a>
        </p>
      </section>
    </main>
  );
}
