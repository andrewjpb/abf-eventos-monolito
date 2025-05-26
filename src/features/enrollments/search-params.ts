// /features/enrollments/search-params.ts
import { createSearchParamsCache, parseAsString, parseAsInteger } from "nuqs/server"

export const eventIdParse = parseAsString.withDefault("ALL").withOptions({
  shallow: false,
  clearOnDefault: true,
})

export const segmentParse = parseAsString.withDefault("ALL").withOptions({
  shallow: false,
  clearOnDefault: true,
})

export const statusParse = parseAsString.withDefault("ALL").withOptions({
  shallow: false,
  clearOnDefault: true,
})

export const searchParse = parseAsString.withDefault("").withOptions({
  shallow: false,
  clearOnDefault: true,
})

export const typeParse = parseAsString.withDefault("ALL").withOptions({
  shallow: false,
  clearOnDefault: true,
})

export const searchParamsCache = createSearchParamsCache({
  eventId: eventIdParse,
  segment: segmentParse,
  status: statusParse,
  search: searchParse,
  type: typeParse,
})

export type ParsedSearchParams = {
  readonly eventId: string;
  readonly segment: string;
  readonly status: string;
  readonly search: string;
  readonly type: string;
}