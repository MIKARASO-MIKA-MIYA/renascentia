import Link from "next/link";
import { site } from "@/config/site";

export function Brand() {
  return (
    <Link
      href="/"
      className="brand"
      aria-label={`${site.name} — главная страница`}
    >
      <span className="brand-symbol" aria-hidden="true">
        ⚜&#xfe0e;
      </span>
      <span className="min-w-0">
        <span className="brand-name">{site.name}</span>
        <span className="brand-subtitle">{site.subtitle}</span>
      </span>
    </Link>
  );
}
