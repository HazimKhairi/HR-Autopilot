// this is test script to test every features

const { client , getCollection } = require('../config/chromadb');

async function test(){
    try{
        const collection = await getCollection();
        console.log('Collection: ', collection.name);
        const heartbeat = await client.heartbeat();
        console.log(heartbeat);
        console.log('Connection succssfull');
    }catch(error){
        console.error(error.message)
    }
}
test();

