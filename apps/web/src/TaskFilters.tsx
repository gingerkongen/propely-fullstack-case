import { useEffect, useRef, useState, type ReactNode } from 'react';

import type { FilterOptions, TaskFilter } from './types';

import { CATEGORY_LABELS, STATUS_LABELS } from './labels';

export const EMPTY_FILTER: TaskFilter = {
  statuses: [],
  categories: [],
  property_ids: [],
  created_from: null,
  created_to: null,
  due_from: null,
  due_to: null,
  cost_min: null,
  cost_max: null,
  q: null,
};

/** Adds the value if it is missing, removes it if it is there. */
function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** Button text for a list filter: the labels when there are one or two, otherwise a count. */
function summarizeList(labels: string[]): string | null {
  if (labels.length === 0) return null;
  return labels.length <= 2 ? labels.join(', ') : `${labels.length} valgt`;
}

/** Button text for a range filter, e.g. "fra 2024-01-01" or "100 – 5000 kr". */
function summarizeRange(from: string | number | null, to: string | number | null, unit = '') {
  if (from === null && to === null) return null;
  if (to === null) return `fra ${from}${unit}`;
  if (from === null) return `til ${to}${unit}`;
  return `${from} – ${to}${unit}`;
}

interface TaskFiltersProps {
  options: FilterOptions;
  filter: TaskFilter;
  onChange: (filter: TaskFilter) => void;
}

/** One dropdown per filter. The API ORs values within a filter and ANDs the filters together. */
export function TaskFilters({ options, filter, onChange }: TaskFiltersProps) {
  const update = (patch: Partial<TaskFilter>) => onChange({ ...filter, ...patch });
  const propertyNames = new Map(options.properties.map((p) => [p.id, p.name]));
  const isActive = Object.values(filter).some((value) =>
    Array.isArray(value) ? value.length > 0 : value !== null,
  );

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <input
        type="search"
        aria-label="Søk"
        placeholder="Søk i tittel og eiendom …"
        value={filter.q ?? ''}
        onChange={(event) => update({ q: event.target.value || null })}
        className="w-64 rounded border border-slate-300 bg-white px-3 py-1.5 text-sm"
      />

      <FilterDropdown
        label="Status"
        summary={summarizeList(filter.statuses.map((status) => STATUS_LABELS[status]))}
      >
        <CheckboxList
          options={options.statuses.map((status) => ({ value: status, label: STATUS_LABELS[status] }))}
          selected={filter.statuses}
          onChange={(statuses) => update({ statuses })}
        />
      </FilterDropdown>

      <FilterDropdown
        label="Kategori"
        summary={summarizeList(filter.categories.map((category) => CATEGORY_LABELS[category]))}
      >
        <CheckboxList
          options={options.categories.map((category) => ({ value: category, label: CATEGORY_LABELS[category] }))}
          selected={filter.categories}
          onChange={(categories) => update({ categories })}
        />
      </FilterDropdown>

      <FilterDropdown
        label="Eiendom"
        summary={summarizeList(filter.property_ids.map((id) => propertyNames.get(id) ?? id))}
        wide
      >
        <CheckboxList
          options={options.properties.map((property) => ({ value: property.id, label: property.name }))}
          selected={filter.property_ids}
          onChange={(property_ids) => update({ property_ids })}
        />
      </FilterDropdown>

      <FilterDropdown label="Opprettet" summary={summarizeRange(filter.created_from, filter.created_to)}>
        <DateRange
          from={filter.created_from}
          to={filter.created_to}
          onChange={(created_from, created_to) => update({ created_from, created_to })}
        />
      </FilterDropdown>

      <FilterDropdown label="Frist" summary={summarizeRange(filter.due_from, filter.due_to)}>
        <DateRange
          from={filter.due_from}
          to={filter.due_to}
          onChange={(due_from, due_to) => update({ due_from, due_to })}
        />
      </FilterDropdown>

      <FilterDropdown label="Kostnad" summary={summarizeRange(filter.cost_min, filter.cost_max, ' kr')}>
        <CostRange
          min={filter.cost_min}
          max={filter.cost_max}
          onChange={(cost_min, cost_max) => update({ cost_min, cost_max })}
        />
      </FilterDropdown>

      {isActive && (
        <button
          type="button"
          onClick={() => onChange(EMPTY_FILTER)}
          className="px-2 py-1.5 text-sm text-slate-600 underline hover:text-slate-900"
        >
          Nullstill filtre
        </button>
      )}
    </div>
  );
}

interface FilterDropdownProps {
  label: string;
  /** What is selected, shown on the button. null when the filter is off. */
  summary: string | null;
  wide?: boolean;
  children: ReactNode;
}

function FilterDropdown({ label, summary, wide = false, children }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on a click outside the dropdown, or on Escape.
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 rounded border px-3 py-1.5 text-sm ${
          summary
            ? 'border-slate-800 bg-slate-800 text-white'
            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
        }`}
      >
        <span className="max-w-64 truncate">{summary ? `${label}: ${summary}` : label}</span>
        <span aria-hidden="true" className="text-xs">
          ▾
        </span>
      </button>
      {open && (
        <div
          className={`absolute left-0 z-10 mt-1 max-w-[90vw] rounded border border-slate-200 bg-white p-2 shadow-lg ${
            wide ? 'w-96' : 'w-64'
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface CheckboxListProps<T extends string> {
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (selected: T[]) => void;
}

function CheckboxList<T extends string>({ options, selected, onChange }: CheckboxListProps<T>) {
  return (
    <div className="max-h-80 overflow-y-auto">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-start gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50"
        >
          <input
            type="checkbox"
            className="mt-0.5"
            checked={selected.includes(option.value)}
            onChange={() => onChange(toggle(selected, option.value))}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

const inputClass = 'rounded border border-slate-300 px-2 py-1';

interface DateRangeProps {
  from: string | null;
  to: string | null;
  onChange: (from: string | null, to: string | null) => void;
}

function DateRange({ from, to, onChange }: DateRangeProps) {
  // A cleared date input reports '', which means no bound. min/max keep the range the right way round.
  return (
    <div className="space-y-2 text-sm">
      <label className="flex items-center justify-between gap-3">
        Fra
        <input
          type="date"
          className={inputClass}
          value={from ?? ''}
          max={to ?? undefined}
          onChange={(event) => onChange(event.target.value || null, to)}
        />
      </label>
      <label className="flex items-center justify-between gap-3">
        Til
        <input
          type="date"
          className={inputClass}
          value={to ?? ''}
          min={from ?? undefined}
          onChange={(event) => onChange(from, event.target.value || null)}
        />
      </label>
    </div>
  );
}

/** '' (cleared) means no bound; anything else becomes whole, non-negative kroner. */
const parseKroner = (raw: string) => (raw === '' ? null : Math.max(0, Math.round(Number(raw))));

interface CostRangeProps {
  min: number | null;
  max: number | null;
  onChange: (min: number | null, max: number | null) => void;
}

function CostRange({ min, max, onChange }: CostRangeProps) {
  return (
    <div className="space-y-2 text-sm">
      <label className="flex items-center justify-between gap-3">
        Min (kr)
        <input
          type="number"
          min={0}
          step={100}
          className={`${inputClass} w-32 text-right`}
          value={min ?? ''}
          onChange={(event) => onChange(parseKroner(event.target.value), max)}
        />
      </label>
      <label className="flex items-center justify-between gap-3">
        Maks (kr)
        <input
          type="number"
          min={0}
          step={100}
          className={`${inputClass} w-32 text-right`}
          value={max ?? ''}
          onChange={(event) => onChange(min, parseKroner(event.target.value))}
        />
      </label>
    </div>
  );
}
