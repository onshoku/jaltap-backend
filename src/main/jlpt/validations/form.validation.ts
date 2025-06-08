import { FormSubmission } from '../interfaces/form.interface'

export function validateFormSubmission(data: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];

  if (!data.firstName || !/^[a-zA-Z]+$/.test(data.firstName)) errors.push('Invalid firstName');
  if (!data.lastName || !/^[a-zA-Z]+$/.test(data.lastName)) errors.push('Invalid lastName');
  if (data.middleName && !/^[a-zA-Z]*$/.test(data.middleName)) errors.push('Invalid middleName');
  if (!data.passcode || !/^\d{8}$/.test(data.passcode)) errors.push('Invalid passcode');
  if (!data.testLevel) errors.push('testLevel is required');
  if (!data.gender) errors.push('gender is required');
  if (!data.nativeLanguage) errors.push('nativeLanguage is required');
  if (!data.dob) errors.push('dob is required');
  if (!data.address1) errors.push('address1 is required');
  if (!data.address2) errors.push('address2 is required');
  if (!data.country) errors.push('country is required');
  if (!data.pincode) errors.push('pincode is required');
  if (data.agreeTerms !== true) errors.push('Terms must be agreed to');

  return { valid: errors.length === 0, errors };
}

export function validateSave(data: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];


  if (!data.testLevel) errors.push('testLevel is required');


  return { valid: errors.length === 0, errors };
}
export function validatePaymentSave(data: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];


  // if (!data.testLevel) errors.push('testLevel is required');


  return { valid: errors.length === 0, errors };
}