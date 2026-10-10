import { useState, useEffect } from 'react';
import type { VehicleInfo } from '../types';
import { ExternalLink, MapPin } from 'lucide-react';
import { updateHistoryLocation } from '../history';

interface VehicleImageProps {
  vehicle: VehicleInfo;
  historyId?: string | null;
}

// Map common Hebrew manufacturer names to English for Wikipedia search
const MANUFACTURER_MAP: Record<string, string> = {
  "טויוטה": "Toyota",
  "יונדאי": "Hyundai",
  "קיה": "Kia",
  "סקודה": "Skoda",
  "מאזדה": "Mazda",
  "מיצובישי": "Mitsubishi",
  "ניסאן": "Nissan",
  "ניסן": "Nissan",
  "סוזוקי": "Suzuki",
  "רנו": "Renault",
  "פיג'ו": "Peugeot",
  "סיטרואן": "Citroen",
  "שברולט": "Chevrolet",
  "פולקסווגן": "Volkswagen",
  "הונדה": "Honda",
  "סובארו": "Subaru",
  "פורד": "Ford",
  "אאודי": "Audi",
  "ב.מ.וו": "BMW",
  "מרצדס": "Mercedes-Benz",
  "מרצדס-בנץ": "Mercedes-Benz",
  "סיאט": "SEAT",
  "פיאט": "Fiat",
  "אופל": "Opel",
  "לקסוס": "Lexus",
  "וולוו": "Volvo",
  "דאצ'יה": "Dacia",
  "סוזוקי מכשירי תנועה": "Suzuki",
  "טסלה": "Tesla",
  "אמ.ג'י": "MG",
  "אם.ג'י.": "MG",
  "צ'רי": "Chery",
  "בי.וי.די": "BYD",
  "גיפ": "Jeep",
  "ג'יפ": "Jeep",
  "לנד רובר": "Land Rover",
  "אלפא רומיאו": "Alfa Romeo",
  "פורשה": "Porsche",
};



export default function VehicleImage({ vehicle, historyId }: VehicleImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [wikiUrl, setWikiUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);

  const handleSaveLocation = () => {
    if (!historyId || !('geolocation' in navigator)) return;
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateHistoryLocation(historyId, {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setIsLocating(false);
        setLocationSaved(true);
      },
      (error) => {
        console.warn('Geolocation failed or denied:', error);
        setIsLocating(false);
        alert('Failed to get location. Please ensure location permissions are granted.');
      },
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
    );
  };

  // Compute English manufacturer and model outside useEffect for the title
  const manufacturerHebrew = vehicle.manufacturer?.trim() || '';
  let manufacturerEng = '';
  for (const [heb, eng] of Object.entries(MANUFACTURER_MAP)) {
    if (manufacturerHebrew.includes(heb)) {
      manufacturerEng = eng;
      break;
    }
  }
  const modelName = vehicle.commercialName?.trim() || vehicle.model?.trim() || '';
  
  // Create a clean English/Hebrew title depending on what's available
  const displayManufacturer = manufacturerEng || manufacturerHebrew;
  // Dedup manufacturer from model name if needed (e.g. Mazda Mazda 3)
  const cleanModelName = modelName.toLowerCase().includes(displayManufacturer.toLowerCase()) 
    ? modelName 
    : `${displayManufacturer} ${modelName}`;
  const carTitle = `${cleanModelName} ${vehicle.year || ''}`.trim();

  useEffect(() => {
    let isMounted = true;

    async function fetchImageAndDesc() {
      setIsLoading(true);
      
      if (!manufacturerEng || !modelName) {
        if (isMounted) setIsLoading(false);
        return;
      }

      let searchQuery = `${manufacturerEng} ${modelName}`;
      if (modelName.toLowerCase().includes(manufacturerEng.toLowerCase())) {
        searchQuery = modelName;
      }
      searchQuery = searchQuery.replace(/\s+/g, ' ').trim();

      try {
        const searchApiUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(searchQuery)}&language=en&format=json&origin=*`;
        const searchRes = await fetch(searchApiUrl);
        const searchData = await searchRes.json();

        if (searchData?.search?.length > 0) {
          const entityId = searchData.search[0].id;
          
          const detailsApiUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=claims|sitelinks&sitefilter=enwiki&format=json&origin=*`;
          const detailsRes = await fetch(detailsApiUrl);
          const detailsData = await detailsRes.json();
          const entity = detailsData?.entities?.[entityId];

          if (entity) {
            const imageClaim = entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
            if (imageClaim && isMounted) {
              const fileName = encodeURIComponent(imageClaim.replace(/ /g, '_'));
              setImageUrl(`https://commons.wikimedia.org/wiki/Special:FilePath/${fileName}?width=800`);
            }

            const wikiTitle = entity.sitelinks?.enwiki?.title;
            if (wikiTitle && isMounted) {
              setWikiUrl(`https://en.wikipedia.org/wiki/${encodeURIComponent(wikiTitle.replace(/ /g, '_'))}`);
              try {
                const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`);
                const summaryData = await summaryRes.json();
                if (summaryData?.extract && isMounted) {
                  const text = summaryData.extract;
                  const shortText = text.length > 250 ? text.substring(0, 247) + '...' : text;
                  setDescription(shortText);
                }
              } catch (e) {
                console.error('Failed to fetch Wikipedia summary', e);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch Wikidata:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchImageAndDesc();

    return () => {
      isMounted = false;
    };
  }, [manufacturerEng, modelName, vehicle.year]);

  if (isLoading) {
    return (
      <div className="vehicle-image-container loading-image">
        <div className="image-skeleton"></div>
      </div>
    );
  }

  console.log('VehicleImage render state:', { 
    hasImageUrl: !!imageUrl, 
    hasDescription: !!description, 
    hasWikiUrl: !!wikiUrl,
    wikiUrl
  });

  if (!imageUrl && !description && !carTitle) {
    return null;
  }

  return (
    <>
      {imageUrl && (
        <div className="vehicle-image-container">
          <img 
            src={imageUrl} 
            alt={carTitle} 
            className="vehicle-image" 
            loading="lazy"
            onError={() => setImageUrl(null)}
          />
        </div>
      )}
      
      {(description || carTitle) && (
        <div className="vehicle-description-card detail-section">
          {carTitle && <h2 className="vehicle-title">{carTitle}</h2>}
          {description && <p className="vehicle-description-text">{description}</p>}
          <div className="vehicle-actions-row">
            {(imageUrl && description && wikiUrl) && (
              <a href={wikiUrl} target="_blank" rel="noopener noreferrer" className="wiki-link-button">
                Wikipedia
                <ExternalLink size={16} />
              </a>
            )}
            {historyId && !locationSaved && (
              <button 
                onClick={handleSaveLocation} 
                disabled={isLocating}
                className="save-location-button wiki-link-button"
              >
                {isLocating ? 'Saving...' : 'Save Location'}
                <MapPin size={16} className={isLocating ? 'animate-pulse' : ''} />
              </button>
            )}
            {locationSaved && (
              <span className="location-saved-text" style={{ fontSize: 'var(--text-xs)', color: 'var(--success)' }}>
                Location Saved!
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
