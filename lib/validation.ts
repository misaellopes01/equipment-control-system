import { z } from 'zod';

const requiredText = z.string().trim().min(1, 'Campo obrigatório');
const optionalText = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  return value;
}, z.string().trim().optional());

const booleanish = z.preprocess((value) => {
  if (value === true || value === 'true' || value === 'on' || value === '1') return true;
  if (value === false || value === 'false' || value === 'off' || value === '0') return false;
  return value;
}, z.boolean({ required_error: 'Campo obrigatório' }));

const optionalDate = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  if (value instanceof Date) return value;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? value : parsed;
}, z.date().optional());

const requiredDate = z.preprocess((value) => {
  if (value instanceof Date) return value;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? value : parsed;
}, z.date({ required_error: 'Campo obrigatório' }));

export const equipmentBaseSchema = z.object({
  inventoryNumber: requiredText,
  brand: requiredText,
  name: requiredText,
  allocatedBase: requiredText,
  currentLocation: requiredText,
  isContractual: booleanish,
  contractCode: optionalText,
  contractStartAt: optionalDate,
  contractEndAt: optionalDate,
});

export const equipmentSchema = equipmentBaseSchema.superRefine((value, context) => {
  if (value.contractStartAt && value.contractEndAt && value.contractEndAt < value.contractStartAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['contractEndAt'],
      message: 'A data final do contrato deve ser posterior à data inicial.',
    });
  }
});

export const equipmentUpdateSchema = equipmentBaseSchema.partial().superRefine((value, context) => {
  if (value.contractStartAt && value.contractEndAt && value.contractEndAt < value.contractStartAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['contractEndAt'],
      message: 'A data final do contrato deve ser posterior à data inicial.',
    });
  }
});

export const statusEventSchema = z
  .object({
    equipmentId: requiredText,
    status: z.enum(['OPERATIONAL', 'BROKEN']),
    startedAt: requiredDate,
    endedAt: optionalDate,
    notes: optionalText,
  })
  .superRefine((value, context) => {
    if (value.endedAt && value.endedAt < value.startedAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endedAt'],
        message: 'A data final deve ser posterior ao início.',
      });
    }
  });

export const dashboardFilterSchema = z.object({
  start: optionalDate,
  end: optionalDate,
  brand: optionalText,
  allocatedBase: optionalText,
  search: optionalText,
});

export type EquipmentInput = z.infer<typeof equipmentSchema>;
export type EquipmentUpdateInput = z.infer<typeof equipmentUpdateSchema>;
export type StatusEventInput = z.infer<typeof statusEventSchema>;
export type DashboardFilterInput = z.infer<typeof dashboardFilterSchema>;