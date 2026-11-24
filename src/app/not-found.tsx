import Link from "next/link";
import { PageHeading } from "@/components/page-heading";

export default function NotFound() {
  return (
    <div className="page-container page-spacing">
      <PageHeading title="Страница не найдена" />
      <Link
        href="/"
        className="mt-5 inline-flex min-h-11 items-center text-link"
      >
        На главную
      </Link>
    </div>
  );
}
