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
    address: {
      "Home Address": '123 Main Street, Johannesburg',
    },
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
        { id: 'resp-1', text: 'Built scalable cloud backends.' },
        { id: 'resp-2', text: 'Maintained React Native mobile applications.' },
      ],
      Achievements: [
        { id: 'ach-1', text: 'Improved application performance by 40%.' },
      ],
      "Systems Used": [
        { id: 'sys-1', name: 'PostgreSQL' },
        { id: 'sys-2', name: 'React Native' },
      ],
    },
  ],
  education: {
    tertiary: [
      {
        id: 'edu-test-1',
        "Qualification Name": 'BSc Computer Science',
        Institution: 'University of the Witwatersrand',
        Year: '2019',
      },
    ],
  },
  skills: {
    Tech: [
      { id: 'tech-1', name: 'TypeScript' },
      { id: 'tech-2', name: 'Python' },
    ],
    Soft: [
      { id: 'soft-1', name: 'Problem Solving' },
      { id: 'soft-2', name: 'Leadership' },
    ],
    Certifications: [
      { id: 'cert-1', name: 'AWS Certified Solutions Architect' },
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
