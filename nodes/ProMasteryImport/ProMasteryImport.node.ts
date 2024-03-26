import { } from 'n8n-core';

import {
	//IDataObject,
	IExecuteFunctions, INodeType, INodeExecutionData, INodeTypeDescription, INodePropertyOptions, ILoadOptionsFunctions, IDataObject
} from 'n8n-workflow';
import { getResources, importRecord, getFields } from '../../modules/promastery'

export class ProMasteryImport implements INodeType {
	description: INodeTypeDescription = {
		// Basic node details will go here
		displayName: 'ProMastery Import',
		name: 'ProMasteryImport',
		icon: 'file:logo64.svg',
		group: ['transform'],
		version: 1,
		description: 'Import ProMastery Data',
		defaults: {
			name: 'ProMastery Import',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'ProMasteryAccess',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Mail Box',
				name: 'mailbox',
				type: 'string',
				required: true,
				default: '',
				description:
					'Mail box to connect to ProMastery',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getResources',
				},
				required: true,
				default: [],
				description:
					'Record Definitions',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',

				options: [
					{
						name: 'Import Record',
						value: 'importRecord',
						description: 'Import (insert or update) a record',
						action: 'Import a record',
					},
				],
				default: 'importRecord',
				noDataExpression: true,
			},
			/*	{
					displayName: 'Fields',
					name: 'fields',
					type: 'multiOptions',
					typeOptions: {
						loadOptionsMethod: 'getFields',
					},
					default: [],
	
					noDataExpression: true,
				}, */

		],
	};
	methods = {
		loadOptions: {
			// Get all the labels to display them to user so that they can
			// select them easily
			async getResources(this: ILoadOptionsFunctions): Promise<Array<INodePropertyOptions>> {
				try {
					const credentials = await this.getCredentials('ProMasteryAccess');
					const apiKey = credentials.apiKey as string;
					const resources = await getResources(apiKey)
					return resources as Array<INodePropertyOptions>;
				} catch (error) {
					console.error(error)
					return []
				}
			},
			async getFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const credentials = await this.getCredentials('ProMasteryAccess');
					const apiKey = credentials.apiKey as string;
					const resource = this.getCurrentNodeParameter('resource') as string;
					const fields = await getFields(apiKey, resource)
					return fields as Array<INodePropertyOptions>;
				} catch (error) {
					console.error(error)
					return []
				}
			}
		}
	};
	// The execute method will go here
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		try {
			// Handle data coming from previous nodes
			const items = this.getInputData();
			console.log(items)
			const credentials = await this.getCredentials('ProMasteryAccess');
			const apiKey = credentials.apiKey as string;

			const resource = this.getNodeParameter('resource', 0) as string;
			const mailbox = this.getNodeParameter('mailbox', 0) as string;
			const operation = this.getNodeParameter('operation', 0) as string;
			//const fields = this.getNodeParameter('fields', 0) as Array<string>;
			// For each item, make an API call to create a contact
			for (let i = 0; i < items.length; i++) {
				if (operation === 'importRecord') {
					const item = items[i] as IDataObject;
					await importRecord(apiKey, mailbox, resource, item.json);
				}
				// Map data to n8n data structure

			}
			return this.prepareOutputData(items);
		} catch (error) {
			console.error(error)
			return this.prepareOutputData([]);
		}

	}
}
