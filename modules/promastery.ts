import { initRedis, quitRedis, getColValues, getCacheValue, setCacheValue, getColValue, subscribe, unsubscribe, publish, pushValue } from './redis';
import yaml from 'js-yaml'
let _initialized = false;
const _apiKeys: Record<string, string> = {};
const _recordDefinitions: Record<string, any> = {};
const N8NDB = "n8n";
const init = async (key: string): Promise<void> => {
	await initRedis();

	const keyReg = await getColValue(N8NDB, "apiKeys", key);
	const db = keyReg.db
	const recordDefinitions = await getColValues(db, "RCTEMPL");
	_recordDefinitions[db] = recordDefinitions
	_apiKeys[key] = db

	_initialized = true;
	console.log("Initialized", db)

};
const importRecord = async (key: string,mailbox:string, resource: string, record: any): Promise<void> => {
	if (!_initialized) {
		await init(key);
	}
	const db = _apiKeys[key];
	if (!db) {
		return
	}
	console.log("rec", record, typeof record)
	//const recordData = { recordDefinitionId: resource, data: record } // { recordDefinitionId: resource, data: record };
	await pushValue( N8NDB,  `${mailbox}_data`, record);
}
const getRecords = async (key: string, resource: string, fieldIds: Array<string>): Promise<any> => {
	if (!_initialized) {
		await init(key);
	}
	try {
		const db = _apiKeys[key];
		if (!db) {
			console.error("Bad Api Key", key)
			return []
		}
		const records = await getColValues(db, resource);

		const recordDefinition = _recordDefinitions[db].find((r: any) => r.id === resource);
		if (!recordDefinition) {
			return []
		}

		let fields: Array<any> = getRecordDefinitionFieldArray(recordDefinition);
		if (fieldIds.length > 0) {
			fields = fields.filter((f: any) => fieldIds.includes(f.id));
		}

		const returnValues: Array<Record<string, any>> = [];
		for (const r of records) {
			const newRow: Record<string, any> = {};
			for (const f of fields) {

				newRow[f.id] = r[f.id] && f.hasState ? r[f.id]?.value : r[f.id];
			}
			returnValues.push(newRow)
		}
		return returnValues
	} catch (error) {
		console.error(error)
		return []
	}
}
const closeSubscription = async (): Promise<any> => {
	await unsubscribe("dataToExport");
	await quitRedis();
}
const subscribeToSubscriptions = async (key: string, callback: Function): Promise<any> => {
	if (!_initialized) {
		await init(key);
	}
	const db = _apiKeys[key];
	await subscribe("dataToExport", suscriptionProcessor);
	async function suscriptionProcessor(subsMessage: string) {
		try {
			const subs: Array<any> = JSON.parse(subsMessage)

			const ownSubs = subs.filter((s: any) => s.db == db);
			for (const sub of ownSubs) {
				const counterTable = `${sub.id}_count`;
				const dataTable = `${sub.id}_data`;
				const counter = (await getCacheValue(N8NDB, counterTable)) * 1
				await setCacheValue(N8NDB, counterTable, counter + 1);

				const records = await getColValues(N8NDB, dataTable);
				for (const r of records) {
					const id = r.id
					const counter = r.counter
					const subscriptionId = sub.id
					callback(r)
					const retObj = { subscriptionId, counter, id }
					await publish("dataExported", retObj)
					console.log("Imported to n8n", retObj)

				}

			}
		} catch (err) {
			console.error('Error processing subscription', err)
		}

	}
}

const getResources = async (key: string): Promise<Array<Object>> => {
	if (!_initialized) {
		await init(key);
	}

	return _recordDefinitions[key].map((r: any) => {
		return { value: r.id, name: `${r.id} (${r.name})` };
	});
}
const getFields = async (key: string, resource: string): Promise<Array<any>> => {
	if (!_initialized) {
		await init(key);
	}
	const recordDefinition = _recordDefinitions[key].find((r: any) => r.id === resource);
	const fields: Array<any> = getRecordDefinitionFieldArray(recordDefinition);
	return fields.map((f: any) => {
		return { value: f.id, name: `${f.id} (${f.name})` };
	})
}


function getRecordDefinitionFieldArray(recordDefinition: any) {
	const fields: Array<any> = [];
	if (recordDefinition.fields) {
		return recordDefinition.fields
	}
	recordDefinition.jsonTemplate = yaml.load(recordDefinition.template)
	for (const g of recordDefinition.jsonTemplate.groups) {
		for (const f of g.fields) {
			fields.push(f);
		}
	}
	recordDefinition.fields = fields;
	return fields
}
export { getResources, getRecords, getFields, subscribeToSubscriptions, closeSubscription, importRecord };


