import { getPlacesByPostalCode, getPrimaryPlaceForCode, searchPlaces } from '../postalCodeLookup';

describe('postalCodeLookup offline utility', () => {
    test('resolves Johannesburg Central postal code 2001', () => {
        const places = getPlacesByPostalCode('2001');
        expect(places.length).toBeGreaterThan(0);
        expect(places.some(p => p.province === 'Gauteng')).toBe(true);
    });

    test('resolves Cape Town Central postal code 8001', () => {
        const place = getPrimaryPlaceForCode('8001');
        expect(place).toBeDefined();
        expect(place?.province).toBe('Western Cape');
        expect(place?.city.toLowerCase()).toContain('cape town');
    });

    test('resolves Durban Central postal code 4001', () => {
        const place = getPrimaryPlaceForCode('4001');
        expect(place).toBeDefined();
        expect(place?.province).toBe('KwaZulu-Natal');
    });

    test('resolves Pretoria Central postal code 0002 with zero-padding', () => {
        const place = getPrimaryPlaceForCode('0002');
        expect(place).toBeDefined();
        expect(place?.province).toBe('Gauteng');
    });

    test('searches places by partial name', () => {
        const results = searchPlaces('Sandton', 5);
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].suburb.toLowerCase()).toContain('sandton');
        expect(results[0].postalCode).toBeDefined();
    });

    test('returns empty array for invalid or short queries', () => {
        expect(getPlacesByPostalCode('')).toEqual([]);
        expect(searchPlaces('a')).toEqual([]);
        expect(getPlacesByPostalCode('999999')).toEqual([]);
    });
});
