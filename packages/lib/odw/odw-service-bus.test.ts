import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { ODWDataMapper } from './odw-data-mapper.ts';
import { ODWServiceBusDataSender } from './odw-service-bus.ts';
import { ServiceBusUtil } from '../util/service-bus-util.ts';
import { Service } from '../app/service.ts';

describe('test ODWServiceBusDataSender', () => {
	describe('test sendUpdateMessage', async () => {
		const mockMapData = mock.method(ODWDataMapper.prototype, 'mapData', async () => ({
			case: { id: 'caseId' },
			events: [{ id: 'event1' }, { id: 'event2' }]
		}));
		const mockSendMessage = mock.method(ServiceBusUtil.prototype, 'sendMessage', async () => {});
		it('aborts when the service bus util could not be initialised', async () => {
			const sender = new ODWServiceBusDataSender({} as unknown as Service);
			await sender.sendUpdateMessage({ caseId: 'someId' }, true, false);
			assert.deepEqual(mockMapData.mock.calls.length, 0);
			assert.deepEqual(mockSendMessage.mock.calls.length, 0);
		});
		it('can send case and event messages to the ODW service bus', async () => {
			const service = {
				odw: {
					odwServiceBusName: 'some-service-bus-name'
				}
			};
			const sender = new ODWServiceBusDataSender(service as unknown as Service);
			await sender.sendUpdateMessage({ caseId: 'someId' }, true, false);
			assert.deepEqual(mockMapData.mock.calls.at(0)?.arguments, [{ caseId: 'someId' }, true, false]);
			assert.deepEqual(mockSendMessage.mock.calls.at(0)?.arguments, ['plans-case', [{ id: 'caseId' }]]);
			assert.deepEqual(mockSendMessage.mock.calls.at(1)?.arguments, [
				'plans-event',
				[{ id: 'event1' }, { id: 'event2' }]
			]);
		});
		it('suppresses exceptions', async () => {
			const mockSendMessage = mock.method(ODWDataMapper.prototype, 'mapData', async () => {
				throw Error('some exception');
			});
			const sender = new ODWServiceBusDataSender({} as unknown as Service);
			await sender.sendUpdateMessage({ caseId: 'someId' }, true, false);
			assert.deepEqual(mockMapData.mock.calls.length, 1);
			assert.deepEqual(mockSendMessage.mock.calls.length, 0);
		});
	});
});
