export interface SkillItem {
    id: string;
    name: string;
    proficiency?: string;
    category?: string;
}

export interface ResumeSkills {
    Tech?: SkillItem[] | string;
    Soft?: SkillItem[] | string;
    Certifications?: SkillItem[] | string;
    NonAcadCerts?: SkillItem[] | string;
    SystemsUsed?: SkillItem[] | string;
}

// Pure logic unit test suite for Skills data normalization & state transformations
describe('Skills Data Normalization Unit & Integration Logic Tests', () => {
    const getSkillItems = (skills: ResumeSkills, field: keyof ResumeSkills): SkillItem[] => {
        const raw = skills[field];
        if (Array.isArray(raw)) return raw as SkillItem[];
        if (typeof raw === 'string' && raw.trim().length > 0) {
            return raw.split('\n').filter(line => line.trim().length > 0).map((line, idx) => ({
                id: `sk_${String(field).toLowerCase()}_${idx}`,
                name: line.replace(/^-\s*/, '').trim(),
                proficiency: 'Intermediate'
            }));
        }
        return [];
    };

    test('normalizes multi-item array skills directly', () => {
        const skills: ResumeSkills = {
            Tech: [
                { id: 'sk_1', name: 'React Native', proficiency: 'Expert' },
                { id: 'sk_2', name: 'Python FastAPI', proficiency: 'Advanced' }
            ]
        };
        const items = getSkillItems(skills, 'Tech');
        expect(items.length).toBe(2);
        expect(items[0].name).toBe('React Native');
        expect(items[1].name).toBe('Python FastAPI');
    });

    test('parses legacy string bullet list skills into structured SkillItems', () => {
        const skills: ResumeSkills = {
            Soft: '- Leadership\n- Team Management\n- Conflict Resolution'
        };
        const items = getSkillItems(skills, 'Soft');
        expect(items.length).toBe(3);
        expect(items[0].name).toBe('Leadership');
        expect(items[1].name).toBe('Team Management');
        expect(items[2].name).toBe('Conflict Resolution');
    });

    test('returns empty array when field is undefined or empty string', () => {
        const skills: ResumeSkills = { Tech: '' };
        expect(getSkillItems(skills, 'Tech')).toEqual([]);
    });
});
