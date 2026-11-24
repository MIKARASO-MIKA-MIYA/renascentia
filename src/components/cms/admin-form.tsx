"use client";

import { useActionState, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { type CmsResult } from "@/app/admin/actions";
import { imageTypes } from "@/lib/cms/schema";
import { uploadFile } from "./media-controls";

export function AdminForm<T>({
  action,
  label,
  children,
}: {
  action: (state: CmsResult<T> | null, data: FormData) => Promise<CmsResult<T>>;
  label: string;
  children: ReactNode;
}) {
  const [result, submit, pending] = useActionState(action, null);
  return (
    <form action={submit} className="cms-admin-form">
      {children}
      <button type="submit" className="cms-primary" disabled={pending}>
        {pending ? "Выполняется…" : label}
      </button>
      {result &&
        (result.ok ? (
          <p role="status">
            {typeof result.data === "number"
              ? "Записей восстановлено в черновики · " + result.data
              : "Изменения сохранены."}
          </p>
        ) : (
          <p className="cms-error" role="alert">
            {result.message}
          </p>
        ))}
    </form>
  );
}

export function AdminUpload() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <div className="cms-admin-form">
      <label>
        Загрузить изображение
        <input
          type="file"
          accept={imageTypes.join(",")}
          disabled={pending}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setPending(true);
            setFailed(false);
            setStatus("Загрузка…");
            try {
              const result = await uploadFile(file);
              if (result.ok) {
                setStatus("Изображение добавлено в медиатеку.");
                router.refresh();
              } else {
                setFailed(true);
                setStatus(result.message);
              }
            } catch {
              setFailed(true);
              setStatus("Не удалось загрузить изображение.");
            } finally {
              setPending(false);
            }
          }}
        />
      </label>
      {status && (
        <p
          role={failed ? "alert" : "status"}
          className={failed ? "cms-error" : undefined}
        >
          {status}
        </p>
      )}
    </div>
  );
}
