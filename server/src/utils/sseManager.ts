import { Response } from 'express';

// In-memory map of bookingId -> Active SSE connection streams
const clients = new Map<string, Response[]>();

export const addClient = (bookingId: string, res: Response) => {
  if (!clients.has(bookingId)) {
    clients.set(bookingId, []);
  }
  clients.get(bookingId)!.push(res);
  
  res.on('close', () => removeClient(bookingId, res));
};

export const removeClient = (bookingId: string, res: Response) => {
  const room = clients.get(bookingId);
  if (!room) return;
  const filtered = room.filter(client => client !== res);
  if (filtered.length === 0) {
    clients.delete(bookingId);
  } else {
    clients.set(bookingId, filtered);
  }
};

export const sendLocationUpdate = (bookingId: string, data: any) => {
  const room = clients.get(bookingId);
  if (!room) return;
  
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  room.forEach(client => client.write(payload));
};
