'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface ListboxOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  badge?: string;
}

interface AccessibleListboxProps<T extends string = string> {
  label: string;
  value: T;
  options: ListboxOption<T>[];
  onChange: (nextValue: T) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function AccessibleListbox<T extends string = string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'انتخاب نمایید...',
  disabled = false,
  error,
  className = '',
}: AccessibleListboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(() =>
    Math.max(
      0,
      options.findIndex((o) => o.value === value)
    )
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonId = useId();
  const listboxId = useId();

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const idx = options.findIndex((o) => o.value === value);
    if (idx >= 0) setActiveIndex(idx);
  }, [value, options]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const target = options[activeIndex];
      if (target) {
        onChange(target.value);
        setOpen(false);
      }
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <label
        id={buttonId}
        className="block text-sm font-bold text-[var(--foreground)] mb-1.5"
      >
        {label}
      </label>

      <button
        type="button"
        disabled={disabled}
        aria-labelledby={buttonId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full min-h-[44px] flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-start border transition-transform duration-150 ease-out active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-[var(--surface-sunken)] border-[var(--border-subtle)] text-[var(--foreground-muted)]'
            : error
              ? 'bg-[var(--surface-card)] border-red-600 text-[var(--foreground)]'
              : open
                ? 'bg-[var(--surface-card)] border-[var(--primary)] text-[var(--foreground)] shadow-sm'
                : 'bg-[var(--surface-card)] border-[var(--border-medium)] hover:border-[var(--primary)] text-[var(--foreground)]'
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          <span className="font-semibold truncate">
            {selected ? selected.label : placeholder}
          </span>
          {selected?.badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground-muted)] font-mono shrink-0">
              {selected.badge}
            </span>
          )}
        </span>
        <ChevronDown
          size={18}
          strokeWidth={1.75}
          className={`shrink-0 text-[var(--foreground-muted)] transition-transform duration-150 ${
            open ? 'rotate-180 text-[var(--primary)]' : ''
          }`}
        />
      </button>

      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={buttonId}
          className="absolute z-50 mt-1.5 w-full max-h-72 overflow-y-auto rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] shadow-[var(--shadow-lg)] p-1.5 space-y-1"
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isHighlighted = idx === activeIndex;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex items-start justify-between gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[var(--primary-light)] text-[var(--primary)] font-bold'
                    : isHighlighted
                      ? 'bg-[var(--surface-sunken)] text-[var(--foreground)]'
                      : 'text-[var(--foreground)] hover:bg-[var(--surface-sunken)]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm flex items-center gap-2">
                    <span className="truncate">{opt.label}</span>
                    {opt.badge && (
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--foreground-muted)]">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  {opt.description && (
                    <div className="text-xs text-[var(--foreground-muted)] mt-0.5 leading-snug">
                      {opt.description}
                    </div>
                  )}
                </div>
                {isSelected && <Check size={16} className="shrink-0 mt-0.5 text-[var(--primary)]" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
