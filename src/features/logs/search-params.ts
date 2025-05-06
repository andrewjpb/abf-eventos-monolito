import { createSearchParamsCache, parseAsString, parseAsIsoDate } from "nuqs/server"

// Parâmetros de string
export const levelParse = parseAsString.withDefault("").withOptions({
  shallow: false,
  clearOnDefault: true,
})

export const userIdParse = parseAsString.withDefault("").withOptions({
  shallow: false,
  clearOnDefault: true,
})

export const actionParse = parseAsString.withDefault("").withOptions({
  shallow: false,
  clearOnDefault: true,
})

// Parâmetros de data
export const startDateParse = parseAsIsoDate.withOptions({
  shallow: false,
  clearOnDefault: true,
})

export const endDateParse = parseAsIsoDate.withOptions({
  shallow: false,
  clearOnDefault: true,
})

export const searchParamsCache = createSearchParamsCache({
  level: levelParse,
  userId: userIdParse,
  action: actionParse,
  startDate: startDateParse,
  endDate: endDateParse,
})

export type ParsedLogSearchParams = {
  readonly level: string;
  readonly userId: string;
  readonly action: string;
  readonly startDate: Date | null;
  readonly endDate: Date | null;
}