export default function Footer() {
  return (
    <footer className="eligi-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <strong>Eligi Business</strong>
          <span>A Gestão inteligente para sua empresa.</span>
        </div>

        <div className="footer-links">
          <a href="/login">Entrar</a>
          <a href="/register">Criar conta</a>
          <a href="#">Privacidade</a>
          <a href="#">Termos</a>
        </div>
      </div>

      <div className="footer-copy">
        © {new Date().getFullYear()} ELIGI. Todos os direitos reservados.
      </div>
    </footer>
  );
}
