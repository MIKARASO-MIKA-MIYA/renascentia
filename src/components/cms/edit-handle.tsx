"use client";

import { Pencil } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { loadEdit, type EditState } from "@/app/admin/actions";
import type { EditorOptions } from "./editor";

const ContentEditor = dynamic(() => import("./editor"), {
  ssr: false,
  loading: () => (
    <span className="cms-handle-status" role="status">
      Открытие редактора…
    </span>
  ),
});

export function EditHandle({
  inline = false,
  ...options
}: EditorOptions & { inline?: boolean }) {
  const [initial, setInitial] = useState<EditState>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function open() {
    setPending(true);
    setError("");
    try {
      const result = await loadEdit(options.entryKey);
      if (result.ok) setInitial(result.data);
      else setError(result.message);
    } catch {
      setError("Не удалось открыть редактор.");
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <button
        type="button"
        className={inline ? "cms-inline-edit" : "cms-pencil"}
        title="Редактировать"
        aria-label={inline ? undefined : "Редактировать"}
        disabled={pending}
        onClick={() => void open()}
      >
        <Pencil size={15} aria-hidden="true" />{" "}
        {inline && (pending ? "Открытие…" : "Редактировать")}
      </button>
      {error && (
        <span className="cms-handle-status" role="alert">
          {error}
        </span>
      )}
      {initial && (
        <ContentEditor
          {...options}
          initial={initial}
          onClose={() => setInitial(undefined)}
        />
      )}
    </>
  );
}
