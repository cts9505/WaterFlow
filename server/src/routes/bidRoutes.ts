import { Router, Request, Response } from 'express';

const router = Router();

// Track SSE connections for all active captains
const captainClients = new Set<Response>();

router.get('/stream', (req: Request, res: Response) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    // Send initial ping to keep connection alive
    res.write('data: {"type": "connected"}\n\n');
    
    captainClients.add(res);
    res.on('close', () => {
      captainClients.delete(res);
    });
});

router.post('/', (req: Request, res: Response) => {
    const { price, lat, lng, customerName } = req.body;
    
    // Broadcast the new bid specifically to Captains instantly via SSE
    const bidPayload = `data: ${JSON.stringify({ 
       id: 'BID-' + Math.floor(Math.random() * 10000),
       price, 
       lat, 
       lng,
       customerName: customerName || 'WaterFlow User',
       time: new Date().toISOString()
    })}\n\n`;
    
    captainClients.forEach(client => client.write(bidPayload));
    
    res.json({ success: true, message: 'Broadcasted to all nearby captains instantly via SSE!' });
});

export default router;
