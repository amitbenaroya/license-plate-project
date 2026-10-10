import type { VehicleInfo } from '../types';
import { displayValue, getVehicleTypeLabel, formatDate } from '../display';

interface VehicleResultsProps {
  vehicle: VehicleInfo;
}

interface InfoRowProps {
  label: string;
  value: string;
  id: string;
}

function InfoRow({ label, value, id }: InfoRowProps) {
  return (
    <div className="info-row" id={id}>
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  );
}

export default function VehicleResults({ vehicle }: VehicleResultsProps) {
  return (
    <div className="vehicle-results" id="vehicle-results">
      <div className="results-grid">
        <div className="results-section">
          <h2 className="section-title">Vehicle Details</h2>
          <div className="info-group">
            <InfoRow label="Manufacturer" value={displayValue(vehicle.manufacturer)} id="info-manufacturer" />
            <InfoRow label="Model" value={displayValue(vehicle.model)} id="info-model" />
            <InfoRow label="Commercial Name" value={displayValue(vehicle.commercialName)} id="info-commercial" />
            <InfoRow label="Year" value={displayValue(vehicle.year)} id="info-year" />
            <InfoRow label="Color" value={displayValue(vehicle.color)} id="info-color" />
            <InfoRow label="Fuel Type" value={displayValue(vehicle.fuelType)} id="info-fuel" />
            <InfoRow label="Vehicle Type" value={getVehicleTypeLabel(vehicle.vehicleType)} id="info-type" />
            <InfoRow label="Ownership" value={displayValue(vehicle.ownership)} id="info-ownership" />
          </div>
        </div>

        <div className="results-section">
          <h2 className="section-title">Technical Information</h2>
          <div className="info-group">
            <InfoRow label="Engine Model" value={displayValue(vehicle.engineModel)} id="info-engine" />
            <InfoRow label="Trim Level" value={displayValue(vehicle.trimLevel)} id="info-trim" />
            <InfoRow label="Safety Level" value={displayValue(vehicle.safetyLevel)} id="info-safety" />
            <InfoRow label="Pollution Group" value={displayValue(vehicle.pollutionGroup)} id="info-pollution" />
            <InfoRow label="Front Tires" value={displayValue(vehicle.frontTires)} id="info-front-tires" />
            <InfoRow label="Rear Tires" value={displayValue(vehicle.rearTires)} id="info-rear-tires" />
            <InfoRow label="Chassis" value={displayValue(vehicle.chassisNumber)} id="info-chassis" />
          </div>
        </div>

        <div className="results-section">
          <h2 className="section-title">Registration & Testing</h2>
          <div className="info-group">
            <InfoRow label="Last Road Test" value={formatDate(vehicle.lastTestDate)} id="info-last-test" />
            <InfoRow label="License Valid Until" value={formatDate(vehicle.licenseValidUntil)} id="info-license-valid" />
            <InfoRow label="On Road Since" value={displayValue(vehicle.onRoadSince)} id="info-on-road" />
          </div>
        </div>
      </div>
    </div>
  );
}
