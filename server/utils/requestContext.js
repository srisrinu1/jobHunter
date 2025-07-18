const {AsyncLocalStorage} = require('async_hooks');
const asyncLocalStorage = new AsyncLocalStorage();

function getRequestId(){
    const store=asyncLocalStorage.getStore();
    return store?.requestId||null;

}

function setUserId(userId){
    const store = asyncLocalStorage.getStore();
    if (store) {
        store.userId = userId;
    }
}

function getUserId() {
    const store = asyncLocalStorage.getStore();
    return store?.userId || null;
}

function getContext(){
    const store=asyncLocalStorage.getStore();
    return store|| {};
}

module.exports={
    asyncLocalStorage,
    getRequestId,
    setUserId,
    getUserId,
    getContext,

};