import { ResumeData } from '../types/resume';

/**
 * Creates a static, deterministic mock ResumeData fixture for tests.
 * Strictly typed against ResumeData interface in src/types/resume.ts.
 * Guaranteed to produce identical outputs without random temporal variances.
 */
export const createMockResumeData = (overrides?: Partial<ResumeData>): ResumeData => ({
  id: 'resume-test-101',
  personal: {
    names: {
      firstName: 'Dave',
      Surname: 'TestUser',
    },
    contact: {
      Email: 'dave@example.com',
      Phone: '+27 82 123 4567',
    },
    addresses: [
      {
        id: 'addr-test-1',
        addressType: 'Home / Physical',
        unitOrHouseNo: 'Flat 4B',
        streetAddress: '123 Main Street',
        suburbOrVillage: 'Sandton',
        cityOrTown: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2000',
        visible: true,
      },
    ],
    identity: {
      idNumber: '9001015000088',
      idMask: false,
    },
    licensing: {
      Drivers: 'Code 8 (EB)',
      DriversVisible: true,
    },
    demographics: {
      Nationality: 'South African',
    },
    legal: {
      "Criminal Record": false,
    },
  },
  experience: [
    {
      id: 'work-exp-test-1',
      Role: 'Senior Developer',
      Organization: 'Tech Corp',
      "Start Date": '2020',
      "End Date": 'Present',
      "Key Responsibilities": [
        { id: 'resp-1', text: 'Built scalable cloud backends.', visible: true },
        { id: 'resp-2', text: 'Maintained React Native mobile applications.', visible: true },
      ],
      Achievements: [
        { id: 'ach-1', text: 'Improved application performance by 40%.', visible: true },
      ],
      "Systems Used": [
        { id: 'sys-1', name: 'PostgreSQL', visible: true },
        { id: 'sys-2', name: 'React Native', visible: true },
      ],
      visible: true,
    },
  ],
  education: {
    tertiary: [
      {
        id: 'edu-test-1',
        "Qualification Name": 'BSc Computer Science',
        Institution: 'University of the Witwatersrand',
        Year: '2019',
        visible: true,
      },
    ],
    professionalCertifications: [
      {
        id: 'cert-test-1',
        name: 'AWS Certified Solutions Architect',
        institution: 'Amazon Web Services',
        yearObtained: '2021',
        certNumber: 'AWS-990812',
        visible: true,
      },
    ],
  },
  skills: {
    Tech: [
      { id: 'tech-1', name: 'TypeScript', howObtained: 'Course', yearsInUse: '4', visible: true },
      { id: 'tech-2', name: 'Python', howObtained: 'Self-Taught', yearsInUse: '5', visible: true },
    ],
    Soft: [
      { id: 'soft-1', name: 'Problem Solving', visible: true },
      { id: 'soft-2', name: 'Leadership', visible: true },
    ],
    NonAcadCerts: [
      { id: 'nonacad-1', name: 'Agile Fundamentals', provider: 'Udemy', yearObtained: '2020', visible: true },
    ],
    SystemsUsed: [
      { id: 'sys-used-1', name: 'Jira', yearsInUse: '3', visible: true },
    ],
  },
  References: [
    {
      id: 'ref-test-1',
      Name: 'Jane Doe',
      Role: 'Engineering Manager',
      Organization: 'Tech Corp',
      Contact: 'jane@techcorp.com',
      visible: true,
    },
  ],
  ...overrides,
});
