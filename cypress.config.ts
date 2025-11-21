import { defineConfig } from 'cypress';

export default defineConfig({
	e2e: {
		baseUrl: process.env.CYPRESS_BASE_URL
	}
});
