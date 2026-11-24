import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/components/cms/editor.css";

export const metadata: Metadata = {
  title: "Редактор содержимого",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="cms-admin page-container page-spacing">{children}</div>
  );
}
