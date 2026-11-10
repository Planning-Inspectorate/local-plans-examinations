import { DefaultAzureCredential } from '@azure/identity';
import { ServiceBusClient } from '@azure/service-bus';

export class ServiceBusUtil {
	private client: ServiceBusClient;
	private readonly fullyQualifiedNamespace: string;
	private readonly credential: DefaultAzureCredential;

	constructor(fullyQualifiedNamespace: string, credential: DefaultAzureCredential = new DefaultAzureCredential()) {
		this.fullyQualifiedNamespace = fullyQualifiedNamespace;
		this.credential = credential;
		this.client = new ServiceBusClient(this.fullyQualifiedNamespace, this.credential);
	}

	public async sendMessage<T>(topicName: string, messages: T[]) {
		if (messages.length == 0) {
			throw Error('Attempted to send 0 messages to the service bus. Please verify the messages being sent');
		}
		const sender = this.client.createSender(topicName);
		await sender.sendMessages(messages.map((message) => ({ body: message })));
		await sender.close();
	}
}
