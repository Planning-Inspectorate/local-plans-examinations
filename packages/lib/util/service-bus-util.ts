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

	public async sendMessage<T>(topicName: string, message: T) {
		const sender = this.client.createSender(topicName);
		await sender.sendMessages({ body: message });
		await sender.close();
	}
}
