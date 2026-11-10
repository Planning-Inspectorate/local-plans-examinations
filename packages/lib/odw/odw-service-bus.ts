import { ServiceBusUtil } from '../util/service-bus-util.ts';
import { ODWDataMapper } from './odw-data-mapper.ts';
import type { Service } from '../app/service.ts';
import type { CaseIdOrCaseReference } from '../util/types.ts';

export const PLAN_CASE_SB_TOPIC = 'plans-case';
export const PLAN_EVENT_SB_TOPIC = 'plans-event';
const ACTION_MESSAGE =
	'Attempted to ACTION, but the serviceBusUtil was not initialised because the odwServiceBusName was missing from the config';

export class ODWServiceBusDataSender {
	#dataMapper: ODWDataMapper;
	#service: Service;
	#serviceBusUtil: ServiceBusUtil | null = null;

	constructor(service: Service) {
		this.#service = service;
		const serviceBusName = service.odw?.odwServiceBusName;
		if (serviceBusName) {
			this.#serviceBusUtil = new ServiceBusUtil(`${serviceBusName}.servicebus.windows.net`);
		}
		this.#dataMapper = new ODWDataMapper(this.#service);
	}

	private tryLogWarning(message: string) {
		const logWarning = this.#service?.logger?.warn;
		if (logWarning) {
			logWarning(message);
		}
	}

	private tryLogInfo(message: string) {
		const logInfo = this.#service?.logger?.info;
		if (logInfo) {
			logInfo(message);
		}
	}
	async sendUpdateMessage(
		caseIdOrCaseReference: CaseIdOrCaseReference,
		workshopsUpdated: boolean,
		hearingsUpdated: boolean
	) {
		if (!this.#serviceBusUtil) {
			this.tryLogWarning(ACTION_MESSAGE.replace('ACTION', 'send a case update message to the ODW'));
			return;
		}
		const detailString = caseIdOrCaseReference.caseReference
			? `reference '${caseIdOrCaseReference.caseReference}'`
			: `caseId '${caseIdOrCaseReference.caseId}'`;
		this.tryLogInfo(
			`Sending a message to the '${PLAN_CASE_SB_TOPIC}' topic in the ODW service bus for case with ${detailString}`
		);
		const dataToSend = await this.#dataMapper.mapData(caseIdOrCaseReference, workshopsUpdated, hearingsUpdated);
		this.#serviceBusUtil.sendMessage(PLAN_CASE_SB_TOPIC, [dataToSend.case]);
		if (dataToSend.events.length > 0) {
			this.tryLogInfo(
				`Sending a message to the '${PLAN_EVENT_SB_TOPIC}' topic in the ODW service bus for case with ${detailString}`
			);
			this.#serviceBusUtil.sendMessage(PLAN_EVENT_SB_TOPIC, dataToSend.events);
		} else {
			this.tryLogInfo(`No event messages generated, skipping sending messages to the ODW`);
		}
	}
}
