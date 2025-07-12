// /features/events/types.tsx
import { events, address, speakers, sponsors, supporters, attendance_list, cities, states, users, event_schedule, company } from "@prisma/client"

// Tipo de evento com todos os relacionamentos
export type EventWithDetails = events & {
  address: address & {
    cities: cities
    states: states
  }
  speakers?: Array<speakers & {
    users: users & {
      company?: company
    }
  }>
  sponsors?: sponsors[]
  supporters?: supporters[]
  attendance_list?: attendance_list[]
  schedule?: event_schedule[]
  _count?: {
    attendance_list: number
  }
}

// Tipo específico para programação do evento
export type EventSchedule = event_schedule

// Tipo para formulário de programação
export interface ScheduleFormData {
  eventId: string
  day_date: string // Data no formato ISO
  start_time: string
  end_time: string
  title: string
  description?: string
  order_index?: number
}

// Função para formatar data do evento
export const formatarDataEvento = (date: Date): string => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

// Função para formatar horário do evento
export const formatarHorarioEvento = (startTime: string, endTime: string): string => {
  return `${startTime} às ${endTime}`;
};

// Função para calcular dias até o evento
export const calcularDiasAteEvento = (date: Date): number => {
  const hoje = new Date();
  const diaEvento = new Date(date);
  const diferenca = diaEvento.getTime() - hoje.getTime();
  return Math.ceil(diferenca / (1000 * 3600 * 24));
};

// Função para verificar se o evento está ocorrendo hoje
export const eventoOcorreHoje = (date: Date): boolean => {
  const hoje = new Date();
  const diaEvento = new Date(date);
  return hoje.toDateString() === diaEvento.toDateString();
};

// Função para obter status baseado na data do evento
export const obterStatusEvento = (date: Date): 'futuro' | 'hoje' | 'passado' => {
  const hoje = new Date();
  const diaEvento = new Date(date);

  // Remover horas para comparar apenas as datas
  hoje.setHours(0, 0, 0, 0);
  diaEvento.setHours(0, 0, 0, 0);

  if (diaEvento > hoje) return 'futuro';
  if (diaEvento.getTime() === hoje.getTime()) return 'hoje';
  return 'passado';
};

// Cores para status do evento
export const obterCorStatusEvento = (status: 'futuro' | 'hoje' | 'passado'): string => {
  switch (status) {
    case 'futuro':
      return "bg-blue-100 text-blue-800 border-blue-200";
    case 'hoje':
      return "bg-green-100 text-green-800 border-green-200";
    case 'passado':
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

// Função para obter label de status do evento
export const obterLabelStatusEvento = (status: 'futuro' | 'hoje' | 'passado'): string => {
  switch (status) {
    case 'futuro':
      return "Programado";
    case 'hoje':
      return "Hoje";
    case 'passado':
      return "Realizado";
    default:
      return "Desconhecido";
  }
};

// Função para verificar se há vagas disponíveis
export const temVagasDisponiveis = (event: EventWithDetails): boolean => {
  if (!event._count) return true;
  return event._count.attendance_list < event.vacancy_total;
};

// Função para calcular vagas restantes
export const calcularVagasRestantes = (event: EventWithDetails): number => {
  if (!event._count) return event.vacancy_total;
  return Math.max(0, event.vacancy_total - event._count.attendance_list);
};

// Função para verificar se usuário pode se inscrever (simplificada)
export const podeSeInscrever = (event: EventWithDetails): boolean => {
  const status = obterStatusEvento(event.date);
  return status !== 'passado' && temVagasDisponiveis(event) && event.isPublished;
};

// Funções utilitárias para programação do evento
export const formatarHorario = (horario: string): string => {
  return horario.substring(0, 5) // Ex: "09:00:00" -> "09:00"
}

export const ordenarProgramacao = (schedule: EventSchedule[]): EventSchedule[] => {
  return schedule.sort((a, b) => {
    // Primeiro ordena por data
    const dateCompare = new Date(a.day_date).getTime() - new Date(b.day_date).getTime()
    if (dateCompare !== 0) return dateCompare
    
    // Depois por order_index
    if (a.order_index !== b.order_index) return a.order_index - b.order_index
    
    // Por último por horário de início
    return a.start_time.localeCompare(b.start_time)
  })
}

export const agruparProgramacaoPorDia = (schedule: EventSchedule[]): { [key: string]: EventSchedule[] } => {
  const programacaoOrdenada = ordenarProgramacao(schedule)
  
  return programacaoOrdenada.reduce((grupos, item) => {
    const dataKey = new Date(item.day_date).toISOString().split('T')[0]
    
    if (!grupos[dataKey]) {
      grupos[dataKey] = []
    }
    
    grupos[dataKey].push(item)
    return grupos
  }, {} as { [key: string]: EventSchedule[] })
}