import Redis from 'ioredis';

let _redisClient: Redis | null = null;
let _redisSubscriber: Redis | null = null;
const _callBacks: { id: string; callback: Function }[] = [];

const initRedis = async (): Promise<void> => {
    try {
        _redisClient = new Redis({
            host: '127.0.0.1',
            port: 6379,
            password: 'RM3nd4t4',
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });

        _redisSubscriber = _redisClient.duplicate();
    
        _redisSubscriber.on("message", async (channel, message) => {
            const callbackReg = _callBacks.find(c => c.id == channel);
            if (callbackReg) {
                await callbackReg.callback(message ? JSON.parse(message) : null);
            }
        });
    } catch (err) {
        console.log(err);
    }
};

const quitRedis = async (): Promise<void> => {
    if (_redisClient) {
        await _redisClient.quit();
        _redisClient = null;
        
        await _redisSubscriber!.quit();
        _redisSubscriber = null;
    }
    _callBacks.length = 0;
};
const unsubscribe = async (channel: string): Promise<void> => {
    for (let i = _callBacks.length - 1; i >= 0; i--) {
        if (_callBacks[i].id == channel) {
            _callBacks.splice(i, 1);
        }
    }

    await _redisSubscriber!.unsubscribe(channel);
}

const subscribe = async (channel: string, callback: Function): Promise<void> => {
    if (!_redisClient) {
        await initRedis();
    }
    await _redisSubscriber!.subscribe(channel);
    _callBacks.push({ id: channel, callback });
};

const publish = async (channel: string, message: any): Promise<number> => {
    if (_redisClient) {

        return await _redisClient.publish(channel, JSON.stringify(message));
    } else {
        return 0
    }

};

const pushValue = async function (db:string, collection:string, value: any) {
    if (!_redisClient) {
        await initRedis();
    }
    const { collectionKey } = getRedisColKey(db, collection, '');
    value = JSON.stringify(value)
    if (_redisClient) {
        await _redisClient.lpush(collectionKey, value)
    }

}


const getRedisColKey = (db: string, collection: string, key: string): { redisKey: string; collectionKey: string } => {
    const redisKey = `${key}`
    const collectionKey = `${db}::${collection}#`

    return { redisKey, collectionKey }
}
const getRedisKey = (db: string, key: string): {  collectionKey: string } => {
   
    const collectionKey = `${db}::${key}`

    return { collectionKey }
}
// Add other functions with appropriate type annotations

const getColValue = async (db: string, collection: string, key: string): Promise<any | null> => {
    const { redisKey, collectionKey } = getRedisColKey(db, collection, key);
    if (_redisClient) {
        const value = await _redisClient.hget(collectionKey, redisKey);
        if (value) {
            return JSON.parse(value);
        } else {
            return null;
        }
    }
};
const getCacheValue = async (db: string, key: string): Promise<any | null> => {
    const {  collectionKey } = getRedisKey(db, key);
    if (_redisClient) {
        const value = await _redisClient.get(collectionKey);
        if (value) {
            return JSON.parse(value);
        } else {
            return null;
        }
    }
}
const setCacheValue = async (db: string, key: string, value: any) => {
    const {  collectionKey } = getRedisKey(db, key);
    if (_redisClient) {
        const jsonVal = JSON.stringify(value);
        await _redisClient.set(collectionKey, jsonVal);
   
    }
}
const getColValues = async (db: any, collection: any, returnObject = false): Promise<any> => {
    const { collectionKey } = getRedisColKey(db, collection, '');
    if (!_redisClient) {
        return null
    }
    if (!returnObject) {
        const valueList = await _redisClient.hvals(collectionKey)
        const returnObj: any[] = []
        for (const v of valueList) {
            returnObj.push(JSON.parse(v))
        }
        return returnObj
    } else {
        const valuesObj = await _redisClient.hgetall(collectionKey)
        const returnObj: { [key: string]: any } = {}
        for (const key of Object.keys(valuesObj)) {
            returnObj[key] = JSON.parse(valuesObj[key])
        }
        return returnObj
    }
    /*  */

}

// Add other functions with appropriate type annotations

export { initRedis, quitRedis, getColValue, getColValues, getCacheValue, setCacheValue, subscribe, unsubscribe, publish, pushValue };
