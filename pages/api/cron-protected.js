import { connectToDB } from '../../lib/mongo';
import sendEmail from '../../lib/sendEmail';

// Protected cron endpoint: requires a header x-cron-secret matching CRON_SECRET
export default async function handler(req, res) {
  const secret = req.headers['x-cron-secret'];
  if (!secret || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const db = await connectToDB();
  const blocks = db.collection('blocks');

  const now = new Date();
  const inTen = new Date(now.getTime() + 10 * 60 * 1000);

  // Find candidates
  const candidates = await blocks.find({
    startTime: { $gt: now, $lte: inTen },
    reminderSent: false
  }).toArray();

  let sent = 0, checked = candidates.length;
  for (const b of candidates) {
    try {
      // Attempt atomic update: only mark as reminded if reminderSent is still false
      const r = await blocks.updateOne(
        { _id: b._id, reminderSent: false },
        { $set: { reminderSent: true, remindedAt: new Date() } }
      );
      // If r.matchedCount === 0 someone else already updated it — skip
      if (r.matchedCount === 0) continue;

      // send email (best-effort)
      const subject = 'Quiet Hours starting soon';
      const text = `Your quiet-study block starts at ${b.startTime.toISOString()}`;
      await sendEmail(b.email, subject, text);
      sent++;
    } catch (err) {
      // On failure, revert reminderSent so it can be retried next run
      try {
        await blocks.updateOne({ _id: b._id }, { $set: { reminderSent: false } });
      } catch (e) {
        console.error('failed to revert reminderSent', e);
      }
      console.error('email send error', err);
    }
  }

  return res.status(200).json({ checked, sent });
}
