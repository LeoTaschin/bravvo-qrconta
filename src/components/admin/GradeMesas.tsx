'use client';

import { useEffect, useState } from 'react';
import type { RestaurantTable } from '@/lib/supabase/types';
import { CartaoMesa, type InfoMesaAberta } from './CartaoMesa';

export const TOTAL_MESAS = 30;
const NUMEROS = Array.from({ length: TOTAL_MESAS }, (_, i) => i + 1);

interface GradeMesasProps {
  tables: RestaurantTable[];
  openTableIds: Set<string>;
  infoOcupadas: Map<string, InfoMesaAberta>;
  onSelect: (numero: number) => void;
}

export function GradeMesas({ tables, openTableIds, infoOcupadas, onSelect }: GradeMesasProps) {
  const porNumero = new Map(tables.map((table) => [table.number, table]));
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const intervalo = setInterval(() => setAgora(Date.now()), 30_000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {NUMEROS.map((numero) => {
        const mesa = porNumero.get(numero);
        const ocupada = Boolean(mesa && openTableIds.has(mesa.id));
        return (
          <CartaoMesa
            key={numero}
            numero={numero}
            cadastrada={Boolean(mesa)}
            ocupada={ocupada}
            info={mesa ? infoOcupadas.get(mesa.id) : undefined}
            agora={agora}
            onSelect={() => onSelect(numero)}
          />
        );
      })}
    </div>
  );
}
