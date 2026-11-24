import Link from "next/link";

export type NavigationLink = { href: string; title: string };

export function NavigationDropdown({
  links,
}: {
  links: readonly NavigationLink[];
}) {
  return (
    <ul>
      {links.map(({ href, title }) => (
        <li key={href}>
          <Link href={href} className="dropdown-link">
            {title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
