import { Kafka, Partitioners } from 'kafkajs';
import { sendLocationUpdate } from './sseManager';

const kafka = new Kafka({
  clientId: 'waterflow-backend',
  brokers: ['localhost:9092']
});

export const producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });
export const consumer = kafka.consumer({ groupId: 'waterflow-group' });

export const initKafka = async () => {
   await producer.connect();
   await consumer.connect();
   await consumer.subscribe({ topic: 'tanker-locations' });

   await consumer.run({
     eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return;
        const data = JSON.parse(message.value.toString());
        
        // Push directly to SSE from the Kafka ingestion pipeline! High throughput!
        // This avoids writing to the DB constantly! Database is safe.
        if (data.bookingId && data.lat && data.lng) {
            sendLocationUpdate(data.bookingId, data);
        }
     }
   });
};
