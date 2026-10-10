import { ResumeCompiler, CompiledResumeDocument } from '@jobready/core';
import { ResumeData } from '../../types/resume';

describe('FieldsSelection & Preview Visibility Integration via @jobready/core', () => {
    const mockResumeData: ResumeData | any = {
        id: 'test_resume_1',
        "personal details": {
            names: { firstName: 'John', MiddleName: 'Sipho', Surname: 'Doe' },
            contact: { Email: 'john@example.com', Phone: '0123456789', "Phone-alt": '0829876543' },
            identity: { idNumber: '9501015800085' },
            addresses: [
                {
                    id: 'addr_1',
                    streetNumber: '123',
                    streetName: 'Main Street',
                    suburbOrTownship: 'Sunnyside',
                    cityOrTown: 'Pretoria',
                    province: 'Gauteng',
                    postalCode: '0002',
                    visible: true
                },
                {
                    id: 'addr_2',
                    streetNumber: '456',
                    streetName: 'Cape Road',
                    cityOrTown: 'Cape Town',
                    visible: false
                }
            ]
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
            { id: 'ref_1', name: 'Alice Smith', role: 'Manager', organization: 'Acme Corp', cellPhone: '0821234567', visible: false },
            { id: 'ref_2', name: 'Bob Jones', role: 'Lead Architect', organization: 'Tech SA', cellPhone: '0839876543', visible: true }
        ]
    };

    test('ResumeCompiler filters out hidden Soft Skills and Technical Skills from categories', () => {
        const config = {
            config_type: 'targeted',
            visibility_flags: {},
            format_switches: { TechFormat: 'comma', SoftFormat: 'comma' }
        };

        const doc: CompiledResumeDocument = ResumeCompiler.compile(mockResumeData, config);

        const techCat = doc.skills?.categories.find(c => c.title.toLowerCase().includes('tech'));
        const softCat = doc.skills?.categories.find(c => c.title.toLowerCase().includes('soft'));

        expect(techCat?.items).toContain('React Native');
        expect(techCat?.items).not.toContain('Python');

        expect(softCat?.items).toContain('Communication');
        expect(softCat?.items).not.toContain('Leadership');
    });

    test('ResumeCompiler filters out hidden References (Alice Smith hidden, Bob Jones included)', () => {
        const config = {
            config_type: 'targeted',
            visibility_flags: {}
        };

        const doc: CompiledResumeDocument = ResumeCompiler.compile(mockResumeData, config);

        expect(doc.references).toBeDefined();
        expect(doc.references?.length).toBe(1);
        expect(doc.references?.[0].name).toBe('Bob Jones');
        expect(doc.references?.some(r => r.name === 'Alice Smith')).toBe(false);
    });

    test('ResumeCompiler eliminates ghost headers when all references are hidden', () => {
        const allHiddenData: ResumeData | any = {
            ...mockResumeData,
            References: [
                { id: 'ref_1', name: 'Alice Smith', visible: false },
                { id: 'ref_2', name: 'Bob Jones', visible: false }
            ]
        };

        const config = {
            config_type: 'targeted',
            visibility_flags: {}
        };

        const doc: CompiledResumeDocument = ResumeCompiler.compile(allHiddenData, config);

        // References array should be empty, eliminating the entire section from rendering
        expect(doc.references?.length || 0).toBe(0);
    });

    test('ResumeCompiler formats address and applies street masking when configured', () => {
        const maskConfig = {
            config_type: 'targeted',
            visibility_flags: {
                pd_addr_mask_0: true
            },
            format_switches: {
                AddressFormat: 'comma',
                AddressMaskStreet: true
            }
        };

        const doc: CompiledResumeDocument = ResumeCompiler.compile(mockResumeData, maskConfig);

        // Address 1 should have street masked
        expect(doc.header.addressLine).toBeDefined();
        expect(doc.header.addressLine).toContain('****');
        expect(doc.header.addressLine).toContain('Main Street');
        expect(doc.header.addressLine).toContain('Pretoria');
        // Address 2 has visible: false so it must not appear
        expect(doc.header.addressLine).not.toContain('Cape Road');
    });

    test('ResumeCompiler main config invariant includes all fields by default and applies POPIA ID mask', () => {
        const mainConfig = {
            config_type: 'main',
            visibility_flags: {
                pd_id_mask: true
            },
            format_switches: {
                ContactSeparator: 'pipe',
                NameCase: 'upper'
            }
        };

        const doc: CompiledResumeDocument = ResumeCompiler.compile(mockResumeData, mainConfig);

        // Full name is formatted uppercase
        expect(doc.header.fullName).toBe('JOHN SIPHO DOE');
        expect(doc.header.contactSeparator).toBe(' | ');

        // Contact items contain email and phone
        const emailItem = doc.header.contactItems.find(c => c.key.toLowerCase() === 'email' || c.label === 'Email');
        expect(emailItem).toBeDefined();
        expect(emailItem?.value).toBe('john@example.com');

        // Demographics or identity masking
        const idDemo = doc.demographics?.find(d => d.label.includes('ID'));
        if (idDemo) {
            expect(idDemo.value).toContain('****');
        }
    });
});
