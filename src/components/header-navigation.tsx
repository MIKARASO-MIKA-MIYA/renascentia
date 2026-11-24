"use client";

import { ChevronDown, Menu, Search, UserRound, X } from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

type Dropdown = { id: string; title: string; content: ReactNode };
const exploreId = "explore";
const accountId = "account";

function focusFirstAction(id: string) {
  document
    .getElementById(`header-panel-${id}`)
    ?.querySelector<HTMLElement>("a, button")
    ?.focus();
}

export function HeaderNavigation({
  brand,
  search,
  explore,
  dropdowns,
  account,
}: {
  brand: ReactNode;
  search: ReactNode;
  explore: ReactNode;
  dropdowns: readonly Dropdown[];
  account: ReactNode;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const currentTrigger = useRef<HTMLButtonElement>(null);
  const focusOnOpen = useRef(false);

  useEffect(() => {
    if (!open) return;
    if (focusOnOpen.current) {
      focusFirstAction(open);
      focusOnOpen.current = false;
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (
        target instanceof Element &&
        !target.closest(`#header-panel-${open}`) &&
        !currentTrigger.current?.contains(target)
      ) {
        setOpen(null);
      }
    }

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(null);
        currentTrigger.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function activate(
    id: string,
    trigger: HTMLButtonElement,
    focusLink: boolean,
  ) {
    currentTrigger.current = trigger;
    if (open === id) {
      if (focusLink) focusFirstAction(id);
      return;
    }
    focusOnOpen.current = focusLink;
    setOpen(id);
  }

  function handleArrowDown(
    event: KeyboardEvent<HTMLButtonElement>,
    id: string,
  ) {
    if (event.key !== "ArrowDown") return;
    event.preventDefault();
    activate(id, event.currentTarget, true);
  }

  function trigger(id: string, title: string) {
    const expanded = open === id;
    const isExplore = id === exploreId;
    const isAccount = id === accountId;

    return (
      <button
        type="button"
        className="header-toggle cursor-pointer"
        aria-label={isAccount ? title : undefined}
        aria-expanded={expanded}
        aria-controls={`header-panel-${id}`}
        onKeyDown={(event) => handleArrowDown(event, id)}
        onClick={(event) => {
          if (expanded) {
            setOpen(null);
          } else {
            activate(id, event.currentTarget, event.detail === 0);
          }
        }}
      >
        {isAccount ? (
          <UserRound size={21} aria-hidden="true" />
        ) : (
          <>
            {isExplore && (
              <span className="mobile-label" aria-hidden="true">
                {expanded ? <X size={24} /> : <Menu size={24} />}
              </span>
            )}
            <span className={isExplore ? "desktop-label" : undefined}>
              {title}
            </span>
            {isExplore && <span className="mobile-label sr-only">{title}</span>}
            <ChevronDown
              aria-hidden="true"
              size={15}
              className={`header-chevron ${isExplore ? "desktop-label" : ""}`}
            />
          </>
        )}
      </button>
    );
  }

  return (
    <header
      className="site-header"
      onClick={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest("[data-close-account]")
        ) {
          currentTrigger.current?.focus();
          setOpen(null);
        } else if (
          event.target instanceof Element &&
          event.target.closest("a")
        ) {
          setOpen(null);
        }
      }}
    >
      <nav
        aria-label="Основная навигация"
        className="page-container header-row"
      >
        <div className="header-start">
          <div>
            {trigger(exploreId, "Исследовать")}
            <div
              id="header-panel-explore"
              className="mega-panel"
              hidden={open !== exploreId}
            >
              {explore}
            </div>
          </div>
          {search}
        </div>
        <div className="header-brand">{brand}</div>
        <div className="header-end">
          <div className="header-dropdowns">
            {dropdowns.map(({ id, title, content }) => (
              <div key={id} className="relative">
                {trigger(id, title)}
                <div
                  className="nav-dropdown"
                  id={`header-panel-${id}`}
                  hidden={open !== id}
                >
                  {content}
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/search"
            className="header-search-link"
            aria-label="Поиск"
          >
            <Search size={23} aria-hidden="true" />
          </Link>
          {trigger(accountId, "Аккаунт")}
          <div
            id="header-panel-account"
            className="nav-dropdown header-account-panel"
            hidden={open !== accountId}
          >
            {account}
          </div>
        </div>
      </nav>
    </header>
  );
}
