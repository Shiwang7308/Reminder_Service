const amqplib = require('amqplib');
const { MESSAGE_BROKER_URL, EXCHANGE_NAME} = require('../config/serverConfig');

const createChannel = async () => {
    try {
        const connection = await amqplib.connect(MESSAGE_BROKER_URL);
        // setup connection with the message broker or rapidmq server
        const channel = await connection.createChannel(); 
        // create a channel which is where most of the API for getting things done resides.
        await channel.assertExchange(EXCHANGE_NAME, 'direct', false);
    // here we setup exchange distributer named EXCNHANGE_NAME which receives messages from the publisher and distributes it to the queue based on the binding key 
        return channel;
    } catch (error) {
        throw error;
    }
}

// Messages are not sent directly to a queue, instead, the producer sends messages to an exchange.
// Exchange is responsible for routing the messages to different queues with the help of bindings and routing keys.
// binding key is used to bind the queue with the exchange distributer so that the message can be routed to the queue based on the binding key

const subscribeMessage = async (channel, service,  binding_key) => {
    try {
        // issues with receiving channel promise object that's why we are creating a new channel object here partially
        const channel = await createChannel();
        const applicationQueue = await channel.assertQueue('REMINDER_QUEUE');

        channel.bindQueue(applicationQueue.queue, EXCHANGE_NAME, binding_key);

        channel.consume(applicationQueue.queue, msg => {
            console.log('received data');
            console.log(msg.content.toString());
            const payload = JSON.parse(msg.content.toString());

                // here we have power to send the message to the service or use serviceLayer based on the service name mentioned in the payload according to the requirement because we have api which call controller and then service 
                // but here we have to proactively call the service here using the service object and use the service function to do the task required
                 // service parameter in payload tell us which service to call.
       
            service.subscribeEvents(payload);
            channel.ack(msg);
        });
        // it is used to consume the message from the queue mentioned by channel object using bindQueue function one by one and send it to the service for processing and then acknowledge the message to the message broker that the message has been processed successfully and can be removed from the queue 
    } catch (error) {
        throw error;
    }
    
}

const publishMessage = async (channel, binding_key, message) => {
    try {
        await channel.assertQueue('REMINDER_QUEUE');
        
        await channel.publish(EXCHANGE_NAME, binding_key, Buffer.from(message));
  
    } catch (error) {
        throw error;
    }
}

module.exports = {
    subscribeMessage,
    createChannel,
    publishMessage
}