type DatabaseSafetyOptions = {
	actionName: string;
};

export function assertEnvironmentSmokeDatabase(connectionString: string, { actionName }: DatabaseSafetyOptions) {
	if (!isTestDatabaseConnectionString(connectionString)) {
		throw new Error(
			`${actionName} can only run against the Test database. Check SQL_CONNECTION_STRING before running environment smoke data setup.`
		);
	}
}

export function isTestDatabaseConnectionString(connectionString: string) {
	const { database, server } = parseSqlConnectionString(connectionString);

	return (
		server === 'pins-sql-local-plans-primary-test.database.windows.net' && database === 'pins-sqldb-local-plans-test'
	);
}

function parseSqlConnectionString(connectionString: string) {
	const values = new Map<string, string>();

	for (const part of connectionString.split(';')) {
		const separatorIndex = part.indexOf('=');
		if (separatorIndex === -1) {
			continue;
		}

		const key = part.slice(0, separatorIndex).trim().toLowerCase();
		const value = part
			.slice(separatorIndex + 1)
			.trim()
			.replace(/^['"]|['"]$/g, '');
		values.set(key, value);
	}

	return {
		database: (values.get('database') || values.get('initial catalog') || '').toLowerCase(),
		server: normaliseSqlServer(
			values.get('server') || values.get('data source') || getSqlServerUrlHost(connectionString)
		)
	};
}

function getSqlServerUrlHost(connectionString: string) {
	return connectionString.match(/^sqlserver:\/\/([^;]+)/i)?.[1] || '';
}

function normaliseSqlServer(server: string) {
	return server
		.toLowerCase()
		.replace(/^sqlserver:\/\//, '')
		.replace(/^tcp:/, '')
		.split(',')[0]
		.split(':')[0]
		.trim();
}
