'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { BotaoPrimario } from '@/components/conta-mesa/BotaoPrimario';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setCarregando(true);
    setErro(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      setErro(
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha inválidos.'
          : 'Não foi possível entrar. Tente novamente.'
      );
      setCarregando(false);
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f3f3]">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
        <p className="mb-1 text-lg font-semibold text-[#111827]">Bravvo Admin</p>
        <p className="mb-6 text-sm text-black/45">Entre com sua conta de funcionário</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="E-mail"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-[50px] rounded-[10px] border-[0.5px] border-black/20 px-4 text-sm text-black outline-none focus:border-[#851619]"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Senha"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            className="h-[50px] rounded-[10px] border-[0.5px] border-black/20 px-4 text-sm text-black outline-none focus:border-[#851619]"
          />

          {erro && <p className="rounded-xl bg-[#851619]/5 px-3 py-2.5 text-xs text-[#851619]">{erro}</p>}

          <div className="mt-2">
            <BotaoPrimario type="submit" disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </BotaoPrimario>
          </div>
        </form>
      </div>
    </div>
  );
}
