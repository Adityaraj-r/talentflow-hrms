import type { Response } from "express"
import type { AuthRequest } from "../middleware/auth.middleware"
import { PayrollPolicy } from "../models/payrollPolicy.model"
import { invalidatePolicyCache, normalizeStateName } from "../services/payrollPolicy.service"

export async function createPolicyVersion(req: AuthRequest, res: Response) {
  const { policyType, rules, effectiveFrom, changeNote, state } = req.body;

  if (!policyType || !rules || !effectiveFrom) {
    return res.status(400).json({ success: false, error: 'policyType, rules, and effectiveFrom are required' });
  }
  if (policyType === 'PT_SLAB' && !state) {
    return res.status(400).json({ success: false, error: 'state is required for PT_SLAB policies' });
  }

  const normalizedState = state ? normalizeStateName(state) : undefined;

  const query: any = { policyType };
  if (normalizedState) query.state = normalizedState;

  const latest = await PayrollPolicy.findOne(query).sort({ version: -1 });
  const newVersion = latest ? latest.version + 1 : 1;

  if (latest && !latest.effectiveTo) {
    latest.effectiveTo = new Date(new Date(effectiveFrom).getTime() - 86400000);
    await latest.save();
  }

  const policy = await PayrollPolicy.create({
    policyType,
    state: normalizedState,
    version: newVersion,
    effectiveFrom,
    effectiveTo: null,
    rules,
    changeNote,
    createdBy: req.user!.id, // req.user.id is a string here, not _id — matches AuthRequest's shape
  });

  invalidatePolicyCache();
  res.status(201).json({ success: true, data: policy });
}

export async function getPolicies(req: AuthRequest, res: Response) {
  const { policyType, state } = req.query;
  const query: any = {};
  if (policyType) query.policyType = policyType;
  if (state) query.state = normalizeStateName(String(state));

  const policies = await PayrollPolicy.find(query).sort({ policyType: 1, version: -1 });
  res.status(200).json({ success: true, data: policies });
}

export async function deactivatePolicy(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const policy = await PayrollPolicy.findById(id);
  if (!policy) {
    return res.status(404).json({ success: false, error: 'Policy not found' });
  }
  policy.isActive = false;
  await policy.save();
  invalidatePolicyCache();
  res.status(200).json({ success: true, data: policy });
}
export const updatePayrollPolicy = async (req: AuthRequest, res: Response) => {
    try {
        const policy = await PayrollPolicy.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json({
            success: true,
            data: policy
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};