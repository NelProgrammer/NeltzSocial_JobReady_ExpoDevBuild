export interface SubExperienceItem {
    id: string;
    text?: string;
    name?: string;
}

export interface WorkExperience {
    id: string;
    Organization: string;
    Role: string;
    Department?: string;
    "Start Date": string;
    "End Date": string;
    "Key Responsibilities": SubExperienceItem[] | string;
    "Achievements"?: SubExperienceItem[] | string;
    "Systems Used"?: SubExperienceItem[] | string;
    "Reason for Leaving"?: string;
}

describe('Experience Sub-List Data Normalization Logic Tests', () => {
    type SubField = 'Key Responsibilities' | 'Achievements' | 'Systems Used';

    const getSubList = (exp: WorkExperience, field: SubField, prefix: string): SubExperienceItem[] => {
        const raw = exp[field];
        if (Array.isArray(raw)) return raw as SubExperienceItem[];
        if (typeof raw === 'string' && raw.trim().length > 0) {
            return raw.split('\n').filter(line => line.trim().length > 0).map((line, idx) => ({
                id: `${prefix}_${exp.id || 'exp'}_${idx}`,
                text: line.replace(/^-\s*/, '').trim(),
                name: line.replace(/^-\s*/, '').trim()
            }));
        }
        return [];
    };

    test('normalizes multi-item responsibility array', () => {
        const job: WorkExperience = {
            id: 'exp_101',
            Organization: 'Apex Tech Solutions',
            Role: 'Senior Engineer',
            "Start Date": '2022',
            "End Date": 'Present',
            "Key Responsibilities": [
                { id: 'resp_1', text: 'Built real-time websocket pipeline' },
                { id: 'resp_2', text: 'Optimized PostgreSQL indexing' }
            ]
        };

        const list = getSubList(job, 'Key Responsibilities', 'resp');
        expect(list.length).toBe(2);
        expect(list[0].text).toBe('Built real-time websocket pipeline');
        expect(list[1].text).toBe('Optimized PostgreSQL indexing');
    });

    test('parses legacy string multiline responsibilities into structured SubExperienceItems', () => {
        const job: WorkExperience = {
            id: 'exp_102',
            Organization: 'Legacy Corp',
            Role: 'Developer',
            "Start Date": '2020',
            "End Date": '2022',
            "Key Responsibilities": "- Led sprint planning\n- Code reviews and mentoring"
        };

        const list = getSubList(job, 'Key Responsibilities', 'resp');
        expect(list.length).toBe(2);
        expect(list[0].text).toBe('Led sprint planning');
        expect(list[1].text).toBe('Code reviews and mentoring');
    });
});
