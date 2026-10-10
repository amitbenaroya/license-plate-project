import { useState } from 'react';
import type { VehicleInfo } from '../types';
import { displayValue, getVehicleTypeLabel, formatDate } from '../display';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface VehicleResultsProps {
  vehicle: VehicleInfo;
}

interface SpecCardProps {
  label: string;
  value: string | null;
  hint?: string;
}

function SpecCard({ label, value, hint }: SpecCardProps) {
  const [showHint, setShowHint] = useState(false);
  const displayVal = value ? value : 'Not available';
  const isMissing = !value;

  return (
    <div className={`spec-card ${isMissing ? 'spec-missing' : ''}`}>
      <div className="spec-label-row">
        <span className="spec-label">{label}</span>
        {hint && (
          <button 
            className="spec-hint-btn" 
            onClick={() => setShowHint(!showHint)}
            title="More info"
            aria-label="More information"
          >
            <Info size={14} />
          </button>
        )}
      </div>
      <span className="spec-value">{displayVal}</span>
      {showHint && <div className="spec-hint-text">{hint}</div>}
    </div>
  );
}

interface SectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

function ExpandableSection({ title, defaultExpanded = false, children }: SectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={`detail-section ${expanded ? 'expanded' : ''}`}>
      <button 
        className="section-header" 
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <h3 className="section-title">{title}</h3>
        <div className="section-toggle">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      {expanded && (
        <div className="section-content">
          <div className="spec-grid">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VehicleResults({ vehicle }: VehicleResultsProps) {
  return (
    <div className="vehicle-results" id="vehicle-results">
      <div className="sections-container">
        <ExpandableSection title="Overview" defaultExpanded={true}>
          <SpecCard label="Manufacturer" value={displayValue(vehicle.manufacturer)} />
          <SpecCard label="Model" value={displayValue(vehicle.model)} />
          <SpecCard label="Commercial Name" value={displayValue(vehicle.commercialName)} />
          <SpecCard label="Model Year" value={displayValue(vehicle.year)} />
          <SpecCard label="Trim / Designation" value={displayValue(vehicle.trimLevel)} />
        </ExpandableSection>

        <ExpandableSection title="Registration Details">
          <SpecCard label="Vehicle Type" value={getVehicleTypeLabel(vehicle.vehicleType)} />
          <SpecCard label="Ownership" value={displayValue(vehicle.ownership)} hint="Private, Commercial, Leasing, etc." />
          <SpecCard label="On Road Since" value={formatDate(vehicle.onRoadSince)} />
          <SpecCard label="License Valid Until" value={formatDate(vehicle.licenseValidUntil)} />
          <SpecCard label="Chassis Number" value={displayValue(vehicle.chassisNumber)} />
        </ExpandableSection>

        <ExpandableSection title="Technical & Physical">
          <SpecCard label="Engine Model" value={displayValue(vehicle.engineModel)} />
          <SpecCard label="Fuel Type" value={displayValue(vehicle.fuelType)} />
          <SpecCard label="Color" value={displayValue(vehicle.color)} />
          <SpecCard label="Front Tires" value={displayValue(vehicle.frontTires)} />
          <SpecCard label="Rear Tires" value={displayValue(vehicle.rearTires)} />
        </ExpandableSection>

        <ExpandableSection title="Environment & Safety">
          <SpecCard label="Last Inspection" value={formatDate(vehicle.lastTestDate)} />
          <SpecCard label="Safety Level" value={displayValue(vehicle.safetyLevel)} hint="Safety equipment score (0-8)" />
          <SpecCard label="Pollution Group" value={displayValue(vehicle.pollutionGroup)} hint="Green rating (1-15, 1 is best)" />
        </ExpandableSection>
      </div>
    </div>
  );
}
