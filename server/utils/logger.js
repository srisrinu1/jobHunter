const {createLogger,format,transports}=require('winston');
const DailyRotateFile=require('winston-daily-rotate-file');
const os=require('os');
const { getRequestId,getUserId } = require('./requestContext');

const env = process.env.NODE_ENV || 'development';

const isProduction = env === 'production';
const isDevelopment = env === 'development';
const isTesting = env === 'testing';

let  logLevel="error";
if(isProduction){
    logLevel="info";
}
else if(isDevelopment){
    logLevel="warn";
}
else if(isTesting){
    logLevel="debug";
}

// const logToFile = isProduction ? true : false;

const injectAlsContext=format((info)=>{
    info.requestId = getRequestId() || 'unknown';
    const userId = getUserId();
    if (userId) info.userId = userId;
    return info;
})();

const devFormat=format.combine(
    format.colorize(),  
    format.timestamp(),
    format.printf(({timestamp,level,message})=>{
        return `${timestamp} ${level}: ${message}`;
    })
);

const prodFormat=format.combine(
    format.timestamp(),
    format.errors({stack:true}),
    format.splat(),
    format.json()
);

const testFormat=format.combine(
    format.timestamp(),
    format.errors({stack:true}),
    format.splat(),
    format.json()
);

let  loggerTransports=[];

if(isDevelopment || isTesting){
    loggerTransports.push(
        new transports.Console({
            level:logLevel,
            handleExceptions:true,
            handleRejections:true
        })
    );
}
else{
    loggerTransports.push(
        new transports.Console({
            level: logLevel,
            handleExceptions: true,
            handleRejections: true
        }),
        new DailyRotateFile({
            filename: `logs/${os.hostname()}-%DATE%-combined.log`,
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
            level: logLevel
        }),
        new DailyRotateFile({
            filename: `logs/${os.hostname()}-%DATE%-error.log`,
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
            level: 'error'
        })
    );
}

const logger=createLogger({
    level:logLevel,
    format: format.combine(
        injectAlsContext,
        isDevelopment? devFormat : isProduction ? prodFormat : testFormat
    ),
    transports:loggerTransports,
    defaultMeta:{service:'jobHunter-backend'},

});

module.exports=logger;

