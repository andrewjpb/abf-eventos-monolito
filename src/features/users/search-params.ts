// /features/users/search-params.ts
import { createSearchParamsCache, parseAsString } from "nuqs/server"

export const searchParse = parseAsString.withDefault("").withOptions({
  shallow: false,
  clearOnDefault: true,
})

export const statusParse = parseAsString.withDefault("ALL").withOptions({
  shallow: false,
  clearOnDefault: true,
})

export const searchParamsCache = createSearchParamsCache({
  search: searchParse,
  status: statusParse,
})

export type ParsedSearchParams = {
  readonly search: string;
  readonly status: string;
}