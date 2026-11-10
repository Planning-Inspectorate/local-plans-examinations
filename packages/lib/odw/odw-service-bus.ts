import { ServiceBusUtil } from '../util/service-bus-util.ts';
import { ODWDataMapper } from './odw-data-mapper.ts';
import type { Service } from '../app/service.ts';

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
		const serviceBusName = service.odw.odwServiceBusName;
		if (serviceBusName) {
			this.#serviceBusUtil = new ServiceBusUtil(`${serviceBusName}.servicebus.windows.net`);
		}
		this.#dataMapper = new ODWDataMapper(this.#service);
	}
	async sendUpdateMessage(caseReference: string, workshopsUpdated: boolean, hearingsUpdated: boolean) {
		if (!this.#serviceBusUtil) {
			this.#service.logger.warn(ACTION_MESSAGE.replace('ACTION', 'send a case update message to the ODW'));
			return;
		}
		const dataToSend = await this.#dataMapper.mapData(caseReference, workshopsUpdated, hearingsUpdated);
		this.#serviceBusUtil.sendMessage(PLAN_CASE_SB_TOPIC, dataToSend.case);
		for (const event of dataToSend.events) {
			this.#serviceBusUtil.sendMessage(PLAN_EVENT_SB_TOPIC, event);
		}
	}
}
