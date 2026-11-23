'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface ListboxOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  badge?: string;
  thumbnail?: string | null;
  searchKeywords?: string;
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
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  compact?: boolean;
  hideLabel?: boolean;
}

const INITIAL_RENDER_CAP = 90;

export function AccessibleListbox<T extends string = string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'انتخاب نمایید...',
  disabled = false,
  error,
  className = '',
  searchable = false,
  searchPlaceholder = 'جستجو در فهرست...',
  emptyText = 'موردی با این جستجو یافت نشد.',
  compact = false,
  hideLabel = false,
}: AccessibleListboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const buttonId = useId();
  const listboxId = useId();

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const hay = `${opt.label} ${opt.description || ''} ${opt.badge || ''} ${opt.searchKeywords || ''} ${opt.value}`.toLowerCase();
      return hay.includes(q);
    });
  }, [options, query]);

  const visibleOptions = useMemo(() => {
    if (showAll || query.trim().length > 0 || filteredOptions.length <= INITIAL_RENDER_CAP) {
      return filteredOptions;
    }
    return filteredOptions.slice(0, INITIAL_RENDER_CAP);
  }, [filteredOptions, showAll, query]);

  useEffect(() => {
    const idx = visibleOptions.findIndex((o) => o.value === value);
    setActiveIndex(idx >= 0 ? idx : 0);
  }, [value, visibleOptions]);

  useEffect(() => {
    if (open && searchable) {
      const timer = window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 20);
      return () => window.clearTimeout(timer);
    }
    if (!open) {
      setQuery('');
      setShowAll(false);
    }
  }, [open, searchable]);

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
    } else if (e.key === 'ArrowDown' && visibleOptions.length > 0) {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % visibleOptions.length);
    } else if (e.key === 'ArrowUp' && visibleOptions.length > 0) {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + visibleOptions.length) % visibleOptions.length);
    } else if (e.key === 'Home' && visibleOptions.length > 0) {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End' && visibleOptions.length > 0) {
      e.preventDefault();
      setActiveIndex(visibleOptions.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = visibleOptions[activeIndex];
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
        className={
          hideLabel
            ? 'sr-only'
            : compact
              ? 'block text-[10px] font-bold text-[var(--foreground-muted)] mb-1'
              : 'block text-xs sm:text-sm font-bold text-[var(--foreground)] mb-1.5'
        }
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
        className={`w-full flex items-center justify-between gap-2.5 rounded-xl text-start border transition-all duration-150 ease-out active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] cursor-pointer ${
          compact ? 'min-h-[38px] px-3 py-1.5 text-xs' : 'min-h-[44px] px-3.5 py-2 text-sm'
        } ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-[var(--surface-sunken)] border-[var(--border-subtle)] text-[var(--foreground-muted)]'
            : error
              ? 'bg-[var(--surface-card)] border-red-600 text-[var(--foreground)]'
              : open
                ? 'bg-[var(--surface-card)] border-[var(--primary)] text-[var(--foreground)] shadow-sm'
                : 'bg-[var(--surface-card)] border-[var(--border-medium)] hover:border-[var(--primary)] text-[var(--foreground)]'
        }`}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1">
          {selected?.thumbnail && (
            <img
              src={selected.thumbnail}
              alt=""
              className={`${compact ? 'w-6 h-6' : 'w-7 h-7'} rounded-md object-cover border border-[var(--border-subtle)] shrink-0`}
            />
          )}
          <span className="font-semibold truncate">
            {selected ? selected.label : placeholder}
          </span>
          {selected?.badge && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground-muted)] font-mono shrink-0">
              {selected.badge}
            </span>
          )}
        </span>
        <ChevronDown
          size={compact ? 15 : 18}
          strokeWidth={1.75}
          className={`shrink-0 text-[var(--foreground-muted)] transition-transform duration-150 ${
            open ? 'rotate-180 text-[var(--primary)]' : ''
          }`}
        />
      </button>

      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}

      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] shadow-[var(--shadow-lg)] overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-[var(--border-subtle)] bg-[var(--surface-sunken)]/70">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute top-1/2 -translate-y-1/2 start-3 text-[var(--foreground-muted)] pointer-events-none"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  className="w-full ps-8 pe-8 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="پاک کردن جستجو"
                    onClick={() => setQuery('')}
                    className="absolute top-1/2 -translate-y-1/2 end-2 p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--foreground-muted)] px-1">
                <span>تعداد موارد منطبق: {filteredOptions.length}</span>
                {options.length > INITIAL_RENDER_CAP && !query && !showAll && (
                  <span>نمایش {INITIAL_RENDER_CAP} مورد اول</span>
                )}
              </div>
            </div>
          )}

          <ul
            id={listboxId}
            role="listbox"
            aria-labelledby={buttonId}
            className="max-h-72 overflow-y-auto p-1.5 space-y-1"
          >
            {visibleOptions.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-[var(--foreground-muted)]">
                {emptyText}
              </li>
            ) : (
              visibleOptions.map((opt, idx) => {
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
                    className={`flex items-start justify-between gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[var(--primary-light)] text-[var(--primary)] font-bold'
                        : isHighlighted
                          ? 'bg-[var(--surface-sunken)] text-[var(--foreground)]'
                          : 'text-[var(--foreground)] hover:bg-[var(--surface-sunken)]'
                    }`}
                  >
                    {opt.thumbnail && (
                      <img
                        src={opt.thumbnail}
                        alt=""
                        loading="lazy"
                        className="w-9 h-9 rounded-md object-cover border border-[var(--border-subtle)] shrink-0 mt-0.5"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm flex items-center gap-2">
                        <span className="truncate">{opt.label}</span>
                        {opt.badge && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--foreground-muted)] shrink-0">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.description && (
                        <div className="text-[11px] text-[var(--foreground-muted)] mt-0.5 leading-snug line-clamp-2">
                          {opt.description}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check size={16} className="shrink-0 mt-0.5 text-[var(--primary)]" />}
                  </li>
                );
              })
            )}

            {!showAll && !query.trim() && filteredOptions.length > INITIAL_RENDER_CAP && (
              <li className="pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAll(true);
                  }}
                  className="w-full py-2 rounded-lg bg-[var(--surface-sunken)] hover:bg-[var(--primary-light)] text-xs font-bold text-[var(--primary)] cursor-pointer"
                >
                  نمایش همه ({filteredOptions.length - INITIAL_RENDER_CAP} مورد دیگر)
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
