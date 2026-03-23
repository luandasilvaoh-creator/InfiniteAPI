import { Router, type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');

// Garantir que a pasta de uploads existe
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

router.post('/upload', async (req: Request, res: Response) => {
  try {
    const { base64, filename } = req.body as { base64: string; filename: string };

    if (!base64 || !filename) {
      return res.status(400).json({ ok: false, error: 'missing base64 or filename' });
    }

    // Remover o prefixo data:image/...;base64,
    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ ok: false, error: 'invalid base64 format' });
    }

    const type = matches[1];
    const data = Buffer.from(matches[2], 'base64');

    // Gerar um nome único para evitar sobrescrever
    const ext = path.extname(filename) || `.${type.split('/')[1]}` || '.png';
    const nameOnly = path.parse(filename).name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const uniqueName = `${nameOnly}_${Date.now()}${ext}`;
    const filePath = path.join(UPLOADS_DIR, uniqueName);

    fs.writeFileSync(filePath, data);

    const publicUrl = `/uploads/${uniqueName}`;
    return res.json({ ok: true, url: publicUrl, filename: uniqueName });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
});

export default router;
