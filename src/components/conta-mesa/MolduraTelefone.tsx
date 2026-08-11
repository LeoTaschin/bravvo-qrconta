interface MolduraTelefoneProps {
  children: React.ReactNode;
}

/**
 * Casca que todo o fluxo do cliente (mesa/[slug]) roda dentro. Não é um
 * cartão de celular flutuando sobre um fundo — é só uma coluna central com
 * a largura de um app de celular, ocupando a altura da tela como qualquer
 * página normal. No celular já ocupa 100% da largura (efeito idêntico a
 * antes); no desktop ela fica centralizada, sem sombra, borda ou moldura
 * ao redor — o conteúdo naturalmente contido, sem parecer um mockup.
 */
export function MolduraTelefone({ children }: MolduraTelefoneProps) {
  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[480px] bg-[#f3f3f3]">
      {children}
    </div>
  );
}
