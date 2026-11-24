import { Search } from "lucide-react";
import { sections } from "@/config/site";
import { maxQueryLength } from "@/lib/search";

export function SearchBar({
  query = "",
  compact = false,
}: {
  query?: string;
  compact?: boolean;
}) {
  const id = compact ? "header-search" : "page-search";
  return (
    <form
      action={sections.search.href}
      role="search"
      aria-label={compact ? "Поиск в навигации" : "Поиск материалов"}
      className={compact ? "header-search min-w-0 max-w-48" : "mt-8 max-w-2xl"}
    >
      <label
        htmlFor={id}
        className={compact ? "sr-only" : "mb-2 block font-semibold"}
      >
        Поисковый запрос
      </label>
      <div
        className={
          compact ? "relative min-w-0" : "flex flex-col gap-3 sm:flex-row"
        }
      >
        <input
          key={query}
          id={id}
          name="q"
          type="search"
          defaultValue={query}
          maxLength={maxQueryLength}
          placeholder={compact ? "Поиск" : undefined}
          className={
            compact
              ? "h-10 w-full rounded-xs border border-white/45 bg-black pr-2 pl-9 text-sm text-white placeholder:text-white/65"
              : "min-h-11 min-w-0 flex-1 rounded-xs border border-muted bg-canvas px-3"
          }
        />
        <button
          type="submit"
          aria-label={compact ? "Найти" : undefined}
          className={
            compact
              ? "absolute inset-y-0 left-0 flex w-9 cursor-pointer items-center justify-center"
              : "cta"
          }
        >
          <Search aria-hidden="true" size={17} />
          {!compact && "Найти"}
        </button>
      </div>
    </form>
  );
}
