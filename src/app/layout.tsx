import AuthGuard from '../app/auth/AuthGuard';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
