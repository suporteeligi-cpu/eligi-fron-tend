export default function Footer() {
  return (
    <footer className="eligi-footer">
      <div className="footer-container">
        <span className="footer-brand">ELIGI</span>

        <nav className="footer-links">
          <a href="/barbearias">Barbearias</a>
          <a href="/saloes">Salões</a>
          <a href="/login">Entrar</a>
        </nav>
      </div>

      <div className="footer-copy">
        © {new Date().getFullYear()} ELIGI. Todos os direitos reservados.
      </div>
    </footer>
  );
}
