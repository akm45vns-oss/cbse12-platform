import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..', '..', '..');
const CHECKPOINT_FILE = path.join(ROOT, 'cache', 'mcq_audit_checkpoint.json');

router.get('/progress', (req, res) => {
  try {
    if (!fs.existsSync(CHECKPOINT_FILE)) {
      return res.status(404).json({ error: "Checkpoint file not found" });
    }
    const data = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf-8"));
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to read checkpoint: " + err.message });
  }
});

// Webhook endpoint to receive live updates from the GitHub Action worker
router.post('/progress', express.json(), (req, res) => {
  try {
    const { token, progressData } = req.body;
    
    // Simple shared secret check (you can change this to a stronger secret via env var)
    const expectedToken = process.env.AUDIT_WEBHOOK_SECRET || 'akm45-audit-live-token';
    if (token !== expectedToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!progressData || !progressData.stats) {
      return res.status(400).json({ error: "Invalid progress payload" });
    }

    // Save the incoming payload to the checkpoint file
    const dir = path.dirname(CHECKPOINT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(progressData, null, 2), 'utf-8');
    
    return res.status(200).json({ success: true, message: "Live checkpoint updated" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to save live checkpoint: " + err.message });
  }
});

export default router;
