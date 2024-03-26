import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ProMasteryAccess implements ICredentialType {
	name = 'ProMasteryAccess';
	displayName = 'ProMastery Access';
	documentationUrl = 'https://www.incotrans.es';
	properties: INodeProperties[] = [
		{
			displayName: 'ApiKey',
			name: 'apiKey',
			type: 'string',
			default: '',
		},
	];
	key:string = '={{$credentials.apiKey}}';

	// This allows the credential to be used by other parts of n8n
	// stating how this credential is injected as part of the request
	// An example is the Http Request node that can make generic calls
	// reusing this credential


	
}
