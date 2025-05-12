// /features/banners/types.tsx
import { highlight_card } from "@prisma/client"

// Tipo de banner com informações básicas
export type BannerWithDetails = highlight_card

// Função para formatar data de validade do banner (se aplicável)
export const formatarDataValidadeBanner = (date?: Date): string => {
  if (!date) return 'Sem data de expiração';

  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

// Função para verificar se um banner está ativo
export const bannerEstaAtivo = (banner: BannerWithDetails): boolean => {
  return banner.active;
};