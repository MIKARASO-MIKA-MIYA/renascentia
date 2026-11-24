import Link from "next/link";

export type Resource = { title: string; href: string; description?: string };

export function ResourceList({ items }: { items: readonly Resource[] }) {
  return (
    <ul className="max-w-3xl divide-y divide-border border-y border-border">
      {items.map(({ title, href, description }) => (
        <li key={href} className="py-4">
          {href.startsWith("https://") ? (
            <a href={href} className="text-link">
              {title}
            </a>
          ) : (
            <Link href={href} className="text-link">
              {title}
            </Link>
          )}
          {description && (
            <p className="mt-1 text-sm text-muted">{description}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
