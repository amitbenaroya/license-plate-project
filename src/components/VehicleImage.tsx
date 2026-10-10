import { useState, useEffect } from 'react';
import type { VehicleInfo } from '../types';

interface VehicleImageProps {
  vehicle: VehicleInfo;
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



export default function VehicleImage({ vehicle }: VehicleImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchImage() {
      setIsLoading(true);
      
      const manufacturerHebrew = vehicle.manufacturer?.trim() || '';
      
      let manufacturerEng = '';
      for (const [heb, eng] of Object.entries(MANUFACTURER_MAP)) {
        if (manufacturerHebrew.includes(heb)) {
          manufacturerEng = eng;
          break;
        }
      }

      const modelName = vehicle.commercialName?.trim() || vehicle.model?.trim() || '';

      console.log('Vehicle details for image search:', {
        manufacturerHebrew,
        manufacturerEng,
        modelName,
        commercialName: vehicle.commercialName,
        model: vehicle.model
      });

      // If we don't have enough English/Mapped info to search, give up gracefully
      if (!manufacturerEng || !modelName) {
        console.warn('Missing English manufacturer or model name, falling back.');
        if (isMounted) setIsLoading(false);
        return;
      }

      // Prevent duplicate manufacturer names (e.g., "Mazda MAZDA 3" -> "MAZDA 3")
      let searchQuery = `${manufacturerEng} ${modelName}`;
      if (modelName.toLowerCase().includes(manufacturerEng.toLowerCase())) {
        searchQuery = modelName;
      }
      searchQuery = searchQuery.replace(/\s+/g, ' ').trim();

      try {
        // Step 1: Search Wikidata for the exact car model entity
        const searchApiUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(searchQuery)}&language=en&format=json&origin=*`;
        const searchRes = await fetch(searchApiUrl);
        const searchData = await searchRes.json();

        if (searchData?.search?.length > 0) {
          // Find the most relevant entity (usually the first one)
          const entityId = searchData.search[0].id;
          
          // Step 2: Fetch the 'image' property (P18) for this entity
          const claimsApiUrl = `https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${entityId}&property=P18&format=json&origin=*`;
          const claimsRes = await fetch(claimsApiUrl);
          const claimsData = await claimsRes.json();

          const imageClaim = claimsData?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
          
          if (imageClaim && isMounted) {
            // Step 3: Construct the Commons URL using Special:FilePath with a fixed width
            const fileName = encodeURIComponent(imageClaim.replace(/ /g, '_'));
            const imgUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${fileName}?width=800`;
            console.log('Found Wikidata image URL:', imgUrl);
            setImageUrl(imgUrl);
            return;
          } else {
            console.log('No P18 image claim found for entity:', entityId);
          }
        } else {
          console.log('No Wikidata entities found for search:', searchQuery);
        }
      } catch (err) {
        console.error('Failed to fetch Wikidata image:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [vehicle.manufacturer, vehicle.commercialName, vehicle.model]);

  if (isLoading) {
    return (
      <div className="vehicle-image-container loading-image">
        <div className="image-skeleton"></div>
      </div>
    );
  }

  if (!imageUrl) {
    return null;
  }

  return (
    <div className="vehicle-image-container">
      <img 
        src={imageUrl} 
        alt={`${vehicle.manufacturer || ''} ${vehicle.commercialName || ''}`} 
        className="vehicle-image" 
        loading="lazy"
        onError={() => setImageUrl(null)}
      />
    </div>
  );
}
