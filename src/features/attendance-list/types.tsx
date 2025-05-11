// /features/attendance-list/types.tsx
import { attendance_list, events, users, company } from "@prisma/client"

// Tipo de inscrição com todos os relacionamentos
export type AttendanceWithDetails = attendance_list & {
  events: events
  users: users
  company: company
}

// Props para o componente de lista de inscritos (caso você queira criar posteriormente)
export interface AttendanceListProps {
  eventId: string
  isOrganizer: boolean
}

// Props para o componente de formulário de inscrição (caso você queira criar posteriormente)
export interface AttendanceFormProps {
  eventId: string
  event?: events
}

// Traduzir status de check-in 
export const traduzirCheckInStatus = (checkedIn: boolean): string => {
  return checkedIn ? "Presente" : "Não confirmado";
};

// Cores para status de check-in
export const obterCorCheckInStatus = (checkedIn: boolean): string => {
  return checkedIn
    ? "bg-green-100 text-green-800 border-green-200"
    : "bg-amber-100 text-amber-800 border-amber-200";
};

// Status possíveis para participantes (mesmo enum usado em update-attendee-status.ts)
export enum AttendeeStatusEnum {
  REGISTERED = "REGISTERED",
  CONFIRMED = "CONFIRMED",
  CANCELED = "CANCELED",
  WAITLIST = "WAITLIST",
}

// Traduzir status do participante
export const traduzirAttendeeStatus = (status: string): string => {
  switch (status) {
    case AttendeeStatusEnum.REGISTERED:
      return "Registrado";
    case AttendeeStatusEnum.CONFIRMED:
      return "Confirmado";
    case AttendeeStatusEnum.CANCELED:
      return "Cancelado";
    case AttendeeStatusEnum.WAITLIST:
      return "Lista de Espera";
    default:
      return status;
  }
};

// Cores para status do participante
export const obterCorAttendeeStatus = (status: string): string => {
  switch (status) {
    case AttendeeStatusEnum.REGISTERED:
      return "bg-blue-100 text-blue-800 border-blue-200";
    case AttendeeStatusEnum.CONFIRMED:
      return "bg-green-100 text-green-800 border-green-200";
    case AttendeeStatusEnum.CANCELED:
      return "bg-red-100 text-red-800 border-red-200";
    case AttendeeStatusEnum.WAITLIST:
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const formatarCPF = (cpf: string): string => {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export const formatarCNPJ = (cnpj: string): string => {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
};

export const formatarTelefone = (telefone: string): string => {
  return telefone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};