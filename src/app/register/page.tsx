'use client';

import { useState } from 'react';
import AuthSheet from '../auth/authsheet';

export default function RegisterPage() {
  const [open, setOpen] = useState(true);

  return (
    <>
      {/* AUTH SHEET — já inicia em REGISTER */}
      <AuthSheet
        open={open}
        initialMode="register"
        onClose={() => setOpen(false)}
      />

      {/* BACKGROUND / LANDING */}
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(circle at top, #1a1a1a, #0a0a0a)',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            maxWidth: 420,
            padding: 24,
          }}
        >
          <h1
            style={{
              fontSize: 34,
              fontWeight: 900,
              marginBottom: 12,
            }}
          >
            Criar conta no ELIGI
          </h1>

          <p
            style={{
              color: '#aaa',
              marginBottom: 28,
            }}
          >
            Comece a gerenciar seus agendamentos de forma inteligente.
          </p>

          <button
            className="btn btn-primary"
            onClick={() => setOpen(true)}
          >
            Criar minha conta
          </button>
        </div>
      </main>
    </>
  );
}
