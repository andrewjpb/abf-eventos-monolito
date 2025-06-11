import * as XLSX from 'xlsx';
import { EnrollmentWithDetails } from '../types';

export function exportEnrollmentsToXLSX(enrollments: EnrollmentWithDetails[], filename: string = 'inscricoes') {
  // Preparar dados para exportação
  const exportData = enrollments.map(enrollment => ({
    'Nome': enrollment.attendee_full_name || '',
    'Email': enrollment.attendee_email || '',
    'CPF': enrollment.attendee_cpf || '',
    'RG': enrollment.attendee_rg || '',
    'Telefone': enrollment.mobile_phone || '',
    'Cargo': enrollment.attendee_position || '',
    'Empresa': enrollment.company?.name || '',
    'CNPJ': enrollment.company_cnpj || '',
    'Segmento': enrollment.company_segment || '',
    'Evento': enrollment.events?.title || '',
    'Data do Evento': enrollment.events?.date ? new Date(enrollment.events.date).toLocaleDateString('pt-BR') : '',
    'Local': enrollment.events?.address ? `${enrollment.events.address.cities?.name || ''}, ${enrollment.events.address.states?.name || ''}` : '',
    'Tipo de Participante': enrollment.attendee_type === 'in_person' ? 'Presencial' : (enrollment.attendee_type === 'online' ? 'Online' : enrollment.attendee_type || 'Não informado'),
    'Status': enrollment.checked_in ? 'Check-in feito' : 'Pendente',
    'Data de Check-in': enrollment.checked_in ? 'Realizado' : 'Não realizado',
    'Data de Inscrição': enrollment.created_at ? new Date(enrollment.created_at).toLocaleString('pt-BR') : '',
  }));

  // Criar workbook e worksheet
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inscrições');

  // Ajustar largura das colunas
  const columnWidths = [
    { wch: 30 }, // Nome
    { wch: 30 }, // Email
    { wch: 15 }, // CPF
    { wch: 15 }, // RG
    { wch: 20 }, // Telefone
    { wch: 25 }, // Cargo
    { wch: 30 }, // Empresa
    { wch: 18 }, // CNPJ
    { wch: 20 }, // Segmento
    { wch: 40 }, // Evento
    { wch: 15 }, // Data do Evento
    { wch: 30 }, // Local
    { wch: 20 }, // Tipo de Participante
    { wch: 15 }, // Status
    { wch: 20 }, // Data de Check-in
    { wch: 20 }, // Data de Inscrição
  ];
  ws['!cols'] = columnWidths;

  // Gerar arquivo e fazer download
  const date = new Date().toISOString().split('T')[0];
  const finalFilename = `${filename}_${date}.xlsx`;
  XLSX.writeFile(wb, finalFilename);
}

export function exportEnrollmentStatsToXLSX(stats: any, filename: string = 'estatisticas_inscricoes') {
  // Preparar dados de estatísticas
  const summaryData = [
    { 'Métrica': 'Total de Inscrições', 'Valor': stats.total },
    { 'Métrica': 'Check-ins Realizados', 'Valor': stats.checkedIn },
    { 'Métrica': 'Check-ins Pendentes', 'Valor': stats.pending },
    { 'Métrica': 'Taxa de Comparecimento', 'Valor': `${((stats.checkedIn / stats.total) * 100).toFixed(2)}%` },
  ];

  // Dados por evento (se disponível)
  const eventData = stats.byEvent?.map((event: any) => ({
    'Evento': event.title,
    'Total de Inscrições': event._count._all,
    'Check-ins Realizados': event.checkedIn,
    'Check-ins Pendentes': event.pending,
    'Taxa de Comparecimento': `${((event.checkedIn / event._count._all) * 100).toFixed(2)}%`,
  })) || [];

  // Dados por segmento (se disponível)
  const segmentData = stats.bySegment?.map((segment: any) => ({
    'Segmento': segment.segment || 'Sem segmento',
    'Total de Inscrições': segment._count._all,
    'Check-ins Realizados': segment.checkedIn,
    'Check-ins Pendentes': segment.pending,
    'Taxa de Comparecimento': `${((segment.checkedIn / segment._count._all) * 100).toFixed(2)}%`,
  })) || [];

  // Criar workbook
  const wb = XLSX.utils.book_new();

  // Adicionar planilha de resumo
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

  // Adicionar planilha por evento (se houver dados)
  if (eventData.length > 0) {
    const wsEvent = XLSX.utils.json_to_sheet(eventData);
    wsEvent['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsEvent, 'Por Evento');
  }

  // Adicionar planilha por segmento (se houver dados)
  if (segmentData.length > 0) {
    const wsSegment = XLSX.utils.json_to_sheet(segmentData);
    wsSegment['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSegment, 'Por Segmento');
  }

  // Gerar arquivo e fazer download
  const date = new Date().toISOString().split('T')[0];
  const finalFilename = `${filename}_${date}.xlsx`;
  XLSX.writeFile(wb, finalFilename);
}