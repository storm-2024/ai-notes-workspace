import { Router } from 'express';
import {
  createNote,
  getAllNotes,
  askAssistant,
} from '../controllers/noteController.ts';

const router = Router();

router.route('/')
  .get(getAllNotes)
  .post(createNote);

router.post('/ask', askAssistant);

export default router;
