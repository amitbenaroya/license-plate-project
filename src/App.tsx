import { HashRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import Navbar from './components/Navbar';
import HistoryPage from './pages/HistoryPage';
import { useEffect, useCallback, useState, useRef } from 'react';
import PlateInput from './components/PlateInput';
import VehicleResults from './components/VehicleResults';
import ErrorDisplay from './components/ErrorDisplay';
import { lookupVehicle } from './api';
import { addToHistory } from './history';
import type { VehicleInfo, AppError } from './types';

/**
 * Wrapper for LookupPage that handles ?plate= query param from history navigation
 */
function LookupPageWithQuery() {
// ... keeping existing state and functions but replacing the render
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSearchedPlate, setLastSearchedPlate] = useState<string>('');
  const [historyId, setHistoryId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const initialPlateHandled = useRef(false);

  const handleSearch = useCallback(async (plate: string) => {
    if (isLoading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setVehicle(null);
    setLastSearchedPlate(plate);
    setHistoryId(null);

    // Clear query param after using it
    if (searchParams.has('plate')) {
      setSearchParams({}, { replace: true });
    }

    try {
      const result = await lookupVehicle(plate, controller.signal);
      setVehicle(result);
      const newHistoryId = addToHistory(plate, result, true);
      setHistoryId(newHistoryId);
    } catch (err) {
      const appError = err as AppError;
      setError(appError);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [isLoading, searchParams, setSearchParams]);

  const handleRetry = useCallback(() => {
    if (lastSearchedPlate) {
      handleSearch(lastSearchedPlate);
    }
  }, [lastSearchedPlate, handleSearch]);

  // Handle ?plate= query param from history page navigation
  useEffect(() => {
    const plate = searchParams.get('plate');
    if (plate && !initialPlateHandled.current) {
      initialPlateHandled.current = true;
      handleSearch(plate);
    }
  }, [searchParams, handleSearch]);

  return (
    <main className="page lookup-page" id="lookup-page">
      <div className="lookup-hero">
        <h1 className="lookup-title" id="lookup-title">
          Israeli Vehicle Lookup
        </h1>
        <p className="lookup-subtitle">
          Search by license plate number to view vehicle details from the official Israeli government registry.
        </p>

        <PlateInput onSearch={handleSearch} isLoading={isLoading} initialValue={lastSearchedPlate} />
      </div>

      <div className="lookup-results-area" id="lookup-results-area">
        {isLoading && (
          <div className="loading-state" id="loading-indicator">
            <div className="loading-spinner" aria-hidden="true" />
            <p className="loading-text">Searching the registry…</p>
          </div>
        )}

        {error && !isLoading && (
          <ErrorDisplay error={error} onRetry={error.retryable ? handleRetry : undefined} />
        )}

        {vehicle && !isLoading && !error && (
          <VehicleResults vehicle={vehicle} historyId={historyId} />
        )}
      </div>
    </main>
  );
}

function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <div className="app" id="app">
          <Navbar />
          <Routes>
            <Route path="/" element={<LookupPageWithQuery />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </div>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;
