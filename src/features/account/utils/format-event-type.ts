export function formatEventType(format: string): string {
  const formatMap: Record<string, string> = {
    'in_person': 'Presencial',
    'online': 'Online',
    'hybrid': 'Híbrido',
    'presencial': 'Presencial',
    'virtual': 'Online'
  }
  
  return formatMap[format.toLowerCase()] || format
}

export function getEventTypeVariant(format: string): "default" | "secondary" | "outline" {
  const normalizedFormat = format.toLowerCase()
  
  if (normalizedFormat === 'in_person' || normalizedFormat === 'presencial') {
    return 'default'
  }
  
  if (normalizedFormat === 'online' || normalizedFormat === 'virtual') {
    return 'secondary'
  }
  
  return 'outline' // para hybrid ou outros
}