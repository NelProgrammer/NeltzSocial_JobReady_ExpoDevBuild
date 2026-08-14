export interface CompositeAddressItem {
  id: string; // 1st
  addressType: string; // 2nd (Dropdown sub-options: Home / Physical, Flat / Apartment, Postal, Work, Rural / Village, Farm, Informal Settlement, Next of Kin, Other)
  unitOrHouseNo?: string;
  streetAddress?: string;
  suburbOrVillage?: string;
  cityOrTown?: string;
  province?: string;
  postalCode?: string;
  visible?: boolean;
}

export interface SkillItem {
  id: string;
  name: string;
  proficiency?: string;
  category?: string;
  visible?: boolean;
}

export interface TechSkillItem {
  id: string;
  name: string;
  howObtained?: 'Course' | 'Self-Taught' | 'On-the-Job' | string;
  yearsInUse?: string;
  visible?: boolean;
}

export interface SoftSkillItem {
  id: string;
  name: string;
  visible?: boolean;
}

export interface NonAcadCertItem {
  id: string;
  name: string;
  provider?: string;
  yearObtained?: string;
  visible?: boolean;
}

export interface SystemUsedItem {
  id: string;
  name: string;
  yearsInUse?: string;
  visible?: boolean;
}

export interface ProfessionalCertItem {
  id: string;
  name: string;
  institution: string;
  yearObtained: string;
  certNumber?: string;
  expiryYear?: string;
  visible?: boolean;
}

export interface SubExperienceItem {
  id: string;
  text?: string;
  name?: string;
  visible?: boolean;
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
  visible?: boolean;
}

export interface ResumeSkills {
  Tech?: TechSkillItem[] | SkillItem[] | string;
  Soft?: SoftSkillItem[] | SkillItem[] | string;
  Certifications?: ProfessionalCertItem[] | SkillItem[] | string;
  NonAcadCerts?: NonAcadCertItem[] | SkillItem[] | string;
  SystemsUsed?: SystemUsedItem[] | SkillItem[] | string;
}

export interface PersonalNames {
  firstName?: string;
  MiddleName?: string;
  MaidenName?: string;
  Surname?: string;
  Prefix?: string;
}

export interface PersonalContact {
  Email?: string;
  Phone?: string;
  "Phone-alt"?: string;
  LinkedIn?: string;
  Website?: string;
}

export interface PersonalAddress {
  AddressType?: string;
  "Home Address"?: string;
}

export interface PersonalDetails {
  names?: PersonalNames;
  contact?: PersonalContact;
  address?: PersonalAddress;
  addresses?: CompositeAddressItem[];
  identity?: { idNumber?: string; idMask?: boolean };
  licensing?: { Drivers?: string; DriversVisible?: boolean; Motorcycle?: string; MotorVisible?: boolean };
  demographics?: { Nationality?: string; Gender?: string; Race?: string };
  legal?: { "Criminal Record"?: boolean; Details?: string };
  languages?: Array<{ Language: string; proficiency: string; visible?: boolean }>;
}

export interface TertiaryEducationItem {
  id: string;
  Institution: string;
  "Qualification Name": string;
  Year: number | string;
  "NQF Level"?: string;
  Completed?: boolean;
  "Key Modules"?: string[];
  visible?: boolean;
}

export interface TechCertItem {
  id: string;
  name: string;
  provider?: string;
  yearObtained?: string | number;
  certNumber?: string;
  visible?: boolean;
}

export interface RegulatoryCertItem {
  id: string;
  name: string;
  issuingBody?: string;
  licenseNumber?: string;
  yearObtained?: string | number;
  expiryYear?: string | number;
  visible?: boolean;
}

export interface ReferenceItem {
  id: string;
  name?: string;
  Name?: string;
  organization?: string;
  Organization?: string;
  company?: string;
  role?: string;
  Role?: string;
  cellPhone?: string;
  workPhone?: string;
  email?: string;
  visible?: boolean;
}

export interface ResumeData {
  id: string;
  "personal details"?: any;
  personal?: any;
  experience?: WorkExperience[];
  education?: {
    tertiary?: TertiaryEducationItem[];
    professionalCertifications?: ProfessionalCertItem[];
    technicalCertifications?: TechCertItem[];
    regulatoryCertifications?: RegulatoryCertItem[];
    highschool?: { "Year Completed"?: number | string; "Highest Grade Passed"?: string; "Province Department"?: string; visible?: boolean };
  };
  skills?: ResumeSkills;
  Skills?: ResumeSkills;
  "professional summary"?: string;
  References?: ReferenceItem[];
}

export type ResumeType = 'source_of_truth' | 'main' | 'targeted';

export interface ResumeConfiguration {
  id: string;
  primaryResumeId: string;
  profileId: string;
  name: string;
  configType: 'main' | 'targeted';
  visibility?: Record<string, boolean>;
  personalDetailsVisibility?: Record<string, boolean>;
  skillsVisibility?: Record<string, boolean>;
  certificationsVisibility?: Record<string, boolean>;
  experienceVisibility?: Record<string, boolean>;
  educationVisibility?: Record<string, boolean>;
  referencesVisibility?: Record<string, boolean>;
  languagesVisibility?: Record<string, boolean>;
  tertiaryEducationVisibility?: Record<string, boolean>;
  fieldParityIndicators?: Record<string, 'synced' | 'new_master_field' | 'modified_master_field' | 'contradiction'>;
  lastModified: string;
}
