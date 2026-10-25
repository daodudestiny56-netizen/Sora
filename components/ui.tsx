"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import clsx from "clsx";

export const EASE = [0.32, 0.72, 0, 1] as const;

export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  const reduce = useReducedMotion();
  const M = motion[as];
  return (
    <M
      className={className}
      initial={reduce ? false : { opacity: 0, y: 40, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </M>
  );
}

/** Pill button with its trailing icon nested in its own circle. */
export function PillButton({
  children,
  href,
  onClick,
  type = "button",
  disabled,
  tone = "ink",
  icon,
  className,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  tone?: "ink" | "paper" | "ghost";
  icon?: React.ReactNode;
  className?: string;
}) {
  const cls = clsx(
    "group inline-flex items-center gap-3 rounded-full py-2 pl-6 pr-2 text-sm font-medium transition-all duration-500 ease-[var(--ease-fluid)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    tone === "ink" && "bg-ink text-paper hover:bg-indigo",
    tone === "paper" && "bg-paper text-ink hover:bg-white",
    tone === "ghost" && "bg-ink/5 text-ink ring-1 ring-ink/10 hover:bg-ink/10",
    className,
  );
  const inner = (
    <>
      <span>{children}</span>
      <span
        className={clsx(
          "flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-500 ease-[var(--ease-fluid)] group-hover:-translate-y-[1px] group-hover:translate-x-1 group-hover:scale-105",
          tone === "ink" ? "bg-paper/12" : "bg-ink/8",
        )}
      >
        {icon ?? <ArrowUpRight weight="light" size={16} />}
      </span>
    </>
  );
  if (href)
    return (
      <a href={href} className={cls} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
        {inner}
      </a>
    );
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {inner}
    </button>
  );
}
