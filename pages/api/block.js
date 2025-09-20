import { connectToDB } from '../../lib/mongo';
import { verifySupabaseToken } from '../../lib/supabaseAuth';

export default async function handler(req, res) {
  const db = await connectToDB();
  const blocks = db.collection('blocks');

  // Authenticate
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const user = await verifySupabaseToken(token);

  if (!user && req.method !== 'GET') {
    return res.status(401).json({ error: 'unauthorized' });
  }

  if (req.method === 'POST') {
    const { startTime, endTime } = req.body;
    const email = user?.email;
    if (!startTime || !endTime || !email) return res.status(400).json({ error: 'missing fields' });

    const s = new Date(startTime);
    const e = new Date(endTime);
    if (isNaN(s) || isNaN(e)) return res.status(400).json({ error: 'invalid dates' });
    if (s >= e) return res.status(400).json({ error: 'start must be before end' });

    // Prevent overlaps for this user (email)
    const overlap = await blocks.findOne({
      email,
      $or: [
        { startTime: { $lt: e, $gte: s } },
        { endTime: { $gt: s, $lte: e } },
        { startTime: { $lte: s }, endTime: { $gte: s } },
        { startTime: { $lte: e }, endTime: { $gte: e } }
      ]
    });

    if (overlap) return res.status(409).json({ error: 'overlapping block exists' });

    const doc = {
      email,
      userId: user.id,
      startTime: s,
      endTime: e,
      reminderSent: false,
      createdAt: new Date()
    };
    const result = await blocks.insertOne(doc);
    return res.status(201).json({ id: result.insertedId });
  }

  if (req.method === 'GET') {
    // public read: provide query by email param (or if authenticated, list their ones)
    const queryEmail = req.query.email;
    if (queryEmail) {
      const items = await blocks.find({ email: queryEmail }).sort({ startTime: 1 }).toArray();
      return res.status(200).json(items);
    }
    if (user) {
      const items = await blocks.find({ userId: user.id }).sort({ startTime: 1 }).toArray();
      return res.status(200).json(items);
    }
    return res.status(400).json({ error: 'email required' });
  }

  res.setHeader('Allow', 'GET,POST');
  res.status(405).end('Method not allowed');
}
