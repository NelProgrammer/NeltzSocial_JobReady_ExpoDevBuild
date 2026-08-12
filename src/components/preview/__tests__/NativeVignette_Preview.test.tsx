describe('NativeVignette Preview Data Formatting Unit Tests', () => {
    const stringifyField = (val: any): string => {
        if (!val) return '';
        if (Array.isArray(val)) {
            return val.map(item => {
                if (typeof item === 'object' && item !== null) {
                    return item.name || item.text || item.skill || '';
                }
                return String(item);
            }).filter(Boolean).join('\n');
        }
        return String(val);
    };

    test('stringifies array of objects into newline-separated text', () => {
        const input = [
            { id: 'sk_1', name: 'React Native' },
            { id: 'sk_2', name: 'Python FastAPI' }
        ];
        expect(stringifyField(input)).toBe('React Native\nPython FastAPI');
    });

    test('handles legacy plain string input gracefully without mutation', () => {
        const input = 'React Native\nPython FastAPI';
        expect(stringifyField(input)).toBe('React Native\nPython FastAPI');
    });

    test('returns empty string for null or undefined input', () => {
        expect(stringifyField(null)).toBe('');
        expect(stringifyField(undefined)).toBe('');
    });
});
