export interface CompositeAddressItem {
  id: string; // 1st
  addressType: string; // 2nd (Dropdown sub-options: Home / Physical, Flat / Apartment, Townhouse / Cluster, Office Block / Commercial, Rural / Village, Informal Settlement, Farm, Postal Address, Next of Kin / Relative, Other)
  
  // Free-standing House
  streetNumber?: string;
  streetName?: string;
  standNumber?: string; // strictly below street name
  
  // Flat / Apartment
  unitOrFlatNo?: string;
  buildingName?: string;
  
  // Townhouse / Cluster
  unitNo?: string;
  complexName?: string;
  
  // Office Block / Commercial
  suiteOrRoomOrUnitNo?: string;
  floor?: string;
  
  // Rural / Village (Traditional & Tribal Authority)
  standOrErfOrHouseNo?: string;
  villageName?: string;
  traditionalAuthorityOrTribalCouncil?: string;
  postalAgencyOrPostOffice?: string;
  townOrDistrict?: string;
  
  // Informal Settlement
  shackOrSectionOrStandNo?: string;
  settlementName?: string;
  sectionOrBlock?: string;
  nearestLandmarkOrZone?: string;
  
  // Farm / Agricultural
  portionOrPlotNo?: string;
  farmName?: string;
  roadOrRoute?: string;
  districtOrNearestTown?: string;
  
  // Postal Address
  boxOrBagType?: 'P.O. Box' | 'Private Bag' | string;
  boxOrBagNumber?: string;
  postOfficeName?: string;
  
  // Common / Geographic fields
  suburbOrTownship?: string;
  suburbOrVillage?: string; // legacy fallback
  unitOrHouseNo?: string;   // legacy fallback
  streetAddress?: string;   // legacy fallback
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
  yearObtained?: string | number;
  date_obtained?: string;
  dateObtained?: string;
  certNumber?: string;
  expiryYear?: string | number;
  expiry_date?: string;
  expiryDate?: string;
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
  start_date?: string;
  end_date?: string;
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
  demographics?: {
    Nationality?: string;
    Gender?: string;
    Race?: string;
    Disability?: string;
    MaritalStatus?: string;
    nationality?: string;
    gender?: string;
    race?: string;
    disability?: string;
    maritalStatus?: string;
  };
  legal?: { "Criminal Record"?: boolean; Details?: string };
  languages?: Array<{ Language: string; proficiency: string; visible?: boolean; customLanguage?: string }>;
}

export interface TertiaryEducationItem {
  id: string;
  Institution: string;
  "Qualification Name": string;
  Year?: number | string;
  date_obtained?: string;
  dateObtained?: string;
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
  date_obtained?: string;
  dateObtained?: string;
  certNumber?: string;
  visible?: boolean;
}

export interface RegulatoryCertItem {
  id: string;
  name: string;
  issuingBody?: string;
  licenseNumber?: string;
  yearObtained?: string | number;
  date_obtained?: string;
  dateObtained?: string;
  expiryYear?: string | number;
  expiry_date?: string;
  expiryDate?: string;
  visible?: boolean;
}

export interface ArtisanalCertItem {
  id: string;
  name: string; // e.g. "Red Seal Electrician", "Trade Test Welder"
  trade?: string; // "Electrician", "Boilermaker", "Plumber", "Fitter & Turner", "Millwright", "Welder", etc.
  issuingBodyOrSeta?: string; // "QCTO / SETA / NAMB / Dept of Higher Education"
  contractOrCertificateNumber?: string;
  yearObtained?: string | number;
  date_obtained?: string;
  dateObtained?: string;
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
  relation?: string;
  relationship?: string;
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
    artisanalCertifications?: ArtisanalCertItem[];
    highschool?: { "Year Completed"?: number | string; "Highest Grade Passed"?: string; "Province Department"?: string; "Subjects Stream"?: string; visible?: boolean };
  };
  skills?: ResumeSkills;
  Skills?: ResumeSkills;
  "professional summary"?: string;
  References?: ReferenceItem[];
}

export interface FormattingSettings {
  NameCase?: 'title' | 'upper';
  MiddleNameFormat?: 'full' | 'initial' | 'omit';
  MaidenNameFormat?: 'parentheses' | 'hyphen' | 'omit';
  ContactFormat?: 'bullet' | 'inline';
  ContactSeparator?: 'dot' | 'pipe' | 'comma' | 'slash';
  ContactDisplayMode?: 'keyValue' | 'iconValue' | 'valuesOnly';
  AddressFormat?: 'multi' | 'inline';
  AddressSeparator?: 'comma' | 'pipe' | 'dot';
  AddressMaskStreet?: boolean;
  AddressIncludeStand?: boolean;
  AddressIncludeProvince?: boolean;
  AddressIncludePostalCode?: boolean;
  IdMask?: boolean;
  IdDisplayMode?: 'keyValue' | 'valueOnly';
  DemoFormat?: 'bullet' | 'inline' | 'comma' | 'list';
  DemoSeparator?: 'dot' | 'pipe' | 'bullet';
  DemoDisplayMode?: 'keyValue' | 'valuesOnly';
  EduOrder?: 'qualificationFirst' | 'institutionFirst';
  EduDateFormat?: 'yearOnly' | 'monthYear';
  ExpOrder?: 'roleFirst' | 'companyFirst';
  ExpDateFormat?: 'monthYear' | 'yearMonth';
  RespFormat?: 'bullet' | 'paragraph' | 'comma';
  RespBulletType?: 'circle' | 'diamond' | 'hyphen' | 'asterisk' | 'arrow';
  TechFormat?: 'bullet' | 'comma' | 'list';
  SoftFormat?: 'bullet' | 'comma' | 'list';
  ArtisanalFormat?: 'bullet' | 'comma';
  SystemsFormat?: 'bullet' | 'comma';
  ProfCertsFormat?: 'bullet' | 'comma';
  NonAcadCertsFormat?: 'bullet' | 'comma';
  SkillsBulletType?: 'circle' | 'diamond' | 'hyphen' | 'plus';
  SkillsSeparator?: 'comma' | 'semicolon' | 'pipe';
  LanguagesFormat?: 'inline' | 'bullet' | 'table';
  LanguagesShowProficiency?: boolean;
  ReferencesLayout?: 'grid' | 'stacked';
  ReferencesSeparator?: 'lineBreak' | 'dot';
  toggleColorScheme?: 'semantic' | 'paper' | 'theme';
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
