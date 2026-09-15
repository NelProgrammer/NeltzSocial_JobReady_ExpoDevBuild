import placesData from '../../assets/data/south_africa_places.json';

export interface SAPlace {
    province: string;
    city: string;
    suburb: string;
    postalCode: string;
    boxCode?: string | null;
    streetCode?: string | null;
}

const allPlaces: SAPlace[] = (placesData.places || []) as SAPlace[];

// Fast O(1) in-memory index for postal code lookups
const postalCodeMap = new Map<string, SAPlace[]>();

// Populate index once at module load
for (const place of allPlaces) {
    const code = place.postalCode;
    if (code) {
        const existing = postalCodeMap.get(code);
        if (existing) {
            existing.push(place);
        } else {
            postalCodeMap.set(code, [place]);
        }
    }

    // Also index boxCode if distinct
    if (place.boxCode && place.boxCode !== code) {
        const existingBox = postalCodeMap.get(place.boxCode);
        if (existingBox) {
            existingBox.push(place);
        } else {
            postalCodeMap.set(place.boxCode, [place]);
        }
    }

    // Also index streetCode if distinct
    if (place.streetCode && place.streetCode !== code) {
        const existingStr = postalCodeMap.get(place.streetCode);
        if (existingStr) {
            existingStr.push(place);
        } else {
            postalCodeMap.set(place.streetCode, [place]);
        }
    }
}

/**
 * Retrieve all South African places matching a given 4-digit postal code.
 * 100% offline; queries bundled local memory.
 */
export function getPlacesByPostalCode(code: string): SAPlace[] {
    if (!code) return [];
    const normalized = code.trim().padStart(4, '0');
    return postalCodeMap.get(normalized) || [];
}

/**
 * Retrieve the single primary place matching a given 4-digit postal code.
 */
export function getPrimaryPlaceForCode(code: string): SAPlace | undefined {
    const matches = getPlacesByPostalCode(code);
    return matches.length > 0 ? matches[0] : undefined;
}

/**
 * Search places strictly by suburb / place name.
 * Ideal when typing into the Suburb / Township input.
 */
export function searchBySuburb(query: string, limit: number = 6): SAPlace[] {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim().toLowerCase();

    const exactPrefix: SAPlace[] = [];
    const partial: SAPlace[] = [];

    for (const place of allPlaces) {
        const sub = place.suburb.toLowerCase();
        if (sub.startsWith(q)) {
            exactPrefix.push(place);
        } else if (sub.includes(q)) {
            partial.push(place);
        }
        if (exactPrefix.length + partial.length >= limit * 2) break;
    }
    return [...exactPrefix, ...partial].slice(0, limit);
}

/**
 * Search places strictly by city / town name.
 * Drills down to matching suburbs/places and their respective postal codes for that city.
 */
export function searchByCity(query: string, limit: number = 6): SAPlace[] {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim().toLowerCase();

    const exactPrefix: SAPlace[] = [];
    const partial: SAPlace[] = [];

    for (const place of allPlaces) {
        const city = place.city.toLowerCase();
        if (city.startsWith(q)) {
            exactPrefix.push(place);
        } else if (city.includes(q)) {
            partial.push(place);
        }
        if (exactPrefix.length + partial.length >= limit * 2) break;
    }
    return [...exactPrefix, ...partial].slice(0, limit);
}

/**
 * Search South African places by place name, city name, or postal code substring.
 * Returns up to `limit` results (default 6).
 * 100% offline.
 */
export function searchPlaces(query: string, limit: number = 6): SAPlace[] {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim().toLowerCase();

    const exactSuburb: SAPlace[] = [];
    const partialSuburb: SAPlace[] = [];
    const cityMatches: SAPlace[] = [];

    for (const place of allPlaces) {
        const sub = place.suburb.toLowerCase();
        const city = place.city.toLowerCase();

        if (sub.startsWith(q)) {
            exactSuburb.push(place);
        } else if (sub.includes(q)) {
            partialSuburb.push(place);
        } else if (city.includes(q) || place.postalCode.includes(q)) {
            cityMatches.push(place);
        }

        if (exactSuburb.length + partialSuburb.length + cityMatches.length >= limit * 3) {
            break;
        }
    }

    return [...exactSuburb, ...partialSuburb, ...cityMatches].slice(0, limit);
}

export default {
    getPlacesByPostalCode,
    getPrimaryPlaceForCode,
    searchBySuburb,
    searchByCity,
    searchPlaces,
    allPlaces
};
