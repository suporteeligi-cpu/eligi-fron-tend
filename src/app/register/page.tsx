export default function RegisterPage() {
  return (
    <main className="auth-page">
      <section className="auth-card glass">
        <h1>Criar conta no ELIGI</h1>

        <p className="auth-description">
          Comece agora a organizar sua empresa.
        </p>

        <form className="auth-form">
          <input
            type="text"
            placeholder="Nome"
            required
          />

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
            Criar conta
          </button>
        </form>

        <p className="auth-footer">
          Já tem conta? <a href="/login">Entrar</a>
        </p>
      </section>
    </main>
  );
}
