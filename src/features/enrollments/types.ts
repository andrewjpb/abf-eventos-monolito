// /features/enrollments/types.ts
import { attendance_list, events, users, company } from "@prisma/client"

// Tipos para estatísticas de inscrições
export type EnrollmentStats = {
  totalEnrollments: number;
  totalEvents: number;
  averageEnrollmentsPerEvent: number;
  enrollmentsByMonth: Array<{
    month: string;
    count: number;
  }>;
  enrollmentsByCompany: Array<{
    company_name: string;
    company_cnpj: string;
    count: number;
    percentage: number;
  }>;
  enrollmentsBySegment: Array<{
    segment: string;
    count: number;
    percentage: number;
  }>;
  topEvents: Array<{
    eventId: string;
    eventTitle: string;
    enrollmentCount: number;
    presentialCount: number;
    onlineCount: number;
    vacancyTotal: number;
    presentialOccupancyRate: number;
    totalOccupancyRate: number;
  }>;
}

// Tipo para inscrição com detalhes completos
export type EnrollmentWithDetails = attendance_list & {
  events: events & {
    address: {
      cities: { name: string };
      states: { name: string };
    };
  };
  users: users;
  company: company;
}

// Tipo para estatísticas por evento
export type EventEnrollmentStats = {
  event: events & {
    address: {
      cities: { name: string };
      states: { name: string };
    };
  };
  totalEnrollments: number;
  checkedInCount: number;
  pendingCount: number;
  presentialEnrollments: number;
  onlineEnrollments: number;
  presentialOccupancyRate: number;
  totalOccupancyRate: number;
  enrollmentsBySegment: Array<{
    segment: string;
    count: number;
    percentage: number;
  }>;
  enrollmentsByType: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  enrollmentsByCity: Array<{
    city: string;
    count: number;
    percentage: number;
  }>;
  enrollmentsByCompany: Array<{
    company_name: string;
    company_cnpj: string;
    count: number;
    percentage: number;
  }>;
}

// Função para formatar taxa de ocupação
export const formatOccupancyRate = (rate: number): string => {
  return `${rate.toFixed(1)}%`;
};

// Função para verificar se um evento está lotado
export const isEventFull = (enrollmentCount: number, vacancyTotal: number): boolean => {
  return enrollmentCount >= vacancyTotal;
};

// Função para calcular status do evento baseado na ocupação
export const getEventStatus = (enrollmentCount: number, vacancyTotal: number): 'EMPTY' | 'LOW' | 'MEDIUM' | 'HIGH' | 'FULL' => {
  const rate = (enrollmentCount / vacancyTotal) * 100;

  if (rate === 0) return 'EMPTY';
  if (rate < 25) return 'LOW';
  if (rate < 50) return 'MEDIUM';
  if (rate < 100) return 'HIGH';
  return 'FULL';
};