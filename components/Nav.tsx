"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { GithubLogo } from "@phosphor-icons/react";
import { InstallButton } from "./Pwa";
import { EASE } from "./ui";

export const REPO_URL = "https://github.com/daodudestiny56-netizen/Sora";

const LINKS = [
  ["Check", "#check"],
  ["How it works", "#how"],
  ["Practice", "#practice"],
  ["Button phones", "#phones"],
  ["Evaluation", "#eval"],
  ["Open source", "#open"],
] as const;

export function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4 sm:pt-6">
        <nav className="flex w-full max-w-max items-center gap-1 rounded-full bg-paper/70 p-1.5 pl-5 shadow-[0_8px_32px_-12px_rgba(20,26,46,0.25)] ring-1 ring-ink/8 backdrop-blur-xl">
          <a href="#top" className="mr-3 font-display text-xl font-[580] tracking-tight text-ink" aria-label="Ṣọ́ra home">
            Ṣọ́ra
          </a>
          <div className="hidden items-center md:flex">
            {LINKS.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-3.5 py-2 text-[13px] text-ink-soft transition-colors duration-500 hover:bg-ink/5 hover:text-ink"
              >
                {label}
              </a>
            ))}
          </div>
          <InstallButton className="ml-1" />
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="ml-1 hidden items-center gap-2 rounded-full bg-ink py-2 pl-4 pr-2 text-[13px] text-paper transition-colors duration-500 hover:bg-indigo md:inline-flex"
          >
            GitHub
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-paper/12">
              <GithubLogo weight="light" size={13} />
            </span>
          </a>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="relative ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-ink text-paper md:hidden"
          >
            <span
              className={`absolute h-px w-4 bg-current transition-transform duration-500 ease-[var(--ease-fluid)] ${open ? "rotate-45" : "-translate-y-[3px]"}`}
            />
            <span
              className={`absolute h-px w-4 bg-current transition-transform duration-500 ease-[var(--ease-fluid)] ${open ? "-rotate-45" : "translate-y-[3px]"}`}
            />
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="fixed inset-0 z-30 flex flex-col justify-center bg-paper/85 px-8 backdrop-blur-3xl md:hidden"
          >
            <ul className="space-y-3">
              {[...LINKS, ["GitHub", REPO_URL] as const].map(([label, href], i) => (
                <li key={href} className="overflow-hidden">
                  <motion.a
                    href={href}
                    onClick={() => setOpen(false)}
                    initial={{ y: 48, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 24, opacity: 0 }}
                    transition={{ duration: 0.7, ease: EASE, delay: 0.08 + i * 0.05 }}
                    className="block font-display text-5xl font-[580] tracking-tight text-ink"
                  >
                    {label}
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
