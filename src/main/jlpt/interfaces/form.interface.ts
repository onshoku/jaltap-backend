export interface CommunicationSkills {
  speaking: boolean;
  listening: boolean;
  reading: boolean;
  writing: boolean;
}

export interface FormSubmission {
  submissionId: string;
  timestamp: string;
  specialArrangement: boolean;
  testLevel: string;
  testSite: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  nativeLanguage: string;
  passcode: string;
  dob: string;
  address1: string;
  address2: string;
  country: string;
  pincode: string;
  sameAsAddress: boolean;
  institution?: string;
  learningPlace?: string;
  examReason?: string;
  occupation?: string;
  occupationalDetails?: string;
  mediaContacts: string[];
  communication: { [personId: string]: CommunicationSkills };
  attempts: {
    level: number;
    attempts: number;
    result: string;
  }[];
  agreeTerms: boolean;
}
