'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { Staff } from '@/lib/supabase/types';

interface CabecalhoDashboardProps {
  staff: Staff;
  restaurantName?: string | null;
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

export function CabecalhoDashboard({ staff, restaurantName }: CabecalhoDashboardProps) {
  const router = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuAberto) return;

    function handleClickFora(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAberto(false);
      }
    }

    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [menuAberto]);

  async function handleSair() {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-black/[0.06] bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">
        <div className="flex items-center gap-8">
          <p className="text-base font-semibold tracking-tight text-[#851619]">QRConta</p>
          <nav className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#111827] transition-colors"
            >
              Mesas
              <span className="mt-1.5 block h-0.5 rounded-full bg-[#851619]" />
            </button>
            <button
              type="button"
              disabled
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-black/30 cursor-not-allowed"
            >
              Histórico
            </button>
            <button
              type="button"
              disabled
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-black/30 cursor-not-allowed"
            >
              Configurações
            </button>
          </nav>
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuAberto((atual) => !atual)}
            className="flex items-center gap-3 rounded-lg py-1.5 pl-2 pr-1 transition-colors hover:bg-black/[0.03]"
          >
            <div className="text-right">
              <p className="text-sm font-medium leading-tight text-[#111827]">{restaurantName ?? 'Restaurante'}</p>
              <p className="text-xs leading-tight text-black/40">Gerente</p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-full bg-[#851619]/10 text-sm font-semibold text-[#851619]">
              {iniciais(staff.name)}
            </div>
          </button>

          {menuAberto && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-48 rounded-xl border border-black/[0.06] bg-white py-1.5 shadow-lg">
              <button
                type="button"
                disabled
                className="block w-full px-4 py-2 text-left text-sm text-black/30 cursor-not-allowed"
              >
                Perfil
              </button>
              <button
                type="button"
                disabled
                className="block w-full px-4 py-2 text-left text-sm text-black/30 cursor-not-allowed"
              >
                Configurações
              </button>
              <div className="my-1.5 border-t border-black/[0.06]" />
              <button
                type="button"
                onClick={handleSair}
                className="block w-full px-4 py-2 text-left text-sm font-medium text-[#851619] transition-colors hover:bg-[#851619]/8"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
