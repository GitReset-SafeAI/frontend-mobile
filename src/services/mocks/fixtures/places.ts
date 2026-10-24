import type { PlaceSuggestion } from '../../contracts/places';

// Well-known public places used for journey planning during development.
// These are landmarks and transport stops, never incident locations, and the
// list is bundled so the planner works without a network connection.
export const demoPlaces: PlaceSuggestion[] = [
  { id: 'fort-station', name: 'Colombo Fort Railway Station', context: 'Fort, Colombo 01', coordinate: { latitude: 6.9335, longitude: 79.8507 } },
  { id: 'pettah-bus', name: 'Pettah Central Bus Stand', context: 'Pettah, Colombo 11', coordinate: { latitude: 6.9361, longitude: 79.8565 } },
  { id: 'galle-face', name: 'Galle Face Green', context: 'Colombo 03', coordinate: { latitude: 6.9271, longitude: 79.8425 } },
  { id: 'kollupitiya', name: 'Kollupitiya Railway Station', context: 'Colombo 03', coordinate: { latitude: 6.9108, longitude: 79.8489 } },
  { id: 'bambalapitiya', name: 'Bambalapitiya Railway Station', context: 'Colombo 04', coordinate: { latitude: 6.8905, longitude: 79.8565 } },
  { id: 'wellawatte', name: 'Wellawatte Railway Station', context: 'Colombo 06', coordinate: { latitude: 6.8732, longitude: 79.8606 } },
  { id: 'dehiwala', name: 'Dehiwala Railway Station', context: 'Dehiwala', coordinate: { latitude: 6.8519, longitude: 79.8653 } },
  { id: 'mount-lavinia', name: 'Mount Lavinia Railway Station', context: 'Mount Lavinia', coordinate: { latitude: 6.8389, longitude: 79.8653 } },
  { id: 'nugegoda', name: 'Nugegoda Junction', context: 'Nugegoda', coordinate: { latitude: 6.8649, longitude: 79.8997 } },
  { id: 'maharagama', name: 'Maharagama Bus Stand', context: 'Maharagama', coordinate: { latitude: 6.8481, longitude: 79.9265 } },
  { id: 'borella', name: 'Borella Junction', context: 'Colombo 08', coordinate: { latitude: 6.9157, longitude: 79.8777 } },
  { id: 'rajagiriya', name: 'Rajagiriya Junction', context: 'Rajagiriya', coordinate: { latitude: 6.9094, longitude: 79.8947 } },
  { id: 'battaramulla', name: 'Battaramulla Junction', context: 'Battaramulla', coordinate: { latitude: 6.8991, longitude: 79.9186 } },
  { id: 'kotahena', name: 'Kotahena', context: 'Colombo 13', coordinate: { latitude: 6.9442, longitude: 79.8631 } },
  { id: 'maradana', name: 'Maradana Railway Station', context: 'Colombo 10', coordinate: { latitude: 6.9293, longitude: 79.8653 } },
  { id: 'cinnamon-gardens', name: 'Cinnamon Gardens', context: 'Colombo 07', coordinate: { latitude: 6.9064, longitude: 79.8653 } },
  { id: 'university-colombo', name: 'University of Colombo', context: 'Colombo 03', coordinate: { latitude: 6.9018, longitude: 79.8607 } },
  { id: 'university-moratuwa', name: 'University of Moratuwa', context: 'Katubedda, Moratuwa', coordinate: { latitude: 6.7964, longitude: 79.9009 } },
  { id: 'university-kelaniya', name: 'University of Kelaniya', context: 'Dalugama, Kelaniya', coordinate: { latitude: 6.9747, longitude: 79.9164 } },
  { id: 'national-hospital', name: 'National Hospital of Sri Lanka', context: 'Colombo 10', coordinate: { latitude: 6.9178, longitude: 79.8656 } },
  { id: 'liberty-plaza', name: 'Liberty Plaza', context: 'Kollupitiya, Colombo 03', coordinate: { latitude: 6.9113, longitude: 79.8527 } },
  { id: 'majestic-city', name: 'Majestic City', context: 'Bambalapitiya, Colombo 04', coordinate: { latitude: 6.8938, longitude: 79.8552 } },
  { id: 'one-galle-face', name: 'One Galle Face Mall', context: 'Colombo 02', coordinate: { latitude: 6.9271, longitude: 79.8446 } },
  { id: 'kandy', name: 'Kandy Railway Station', context: 'Kandy', coordinate: { latitude: 7.2906, longitude: 80.6337 } },
  { id: 'peradeniya', name: 'University of Peradeniya', context: 'Peradeniya, Kandy', coordinate: { latitude: 7.2549, longitude: 80.5977 } },
  { id: 'negombo', name: 'Negombo Bus Stand', context: 'Negombo', coordinate: { latitude: 7.2095, longitude: 79.8386 } },
  { id: 'gampaha', name: 'Gampaha Railway Station', context: 'Gampaha', coordinate: { latitude: 7.0917, longitude: 79.9999 } },
  { id: 'kadawatha', name: 'Kadawatha Junction', context: 'Kadawatha', coordinate: { latitude: 7.0003, longitude: 79.9502 } },
  { id: 'kiribathgoda', name: 'Kiribathgoda', context: 'Kelaniya', coordinate: { latitude: 6.9789, longitude: 79.9289 } },
  { id: 'moratuwa', name: 'Moratuwa Railway Station', context: 'Moratuwa', coordinate: { latitude: 6.7731, longitude: 79.8816 } },
  { id: 'panadura', name: 'Panadura Railway Station', context: 'Panadura', coordinate: { latitude: 6.7132, longitude: 79.9026 } },
  { id: 'galle', name: 'Galle Railway Station', context: 'Galle', coordinate: { latitude: 6.0329, longitude: 80.2168 } },
  { id: 'matara', name: 'Matara Railway Station', context: 'Matara', coordinate: { latitude: 5.9485, longitude: 80.5353 } },
  { id: 'kurunegala', name: 'Kurunegala Bus Stand', context: 'Kurunegala', coordinate: { latitude: 7.4863, longitude: 80.3647 } },
  { id: 'anuradhapura', name: 'Anuradhapura Railway Station', context: 'Anuradhapura', coordinate: { latitude: 8.3345, longitude: 80.4037 } },
  { id: 'jaffna', name: 'Jaffna Bus Stand', context: 'Jaffna', coordinate: { latitude: 9.6615, longitude: 80.0255 } },
  { id: 'batticaloa', name: 'Batticaloa Bus Stand', context: 'Batticaloa', coordinate: { latitude: 7.7102, longitude: 81.6924 } },
  { id: 'ratnapura', name: 'Ratnapura Bus Stand', context: 'Ratnapura', coordinate: { latitude: 6.6828, longitude: 80.3992 } },
  { id: 'badulla', name: 'Badulla Railway Station', context: 'Badulla', coordinate: { latitude: 6.9895, longitude: 81.0557 } },
  { id: 'bia-airport', name: 'Bandaranaike International Airport', context: 'Katunayake', coordinate: { latitude: 7.1808, longitude: 79.8841 } },
];

// Accent- and case-insensitive prefix/substring match, ranked so a name match
// outranks an area match.
export function searchDemoPlaces(query: string, limit: number): PlaceSuggestion[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return [];

  return demoPlaces
    .map((place) => {
      const name = place.name.toLowerCase();
      const context = place.context.toLowerCase();
      if (name.startsWith(needle)) return { place, rank: 0 };
      if (name.includes(needle)) return { place, rank: 1 };
      if (context.includes(needle)) return { place, rank: 2 };
      return null;
    })
    .filter((match): match is { place: PlaceSuggestion; rank: number } => match !== null)
    .sort((a, b) => a.rank - b.rank || a.place.name.localeCompare(b.place.name))
    .slice(0, limit)
    .map((match) => match.place);
}
