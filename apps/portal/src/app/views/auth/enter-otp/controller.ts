import type { Handler } from 'express';

const VIEW_PATH = 'views/auth/enter-otp/view.njk';

/**
 * GET /auth/enter-otp - Display the OTP entry page
 */
export function getEnterOtp(): Handler {
	return (req, res) => {
		const emailAddress = req.session.emailAddress || '';

		res.render(VIEW_PATH, {
			pageTitle: 'Enter the One Time Password (OTP)',
			emailAddress
		});
	};
}

interface OtpRequestBody {
	otp?: string;
}

/**
 * POST /auth/enter-otp - Validate and submit the OTP
 */
export function postEnterOtp(): Handler {
	return (req, res) => {
		const { otp } = req.body as OtpRequestBody;
		const emailAddress = req.session.emailAddress || '';

		if (!otp || otp.trim() === '') {
			return res.render(VIEW_PATH, {
				pageTitle: 'Enter the One Time Password (OTP)',
				emailAddress,
				errors: {
					otp: { text: 'Enter the one-time password' }
				},
				errorSummary: [{ text: 'Enter the one-time password', href: '#otp' }]
			});
		}

		// TODO: validate OTP against backend service
		// For now, accept any non-empty code and redirect to My Plans
		return res.redirect('/my-plans');
	};
}
