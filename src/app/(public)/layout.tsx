import '@/styles/core.css';
import '@/styles/glass.css';
import '@/styles/landing.css';
import Navbar from '../components/navbar/Navbar';
import Footer from '../components/footer/Footer';

export default function PublicLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
