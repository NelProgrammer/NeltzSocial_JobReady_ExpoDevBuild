export interface SkillItem {
  id: string;
  name: string;
  proficiency?: string;
  category?: string;
}

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

export interface ResumeSkills {
  Tech?: SkillItem[] | string;
  Soft?: SkillItem[] | string;
  Certifications?: SkillItem[] | string;
  NonAcadCerts?: SkillItem[] | string;
  SystemsUsed?: SkillItem[] | string;
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
  identity?: { idNumber?: string; idMask?: boolean };
  licensing?: { Drivers?: string; DriversVisible?: boolean; Motorcycle?: string; MotorVisible?: boolean };
  demographics?: { Nationality?: string; Gender?: string; Race?: string };
  legal?: { "Criminal Record"?: boolean; Details?: string };
  languages?: Array<{ Language: string; proficiency: string; visible?: boolean }>;
}

export interface ResumeData {
  id?: string;
  "personal details"?: PersonalDetails;
  personal?: PersonalDetails;
  experience?: WorkExperience[];
  education?: {
    tertiary?: Array<{ id: string; Institution: string; "Qualification Name": string; Year: number | string }>;
    highschool?: { "Year Completed"?: number | string; "Highest Grade Passed"?: string; "Province Department"?: string };
  };
  skills?: ResumeSkills;
  Skills?: ResumeSkills;
  "professional summary"?: string;
  References?: Array<{ id: string; Name: string; Organization: string; Role: string; Contact: string; visible?: boolean }>;
}
