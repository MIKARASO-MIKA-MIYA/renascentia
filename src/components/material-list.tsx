import Link from "next/link";
import type { MaterialLink } from "@/lib/materials";

export function MaterialList({ items }: { items: readonly MaterialLink[] }) {
  if (!items.length) return <p className="text-muted">Материалов пока нет.</p>;

  return (
    <ul className="divide-y divide-border border-y border-border">
      {items.map(({ href, title, description, status, category, code }) => (
        <li key={href} className="py-5">
          {(category || code) && (
            <p className="mb-1 text-sm font-semibold text-muted">
              {[category, code].filter(Boolean).join(" · ")}
            </p>
          )}
          <Link href={href} className="text-link text-xl">
            {title}
          </Link>
          <p className="mt-1 max-w-[65ch] text-muted">{description}</p>
          {status === "planned" && (
            <p className="mt-2 text-sm font-medium text-muted">В подготовке</p>
          )}
        </li>
      ))}
    </ul>
  );
}
