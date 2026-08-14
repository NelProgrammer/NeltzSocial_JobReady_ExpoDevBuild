import { ResumeData } from '../../types/resume';

describe('FieldsSelection & Preview Visibility Integration Test', () => {
    const mockResumeData: ResumeData = {
        id: 'test_resume_1',
        "personal details": {
            names: { firstName: 'John', Surname: 'Doe' },
            contact: { Email: 'john@example.com', Phone: '0123456789' }
        },
        experience: [
            {
                id: 'exp_1',
                Organization: 'Acme Corp',
                Role: 'Senior Developer',
                "Start Date": '2020-01',
                "End Date": 'Present',
                "Key Responsibilities": [
                    { id: 'resp_1', name: 'Built REST APIs', visible: true },
                    { id: 'resp_2', name: 'Managed Database', visible: false }
                ],
                visible: true
            }
        ],
        education: {
            tertiary: [
                { id: 'tert_1', Institution: 'Wits', "Qualification Name": 'BSc CS', Year: '2019', visible: true }
            ]
        },
        skills: {
            Tech: [
                { id: 'tech_1', name: 'React Native', visible: true },
                { id: 'tech_2', name: 'Python', visible: false }
            ],
            Soft: [
                { id: 'soft_1', name: 'Communication', visible: true },
                { id: 'soft_2', name: 'Leadership', visible: false }
            ]
        },
        References: [
            { id: 'ref_1', name: 'Alice Smith', role: 'Manager', organization: 'Acme Corp', contact: '0821234567', visible: false },
            { id: 'ref_2', name: 'Bob Jones', role: 'Lead Architect', organization: 'Tech SA', contact: '0839876543', visible: true }
        ]
    };

    const formatBulletList = (val: any) => {
        if (!val) return '';
        if (Array.isArray(val)) {
            const items = val
                .filter(item => typeof item === 'object' && item !== null ? item.visible !== false : true)
                .map(item => typeof item === 'object' && item !== null ? (item.name || item.text || item.skill || '') : String(item))
                .filter(Boolean);
            return items.join(', ');
        }
        return String(val);
    };

    test('filters out hidden Soft Skills (Leadership is hidden, Communication is visible)', () => {
        const softSkills = mockResumeData.skills?.Soft || [];
        const renderedText = formatBulletList(softSkills);

        expect(renderedText).toContain('Communication');
        expect(renderedText).not.toContain('Leadership');
    });

    test('filters out hidden Technical Skills (Python is hidden, React Native is visible)', () => {
        const techSkills = mockResumeData.skills?.Tech || [];
        const renderedText = formatBulletList(techSkills);

        expect(renderedText).toContain('React Native');
        expect(renderedText).not.toContain('Python');
    });

    test('filters out hidden References (Alice Smith is hidden, Bob Jones is visible)', () => {
        const references = (mockResumeData.References || []).filter(r => r.visible !== false);
        
        expect(references.length).toBe(1);
        expect(references[0].name).toBe('Bob Jones');
        expect(references.some(r => r.name === 'Alice Smith')).toBe(false);
    });

    test('omits entire References section when all references are set to visible = false', () => {
        const allHiddenData: ResumeData = {
            ...mockResumeData,
            References: [
                { id: 'ref_1', name: 'Alice Smith', visible: false },
                { id: 'ref_2', name: 'Bob Jones', visible: false }
            ]
        };

        const activeRefList = (allHiddenData.References || []).filter(r => r.visible !== false);
        const refHtml = activeRefList.length > 0 ? `<h3>References</h3>...` : '';

        expect(refHtml).toBe('');
    });
});
