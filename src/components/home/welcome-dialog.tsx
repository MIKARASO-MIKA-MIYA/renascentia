"use client";

import { Globe, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { site } from "@/config/site";
import {
  type VisitChoice,
  visitChoiceCookie,
  visitChoiceMaxAge,
} from "@/lib/account-preferences";
import "./welcome-dialog.css";

export function WelcomeDialog() {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    const remembered = document.cookie
      .split(";")
      .some((cookie) => cookie.trim().startsWith(visitChoiceCookie + "="));
    if (!element || remembered || window.location.hash) return;
    element.showModal();
    return () => element.close();
  }, []);

  function choose(choice: VisitChoice) {
    document.cookie = `${visitChoiceCookie}=${choice}; Path=/; Max-Age=${visitChoiceMaxAge}; SameSite=Lax`;
    dialog.current?.close();
    if (choice === "guest")
      document.getElementById("main-content")?.focus({ preventScroll: true });
  }

  return (
    <dialog
      ref={dialog}
      className="welcome-dialog"
      aria-labelledby="welcome-title"
      aria-describedby="welcome-description"
      onCancel={(event) => {
        event.preventDefault();
        choose("guest");
      }}
    >
      <div className="welcome-identity">
        <Image
          src="/icon.svg"
          alt=""
          unoptimized
          width={80}
          height={80}
          className="welcome-emblem"
        />
        <p className="welcome-wordmark">{site.name}</p>
        <p className="welcome-subtitle">{site.subtitle}</p>
      </div>
      <div className="welcome-content">
        <h2 id="welcome-title">Добро пожаловать</h2>
        <p id="welcome-description">{site.description}</p>
        <div className="welcome-actions">
          <button
            type="button"
            className="welcome-action welcome-guest"
            onClick={() => choose("guest")}
          >
            <Globe size={18} aria-hidden="true" /> Войти как гость
          </button>
          <Link
            href="/admin/login"
            prefetch={false}
            className="welcome-action"
            onClick={() => choose("editor")}
          >
            <ShieldCheck size={18} aria-hidden="true" /> Войти как владелец или
            редактор
          </Link>
        </div>
      </div>
    </dialog>
  );
}
