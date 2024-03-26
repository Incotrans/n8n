import { } from 'n8n-core';

import {
	//IDataObject,
	IExecuteFunctions, INodeType, INodeExecutionData, INodeTypeDescription, INodePropertyOptions, ILoadOptionsFunctions
} from 'n8n-workflow';
import { getResources, getRecords, getFields } from '../../modules/promastery'

//import { OptionsWithUri, } from 'request';
export class ProMasteryExport implements INodeType {
	description: INodeTypeDescription = {
		// Basic node details will go here
		displayName: 'ProMastery Export',
		name: 'ProMasteryExport',
		icon: 'file:logo64.svg',
		group: ['transform'],
		version: 1,
		description: 'Export ProMastery Data',
		defaults: {
			name: 'ProMastery Export',
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
						name: 'Extract all',
						value: 'extractAll',
						description: 'Extract all records',
						action: 'Extract all records',
					},
				],
				default: 'extractAll',
				noDataExpression: true,
			}, 
			{
				displayName: 'Fields',
				name: 'fields',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getFields',
				},
				default: [],

				noDataExpression: true,
			}, 
			
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
		// Handle data coming from previous nodes
		const items = this.getInputData();

		const returnData = [];
		const credentials = await this.getCredentials('ProMasteryAccess');
		const apiKey = credentials.apiKey as string;
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const fields = this.getNodeParameter('fields', 0) as Array<string>;
		// For each item, make an API call to create a contact
		for (let i = 0; i < items.length; i++) {
			if (operation === 'extractAll') {
				// Get email input
				const records = await getRecords(apiKey, resource, fields);
				returnData.push(...records);
			}
		}

		// Map data to n8n data structure
		return await [this.helpers.returnJsonArray(returnData)];
	}

}
