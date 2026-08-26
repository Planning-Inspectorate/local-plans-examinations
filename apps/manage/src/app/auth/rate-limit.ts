export const authRateLimitOptions = {
	windowMs: 15 * 60 * 1000,
	max: process.env.NODE_ENV === 'production' ? 600 : 1000,
	message: 'Too many requests, please try again later',
	standardHeaders: true,
	legacyHeaders: false
};
