// /features/roles/search-params.ts
import { createSearchParamsCache, parseAsString } from "nuqs/server"

export const searchParse = parseAsString.withDefault("").withOptions({
  shallow: false,
  clearOnDefault: true,
})

export const searchParamsCache = createSearchParamsCache({
  search: searchParse,
})

export type ParsedSearchParams = {
  readonly search: string;
}