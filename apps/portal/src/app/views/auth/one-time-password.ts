import bcrypt from 'bcrypt';

const OTP_LENGTH = 8;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SALT_ROUNDS = 10;
const OTP_EXPIRY_MS = 20 * 60 * 1000;

export async function createOneTimePassword(): Promise<{
	otp: string;
	hashedOtp: string;
	expiresAt: Date;
}> {
	const bytes = new Uint8Array(OTP_LENGTH);
	crypto.getRandomValues(bytes);
	const otp = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('');
	const hashedOtp = await bcrypt.hash(otp, SALT_ROUNDS);
	const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

	return { otp, hashedOtp, expiresAt };
}
