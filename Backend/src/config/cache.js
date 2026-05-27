import Redis from 'ioredis'

const redis = new Redis({
    host:process.env.REDIS_HOST,
    port:process.env.REDIS_PORT,
    password:process.env.REDIS_PASSWORD
})

redis.on("connect",()=>{
    console.log("redis conntected");  
})

redis.on("error",(err)=>{
    console.log(err);
    
})

export default redis;