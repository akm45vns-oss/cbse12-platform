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

export default router;
