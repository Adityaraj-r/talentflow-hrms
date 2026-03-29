import express from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  createRecruitmentSuggestion,
  listRecruitmentSuggestionsForHr,
  listMyRecruitmentSuggestions,
  acknowledgeRecruitmentSuggestion,
} from '../controllers/recruitmentSuggestion.controller';

const router = express.Router();

router.use(protect as any);

router.post('/', createRecruitmentSuggestion);
router.get('/mine', listMyRecruitmentSuggestions);
router.get('/hr-inbox', listRecruitmentSuggestionsForHr);
router.patch('/:id/acknowledge', acknowledgeRecruitmentSuggestion);

export default router;
