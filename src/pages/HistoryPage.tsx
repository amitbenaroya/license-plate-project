import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory, clearHistory } from '../history';
import { getVehicleSummary, formatSearchTime } from '../display';
import { formatPlateDisplay } from '../validation';
import type { SearchHistoryEntry } from '../types';

export default function HistoryPage() {
  const [entries, setEntries] = useState<SearchHistoryEntry[]>(() => getHistory());
  const [showConfirm, setShowConfirm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleClearAll = useCallback(() => {
    clearHistory();
    setEntries([]);
    setShowConfirm(false);
  }, []);

  const handleLookupAgain = useCallback(
    (plate: string) => {
      navigate(`/?plate=${plate}`);
    },
    [navigate]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  if (entries.length === 0) {
    return (
      <main className="page history-page" id="history-page">
        <div className="history-header">
          <h1 className="page-title" id="history-title">Search History</h1>
        </div>
        <div className="empty-state" id="history-empty-state">
          <svg className="empty-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <path d="M24 14V26L30 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          </svg>
          <h2 className="empty-title">No search history yet</h2>
          <p className="empty-description">
            Your vehicle lookups will appear here. Start by searching for a license plate.
          </p>
          <button
            className="empty-action-button"
            onClick={() => navigate('/')}
            id="go-to-lookup-btn"
          >
            Go to Vehicle Lookup
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page history-page" id="history-page">
      <div className="history-header">
        <h1 className="page-title" id="history-title">Search History</h1>
        <div className="history-actions">
          {showConfirm ? (
            <div className="confirm-clear" id="confirm-clear-dialog">
              <span className="confirm-text">Clear all history?</span>
              <button
                className="confirm-yes-btn"
                onClick={handleClearAll}
                id="confirm-clear-btn"
              >
                Yes, Clear
              </button>
              <button
                className="confirm-no-btn"
                onClick={() => setShowConfirm(false)}
                id="cancel-clear-btn"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="clear-history-btn"
              onClick={() => setShowConfirm(true)}
              id="clear-history-btn"
            >
              <svg className="clear-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M5 5h10M8 5V3h4v2M6 5v11a1 1 0 001 1h6a1 1 0 001-1V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="history-list" id="history-list">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`history-entry ${expandedId === entry.id ? 'history-entry-expanded' : ''}`}
            id={`history-entry-${entry.licensePlate}`}
          >
            <button
              className="history-entry-header"
              onClick={() => toggleExpand(entry.id)}
              aria-expanded={expandedId === entry.id}
            >
              <div className="history-entry-plate">
                <span className="history-plate-badge">
                  {formatPlateDisplay(entry.licensePlate)}
                </span>
              </div>
              <div className="history-entry-meta">
                <span className="history-summary">{getVehicleSummary(entry.vehicleInfo)}</span>
                <span className="history-time">{formatSearchTime(entry.searchedAt)}</span>
              </div>
              <svg className="history-chevron" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {expandedId === entry.id && entry.vehicleInfo && (
              <div className="history-entry-details">
                <div className="history-detail-grid">
                  {entry.vehicleInfo.manufacturer && (
                    <div className="history-detail-item">
                      <span className="history-detail-label">Manufacturer</span>
                      <span className="history-detail-value">{entry.vehicleInfo.manufacturer}</span>
                    </div>
                  )}
                  {entry.vehicleInfo.commercialName && (
                    <div className="history-detail-item">
                      <span className="history-detail-label">Model</span>
                      <span className="history-detail-value">{entry.vehicleInfo.commercialName}</span>
                    </div>
                  )}
                  {entry.vehicleInfo.year && (
                    <div className="history-detail-item">
                      <span className="history-detail-label">Year</span>
                      <span className="history-detail-value">{entry.vehicleInfo.year}</span>
                    </div>
                  )}
                  {entry.vehicleInfo.color && (
                    <div className="history-detail-item">
                      <span className="history-detail-label">Color</span>
                      <span className="history-detail-value">{entry.vehicleInfo.color}</span>
                    </div>
                  )}
                  {entry.vehicleInfo.fuelType && (
                    <div className="history-detail-item">
                      <span className="history-detail-label">Fuel</span>
                      <span className="history-detail-value">{entry.vehicleInfo.fuelType}</span>
                    </div>
                  )}
                  {entry.vehicleInfo.ownership && (
                    <div className="history-detail-item">
                      <span className="history-detail-label">Ownership</span>
                      <span className="history-detail-value">{entry.vehicleInfo.ownership}</span>
                    </div>
                  )}
                </div>
                <button
                  className="lookup-again-btn"
                  onClick={() => handleLookupAgain(entry.licensePlate)}
                  id={`lookup-again-${entry.licensePlate}`}
                >
                  <svg className="lookup-again-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M13 13L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  Look Up Again
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
