import { useState, useRef, useCallback, type FormEvent, type ChangeEvent, type ClipboardEvent } from 'react';
import { sanitizePlateInput, getValidationError } from '../validation';

interface PlateInputProps {
  onSearch: (plate: string) => void;
  isLoading: boolean;
}

export default function PlateInput({ onSearch, isLoading }: PlateInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizePlateInput(e.target.value);
    setValue(sanitized);
    if (error) setError(null);
  }, [error]);

  const handlePaste = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const sanitized = sanitizePlateInput(pasted);
    setValue(sanitized);
    if (error) setError(null);
  }, [error]);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (isLoading) return;

      const validationError = getValidationError(value);
      if (validationError) {
        setError(validationError);
        inputRef.current?.focus();
        return;
      }

      setError(null);
      onSearch(value);
    },
    [value, isLoading, onSearch]
  );

  return (
    <form className="plate-input-form" onSubmit={handleSubmit} id="plate-search-form">
      <div className="plate-input-wrapper">
        <div className={`plate-input-container ${error ? 'plate-input-error' : ''}`}>
          <div className="plate-il-strip" aria-hidden="true" style={{ background: 'transparent' }}>
            <span className="plate-il-flag">🇮🇱</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="plate-input"
            id="plate-input-field"
            value={value}
            onChange={handleChange}
            onPaste={handlePaste}
            placeholder="Enter plate number"
            maxLength={8}
            autoComplete="off"
            autoFocus
            aria-label="License plate number"
            aria-invalid={!!error}
            aria-describedby={error ? 'plate-input-error-msg' : undefined}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          className="search-button"
          id="search-submit-btn"
          disabled={isLoading || !value}
          aria-label="Search vehicle"
        >
          {isLoading ? (
            <span className="spinner" aria-hidden="true" />
          ) : (
            <svg className="search-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="2" />
              <path d="M13 13L17.5 17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
          {isLoading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {error && (
        <p className="input-error-message" id="plate-input-error-msg" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
