export type Me = {
  businesses: Array<{
    tenantId: string;
    name: string;
    role: string;
    verificationStatus: string;
  }>;
};

export type RegistrationInput = {
  email: string;
  password: string;
  registeredBusinessName: string;
  businessTin: string;
  legalForm: "SOLE_PROPRIETORSHIP" | "PARTNERSHIP" | "NON_VAT_CORPORATION";
  businessAddress: string;
  taxClassification: "NON_VAT";
  contactNumber: string;
  consentVersion: string;
  consentTimestamp: string;
};
