import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory, clearHistory, deleteHistoryRecord } from '../history';
import { getVehicleSummary, formatSearchTime } from '../display';
import { formatPlateDisplay } from '../validation';
import type { SearchHistoryEntry } from '../types';
import { Trash2, Calendar, X, MapPin, Maximize, Minimize } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = divIcon({
  className: 'custom-map-pin',
  html: `<div class="pin-marker"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

function MapBounds({ markers }: { markers: SearchHistoryEntry[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;
    const latLngs = markers.map(m => [m.location!.lat, m.location!.lng] as [number, number]);
    const bounds = L.latLngBounds(latLngs);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [map, markers]);

  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(map.getContainer());
    return () => resizeObserver.disconnect();
  }, [map]);
  return null;
}

function MapInteractionController({ isExpanded, isFullscreen }: { isExpanded: boolean; isFullscreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (isFullscreen) {
      map.scrollWheelZoom.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.dragging.enable();
    } else if (isExpanded) {
      map.scrollWheelZoom.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.dragging.disable();
    } else {
      map.scrollWheelZoom.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.dragging.enable();
    }
  }, [isExpanded, isFullscreen, map]);
  return null;
}

function MapFocusController({ command, markers }: { command: { id: string, t: number } | null, markers: SearchHistoryEntry[] }) {
  const map = useMap();
  useEffect(() => {
    if (!command) return;
    const entry = markers.find(m => m.id === command.id);
    if (entry?.location) {
      // Zoom out slightly for context before flying if we're too close, or just fly directly
      map.flyTo([entry.location.lat, entry.location.lng], 16, { animate: true, duration: 1.5 });
    }
  }, [command, markers, map]);
  return null;
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<SearchHistoryEntry[]>(() => getHistory());
  const [showConfirm, setShowConfirm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [focusCommand, setFocusCommand] = useState<{ id: string, t: number } | null>(null);
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});
  const navigate = useNavigate();

  const toggleMapFullscreen = useCallback(() => {
    setIsMapFullscreen(prev => {
      const next = !prev;
      document.body.style.overflow = next ? 'hidden' : '';
      // Dispatch resize event to let Leaflet know to invalidate size immediately
      setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Handle map expansion on scroll
  useEffect(() => {
    const handleScroll = () => {
      const listEl = document.getElementById('history-list');
      if (!listEl) return;
      
      const rect = listEl.getBoundingClientRect();
      const mapStickyTop = 70; // approx navbar height + 10px
      // Map base height is 40vh, min-height 250px.
      // We expand when the list overlaps the sticky map by 50px.
      const mapActualHeight = Math.max(window.innerHeight * 0.4, 250);
      const threshold = mapStickyTop + mapActualHeight - 50;
      
      if (rect.top < threshold) {
        setIsMapExpanded(true);
      } else {
        setIsMapExpanded(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filters
  const [filterMake, setFilterMake] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const handleClearAll = useCallback(() => {
    clearHistory();
    setEntries([]);
    setShowConfirm(false);
  }, []);

  const handleLookupAgain = useCallback((plate: string) => {
    navigate(`/?plate=${plate}`);
  }, [navigate]);

  const handleDelete = useCallback((id: string) => {
    deleteHistoryRecord(id);
    setEntries(getHistory());
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handlePinpoint = useCallback((id: string) => {
    setFocusCommand({ id, t: Date.now() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      markerRefs.current[id]?.openPopup();
    }, 1500);
  }, []);

  const handleScrollToCard = useCallback((id: string) => {
    const el = document.getElementById(`history-card-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setExpandedId(id);
    }
  }, []);

  const clearFilters = useCallback(() => {
    setFilterMake('');
    setFilterModel('');
    setFilterYear('');
    setFilterColor('');
    setFilterDate('');
  }, []);

  const availableMakes = useMemo(() => Array.from(new Set(entries.map(e => e.vehicleInfo?.manufacturer).filter(Boolean))).sort() as string[], [entries]);
  const availableModels = useMemo(() => {
    const filtered = filterMake ? entries.filter(e => e.vehicleInfo?.manufacturer === filterMake) : entries;
    const models = new Set<string>();
    filtered.forEach(e => {
      if (e.vehicleInfo?.commercialName) models.add(e.vehicleInfo.commercialName);
      else if (e.vehicleInfo?.model) models.add(e.vehicleInfo.model);
    });
    return Array.from(models).sort();
  }, [entries, filterMake]);
  const availableYears = useMemo(() => Array.from(new Set(entries.map(e => e.vehicleInfo?.year).filter(Boolean))).sort((a, b) => Number(b) - Number(a)) as number[], [entries]);
  const availableColors = useMemo(() => Array.from(new Set(entries.map(e => e.vehicleInfo?.color).filter(Boolean))).sort() as string[], [entries]);
  const availableDates = useMemo(() => {
    const datesMap = new Map<string, string>();
    entries.forEach(e => {
      const d = new Date(e.searchedAt);
      const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!datesMap.has(localDateStr)) {
        datesMap.set(localDateStr, d.toLocaleDateString());
      }
    });
    return Array.from(datesMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([value, label]) => ({ value, label }));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const v = entry.vehicleInfo;
      if (filterMake && v?.manufacturer !== filterMake) return false;
      if (filterModel && v?.commercialName !== filterModel && v?.model !== filterModel) return false;
      if (filterYear && v?.year?.toString() !== filterYear) return false;
      if (filterColor && v?.color !== filterColor) return false;
      if (filterDate) {
        const d = new Date(entry.searchedAt);
        const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (localDateStr !== filterDate) return false;
      }
      return true;
    });
  }, [entries, filterMake, filterModel, filterYear, filterColor, filterDate]);

  const mapMarkers = useMemo(() => filteredEntries.filter(e => e.location), [filteredEntries]);

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
          <button className="empty-action-button" onClick={() => navigate('/')}>
            Go to Vehicle Lookup
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page history-page" id="history-page">
      <div className="history-header" style={{ marginBottom: 0 }}>
        <h1 className="page-title" id="history-title">Search History</h1>
        <div className="history-actions">
          {showConfirm ? (
            <div className="confirm-clear" id="confirm-clear-dialog">
              <span className="confirm-text">Clear all?</span>
              <button className="confirm-yes-btn" onClick={handleClearAll}>Yes</button>
              <button className="confirm-no-btn" onClick={() => setShowConfirm(false)}>Cancel</button>
            </div>
          ) : (
            <button className="clear-history-btn" onClick={() => setShowConfirm(true)}>
              <Trash2 size={16} /> Clear All
            </button>
          )}
        </div>
      </div>

      <div className="history-pill-filters">
        <div className="pill-select-wrapper">
          <select className="pill-input" value={filterMake} onChange={e => { setFilterMake(e.target.value); setFilterModel(''); }}>
            <option value="">All Makes</option>
            {availableMakes.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>

        <div className="pill-select-wrapper">
          <select className="pill-input" value={filterModel} onChange={e => setFilterModel(e.target.value)} disabled={availableModels.length === 0}>
            <option value="">All Models</option>
            {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>

        <div className="pill-select-wrapper">
          <select className="pill-input" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option value="">All Years</option>
            {availableYears.map(y => <option key={y} value={y.toString()}>{y}</option>)}
          </select>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>

        <div className="pill-select-wrapper">
          <select className="pill-input" value={filterColor} onChange={e => setFilterColor(e.target.value)}>
            <option value="">All Colors</option>
            {availableColors.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>

        <div className="pill-select-wrapper">
          <select className="pill-input" value={filterDate} onChange={e => setFilterDate(e.target.value)}>
            <option value="">All Dates</option>
            {availableDates.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>

        {(filterMake || filterModel || filterYear || filterColor || filterDate) && (
          <button className="pill-input pill-btn-clear" onClick={clearFilters}>
            <X size={14} style={{ marginRight: 4 }} /> Clear Filters
          </button>
        )}
      </div>

      <div className="history-content-layout">
        <div className={`history-map-container ${isMapExpanded ? 'expanded' : ''} ${isMapFullscreen ? 'fullscreen-override' : ''}`}>
          <button 
            onClick={toggleMapFullscreen} 
            className="map-fullscreen-toggle glass-card"
            style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(128,128,128,0.2)' }}
            title={isMapFullscreen ? "Minimize Map" : "Expand Map Fullscreen"}
          >
            {isMapFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
          
          {mapMarkers.length > 0 ? (
            <MapContainer center={[31.0461, 34.8516]} zoom={8} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapBounds markers={mapMarkers} />
              <MapResizer />
              <MapInteractionController isExpanded={isMapExpanded} isFullscreen={isMapFullscreen} />
              <MapFocusController command={focusCommand} markers={mapMarkers} />
              {mapMarkers.map(entry => (
                <Marker 
                  key={entry.id} 
                  position={[entry.location!.lat, entry.location!.lng]} 
                  icon={customIcon}
                  ref={(r) => { markerRefs.current[entry.id] = r; }}
                >
                  <Popup className="vehicle-popup glass-popup">
                    <div className="popup-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '260px', padding: '12px 8px 8px 8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                        <span className="history-plate-badge" style={{ fontSize: '1.25rem', padding: '8px 20px', letterSpacing: '1px' }}>{formatPlateDisplay(entry.licensePlate)}</span>
                      </div>
                      
                      {entry.vehicleInfo && (
                        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontWeight: 600, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                            {entry.vehicleInfo.manufacturer} {entry.vehicleInfo.commercialName || entry.vehicleInfo.model}
                          </div>
                          {entry.vehicleInfo.year && (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                              <span style={{ opacity: 0.8 }}>Year:</span> {entry.vehicleInfo.year} <span style={{ opacity: 0.3, margin: '0 8px' }}>|</span> <span style={{ opacity: 0.8 }}>Color:</span> {entry.vehicleInfo.color}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: '0.9rem', borderTop: '1px solid var(--border-default)', paddingTop: '16px', marginTop: '4px' }}>
                        <Calendar size={15} />
                        <span>{new Date(entry.searchedAt).toLocaleDateString()}</span>
                      </div>

                      <div className="popup-actions" style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <button className="lookup-again-btn" onClick={() => handleLookupAgain(entry.licensePlate)} style={{ flex: 1, padding: '10px', fontSize: '0.95rem', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
                          Look Up
                        </button>
                        <button className="history-btn-map" onClick={() => {
                          if (isMapFullscreen) toggleMapFullscreen();
                          handleScrollToCard(entry.id);
                        }} style={{ flex: 1, padding: '10px', fontSize: '0.95rem', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
                          View Record
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              No locations available for the current filters.
            </div>
          )}
        </div>

        <div className="glass-history-list" id="history-list">
          {filteredEntries.map((entry) => (
            <div id={`history-card-${entry.id}`} key={entry.id} className={`history-entry glass-card ${expandedId === entry.id ? 'history-entry-expanded' : ''}`}>
              <button className="history-entry-header" onClick={() => toggleExpand(entry.id)}>
                <div className="history-entry-plate">
                  <span className="history-plate-badge">{formatPlateDisplay(entry.licensePlate)}</span>
                </div>
                <div className="history-entry-meta">
                  <span className="history-summary">{getVehicleSummary(entry.vehicleInfo)}</span>
                  <span className="history-time">{formatSearchTime(entry.searchedAt)}</span>
                </div>
                <svg className="history-chevron" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {expandedId === entry.id && entry.vehicleInfo && (
                <div className="history-entry-details">
                  <div className="history-detail-grid">
                    {entry.vehicleInfo.manufacturer && (
                      <div className="history-detail-item">
                        <span className="history-detail-label">Make</span>
                        <span className="history-detail-value">{entry.vehicleInfo.manufacturer}</span>
                      </div>
                    )}
                    {(entry.vehicleInfo.commercialName || entry.vehicleInfo.model) && (
                      <div className="history-detail-item">
                        <span className="history-detail-label">Model</span>
                        <span className="history-detail-value">{entry.vehicleInfo.commercialName || entry.vehicleInfo.model}</span>
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
                  </div>
                  <div className="history-actions-row">
                    <button className="lookup-again-btn" onClick={() => handleLookupAgain(entry.licensePlate)}>
                      Look Up Again
                    </button>
                    {entry.location && (
                      <button className="history-btn-map" onClick={() => handlePinpoint(entry.id)}>
                        <MapPin size={16} /> Pinpoint Location
                      </button>
                    )}
                    <button onClick={() => handleDelete(entry.id)} className="history-btn-delete">
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filteredEntries.length === 0 && entries.length > 0 && (
             <div className="empty-state" style={{ background: 'transparent', boxShadow: 'none' }}>
                <p>No records match your filters.</p>
             </div>
          )}
        </div>
      </div>
    </main>
  );
}
