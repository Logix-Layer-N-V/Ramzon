import { z } from 'zod';

export const ClientSchema = z.object({
  name:      z.string().min(1, 'Name is required'),
  company:   z.string().optional(),
  email:     z.string().email('Valid email required'),
  phone:     z.string().optional(),
  address:   z.string().optional(),
  vatNumber: z.string().optional(),
});

export const LineItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  qty:         z.number().positive('Qty must be > 0'),
  price:       z.number().min(0, 'Price must be ≥ 0'),
});

export const InvoiceSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  date:     z.string().min(1, 'Date is required'),
  dueDate:  z.string().min(1, 'Due date is required'),
  items:    z.array(LineItemSchema).min(1, 'At least one item required'),
});

export const QuoteSchema = z.object({
  clientId:   z.string().min(1, 'Client is required'),
  date:       z.string().min(1, 'Date is required'),
  validUntil: z.string().min(1, 'Valid until date is required'),
  items:      z.array(LineItemSchema).min(1, 'At least one item required'),
});

export type ClientFormData  = z.infer<typeof ClientSchema>;
export type InvoiceFormData = z.infer<typeof InvoiceSchema>;
export type QuoteFormData   = z.infer<typeof QuoteSchema>;
