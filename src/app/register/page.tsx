'use client';

import { useEffect, useState } from 'react';
import AuthSheet from '../auth/authsheet';
import AppLoading from '@/app/components/system/AppLoading';

export default function RegisterPage() {
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setOpen(true);
    }, 1600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading && <AppLoading />}

      <AuthSheet
        open={open}
        mode="register"
        onClose={() => setOpen(false)}
      />
    </>
  );
}
