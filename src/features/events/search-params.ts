// /features/events/search-params.ts
import { createSearchParamsCache, parseAsString, parseAsBoolean } from "nuqs/server"

export const searchParse = parseAsString.withDefault("").withOptions({
  shallow: false,
  clearOnDefault: true,
})

export const formatParse = parseAsString.withDefault("ALL").withOptions({
  shallow: false,
  clearOnDefault: true,
})

export const highlightedParse = parseAsBoolean.withDefault(false).withOptions({
  shallow: false,
  clearOnDefault: true,
})

export const pastParse = parseAsBoolean.withDefault(false).withOptions({
  shallow: false,
  clearOnDefault: true,
})

export const searchParamsCache = createSearchParamsCache({
  search: searchParse,
  format: formatParse,
  highlighted: highlightedParse,
  past: pastParse,
})

export type ParsedSearchParams = {
  readonly search: string;
  readonly format: string;
  readonly highlighted: boolean;
  readonly past: boolean;
}