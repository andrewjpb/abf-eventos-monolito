// Tipos de participação disponíveis
export const PARTICIPANT_TYPES = {
  PARTICIPANT: 'participant',      // Participante (default)
  GUEST: 'guest',                  // Convidado
  SPEAKER: 'speaker',              // Palestrante
  AUTHORITY: 'authority',          // Autoridade
  MARKETING: 'marketing',          // Mkt
  SPONSOR: 'sponsor',              // Patrocinador
  BOARD: 'board',                  // Diretoria
} as const

// Tipo TypeScript
export type ParticipantType = typeof PARTICIPANT_TYPES[keyof typeof PARTICIPANT_TYPES]

// Labels para exibição
export const PARTICIPANT_TYPE_LABELS: Record<ParticipantType, string> = {
  [PARTICIPANT_TYPES.PARTICIPANT]: 'Participante',
  [PARTICIPANT_TYPES.GUEST]: 'Convidado',
  [PARTICIPANT_TYPES.SPEAKER]: 'Palestrante',
  [PARTICIPANT_TYPES.AUTHORITY]: 'Autoridade',
  [PARTICIPANT_TYPES.MARKETING]: 'Mkt',
  [PARTICIPANT_TYPES.SPONSOR]: 'Patrocinador',
  [PARTICIPANT_TYPES.BOARD]: 'Diretoria'
}

// Cores para badges
export const PARTICIPANT_TYPE_COLORS: Record<ParticipantType, string> = {
  [PARTICIPANT_TYPES.PARTICIPANT]: 'bg-blue-100 text-blue-800 border-blue-200',
  [PARTICIPANT_TYPES.GUEST]: 'bg-purple-100 text-purple-800 border-purple-200',
  [PARTICIPANT_TYPES.SPEAKER]: 'bg-green-100 text-green-800 border-green-200',
  [PARTICIPANT_TYPES.AUTHORITY]: 'bg-red-100 text-red-800 border-red-200',
  [PARTICIPANT_TYPES.MARKETING]: 'bg-pink-100 text-pink-800 border-pink-200',
  [PARTICIPANT_TYPES.SPONSOR]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [PARTICIPANT_TYPES.BOARD]: 'bg-indigo-100 text-indigo-800 border-indigo-200'
}

// Helper para obter o label
export const getParticipantTypeLabel = (type: string | null | undefined): string => {
  if (!type) return 'Participante'
  return PARTICIPANT_TYPE_LABELS[type as ParticipantType] || type
}

// Helper para obter a cor
export const getParticipantTypeColor = (type: string | null | undefined): string => {
  if (!type) return 'bg-blue-100 text-blue-800 border-blue-200'
  return PARTICIPANT_TYPE_COLORS[type as ParticipantType] || 'bg-blue-100 text-blue-800 border-blue-200'
}

// Tipo padrão para novos registros
export const DEFAULT_PARTICIPANT_TYPE = PARTICIPANT_TYPES.PARTICIPANT

// Array para uso em selects
export const PARTICIPANT_TYPE_OPTIONS = Object.entries(PARTICIPANT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label
}))