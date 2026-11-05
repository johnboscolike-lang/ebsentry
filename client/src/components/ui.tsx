import type { ReactNode } from 'react';

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p className="field-error" role="alert">
      {children}
    </p>
  );
}

export function Note({ kind = 'info', children }: { kind?: 'info' | 'warn' | 'good'; children: ReactNode }) {
  return <p className={cx('note', kind)}>{children}</p>;
}

interface ChipOption {
  value: string;
  label: string;
  hint?: string;
  emoji?: string;
}

export function ChipRow({
  label,
  hint,
  error,
  options,
  value,
  values,
  onChange,
  onToggle,
  testId,
  optional = false,
}: {
  label: string;
  hint?: string;
  error?: string;
  options: ChipOption[];
  value?: string;
  values?: string[];
  onChange?: (value: string) => void;
  onToggle?: (value: string) => void;
  testId?: string;
  optional?: boolean;
}) {
  const multi = Boolean(onToggle);
  return (
    <fieldset className="field" data-testid={testId}>
      <legend>
        {label} {optional ? <em>선택</em> : <i className="req">*</i>}
      </legend>
      {hint && <p className="field-hint">{hint}</p>}
      <div className="wrap-chips" role={multi ? 'group' : 'radiogroup'} aria-label={label}>
        {options.map((option) => {
          const selected = multi ? values?.includes(option.value) : value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={cx('chip', selected && 'on')}
              role={multi ? undefined : 'radio'}
              aria-checked={multi ? undefined : selected}
              aria-pressed={multi ? selected : undefined}
              onClick={() => (multi ? onToggle?.(option.value) : onChange?.(option.value))}
            >
              {option.emoji && (
                <span aria-hidden="true" className="chip-emoji">
                  {option.emoji}
                </span>
              )}
              <span>{option.label}</span>
              {option.hint && <small>{option.hint}</small>}
            </button>
          );
        })}
      </div>
      <FieldError>{error}</FieldError>
    </fieldset>
  );
}

export function ChoiceGrid({
  label,
  hint,
  error,
  options,
  value,
  onChange,
  columns = 2,
}: {
  label: string;
  hint?: string;
  error?: string;
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  columns?: 1 | 2 | 3 | 4;
}) {
  return (
    <fieldset className="field">
      <legend>
        {label} <i className="req">*</i>
      </legend>
      {hint && <p className="field-hint">{hint}</p>}
      <div className={cx('choice-grid', `cols-${columns}`)} role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              data-testid={`choice-${option.value}`}
              className={cx('choice', selected && 'on')}
              onClick={() => onChange(option.value)}
            >
              {option.emoji && (
                <span className="choice-emoji" aria-hidden="true">
                  {option.emoji}
                </span>
              )}
              <span>{option.label}</span>
              {option.hint && <small>{option.hint}</small>}
            </button>
          );
        })}
      </div>
      <FieldError>{error}</FieldError>
    </fieldset>
  );
}

export function TextField({
  label,
  hint,
  error,
  value,
  onChange,
  placeholder,
  multiline = false,
  maxLength,
  testId,
  autoComplete,
  optional = false,
  inputMode,
}: {
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  testId?: string;
  autoComplete?: string;
  optional?: boolean;
  inputMode?: 'text' | 'numeric';
}) {
  const id = testId || label;
  return (
    <label className="field" htmlFor={id}>
      <span className="legend-like">
        {label} {optional ? <em>선택</em> : <i className="req">*</i>}
      </span>
      {hint && <span className="field-hint">{hint}</span>}
      {multiline ? (
        <textarea
          id={id}
          className="area-input"
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          data-testid={testId}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          id={id}
          className="text-input"
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          data-testid={testId}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      <FieldError>{error}</FieldError>
    </label>
  );
}
