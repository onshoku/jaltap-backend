import otpGenerator from 'otp-generator';

export const generateOTP = (): string => {
    return otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false
    });
};

export const otpExpiryTime = (minutes: number = 10): Date => {
    const now = new Date();
    return new Date(now.getTime() + minutes * 60000);
};