// /features/banners/search-params.ts
import { createSearchParamsCache, parseAsString } from "nuqs/server"

export const searchParse = parseAsString.withDefault("").withOptions({
  shallow: false,
  clearOnDefault: true,
})

export const activeParse = parseAsString.withDefault("ALL").withOptions({
  shallow: false,
  clearOnDefault: true,
})

export const searchParamsCache = createSearchParamsCache({
  search: searchParse,
  active: activeParse,
})

export type ParsedSearchParams = {
  readonly search: string;
  readonly active: string;
}