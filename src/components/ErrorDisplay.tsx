import type { AppError } from '../types';

interface ErrorDisplayProps {
  error: AppError;
  onRetry?: () => void;
}

export default function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  const iconPath =
    error.type === 'NOT_FOUND'
      ? 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 002 0V6zm-1 8a1 1 0 100-2 1 1 0 000 2z'
      : 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z';

  return (
    <div className={`error-display ${error.type === 'NOT_FOUND' ? 'error-not-found' : 'error-failure'}`} id="error-display" role="alert">
      <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fillRule="evenodd" d={iconPath} clipRule="evenodd" />
      </svg>
      <p className="error-message">{error.message}</p>
      {error.retryable && onRetry && (
        <button className="retry-button" onClick={onRetry} id="retry-btn">
          <svg className="retry-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M4 4v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.5 12.5a6 6 0 105.22-8.45L4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Try Again
        </button>
      )}
    </div>
  );
}
