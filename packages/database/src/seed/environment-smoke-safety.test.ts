import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { assertEnvironmentSmokeDatabase, isTestDatabaseConnectionString } from './environment-smoke-safety.ts';

const testConnectionString =
	'sqlserver://pins-sql-local-plans-primary-test.database.windows.net;database=pins-sqldb-local-plans-test;user=test-user;password=test-password';

describe('environment smoke database safety', () => {
	it('allows the Test SQL host and database', () => {
		assert.equal(isTestDatabaseConnectionString(testConnectionString), true);

		assert.doesNotThrow(() =>
			assertEnvironmentSmokeDatabase(testConnectionString, {
				actionName: 'Environment smoke setup'
			})
		);
	});

	it('rejects a non-Test SQL host', () => {
		const connectionString =
			'sqlserver://pins-sql-local-plans-primary-dev.database.windows.net;database=pins-sqldb-local-plans-test;user=test-user;password=test-password';

		assert.equal(isTestDatabaseConnectionString(connectionString), false);
		assert.throws(
			() =>
				assertEnvironmentSmokeDatabase(connectionString, {
					actionName: 'Environment smoke setup'
				}),
			/Environment smoke setup can only run against the Test database/
		);
	});

	it('rejects a non-Test SQL database', () => {
		const connectionString =
			'sqlserver://pins-sql-local-plans-primary-test.database.windows.net;database=pins-sqldb-local-plans-prod;user=test-user;password=test-password';

		assert.equal(isTestDatabaseConnectionString(connectionString), false);
		assert.throws(
			() =>
				assertEnvironmentSmokeDatabase(connectionString, {
					actionName: 'Environment smoke cleanup'
				}),
			/Environment smoke cleanup can only run against the Test database/
		);
	});

	it('rejects missing SQL target details', () => {
		assert.equal(isTestDatabaseConnectionString('User ID=test-user;Password=test-password'), false);
	});

	it('allows ADO-style SQL connection strings for the same Test target', () => {
		const connectionString =
			'Server=tcp:pins-sql-local-plans-primary-test.database.windows.net,1433;Initial Catalog=pins-sqldb-local-plans-test;User ID=test-user;Password=test-password';

		assert.equal(isTestDatabaseConnectionString(connectionString), true);
	});
});
