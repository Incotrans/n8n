/* eslint-disable @typescript-eslint/no-loop-func */
import type {
	ITriggerFunctions,
//	IDataObject,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
} from 'n8n-workflow';
//import { NodeOperationError } from 'n8n-workflow';
import {subscribeToSubscriptions, closeSubscription} from '../../modules/promastery'


//import { redisConnectionTest, setupRedisClient } from './utils';

export class ProMasteryTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ProMastery Trigger',
		name: 'ProMasteryTrigger',
		icon: 'file:logo64.svg',
		group: ['trigger'],
		version: 1,
		description: 'Subscribe to ProMastery subscription',
		defaults: {
			name: 'ProMastery Subscription',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'ProMasteryAccess',
				required: true,
			},
		],
		properties: [
			
			
		],
	};

	

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const credentials = await this.getCredentials('ProMasteryAccess');
		const apiKey = credentials.apiKey as string;
		

		//const subscription = (this.getNodeParameter('subscription') as string);
		const manualTriggerFunction = async () => {
			const subscriptionFunc =  (record:any) => {
			
				this.emit([this.helpers.returnJsonArray(record)]);
			}
			await subscribeToSubscriptions(apiKey, subscriptionFunc);
		}
		if (this.getMode() === 'trigger') {
			void manualTriggerFunction();
		}

		async function closeFunction() {
		
			await closeSubscription();
		}
		/*

		const client = setupRedisClient(credentials);

		const manualTriggerFunction = async () => {
			await client.connect();
			await client.ping();

			try {
				for (const channel of channels) {
					await client.pSubscribe(channel, (message) => {
						if (options.jsonParseBody) {
							try {
								message = JSON.parse(message);
							} catch (error) {}
						}

						if (options.onlyMessage) {
							this.emit([this.helpers.returnJsonArray({ message })]);
							return;
						}

						this.emit([this.helpers.returnJsonArray({ channel, message })]);
					});
				}
			} catch (error) {
				throw new NodeOperationError(this.getNode(), error);
			}
		};

		*/

		return {
			closeFunction,
			manualTriggerFunction,
		};
	}
}