// /features/companies/search-params.ts
import { createSearchParamsCache, parseAsString } from "nuqs/server"

export const searchParse = parseAsString.withDefault("").withOptions({
  shallow: false,
  clearOnDefault: true,
})

export const segmentParse = parseAsString.withDefault("").withOptions({
  shallow: false,
  clearOnDefault: true,
})

export const activeParse = parseAsString.withDefault("").withOptions({
  shallow: false,
  clearOnDefault: true,
})

export const searchParamsCache = createSearchParamsCache({
  search: searchParse,
  segment: segmentParse,
  active: activeParse,
})

export type ParsedSearchParams = {
  readonly search: string;
  readonly segment: string;
  readonly active: string;
}