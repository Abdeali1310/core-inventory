'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2, Save, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createReceipt } from '@/lib/actions/receipts';

const receiptLineSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  expected_qty: z.coerce.number().min(1, 'Quantity must be at least 1'),
});

const receiptSchema = z.object({
  supplier_name: z.string().min(1, 'Supplier name is required'),
  destination_location_id: z.string().min(1, 'Destination location is required'),
  scheduled_date: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(receiptLineSchema).min(1, 'At least one line item is required'),
});

type ReceiptFormData = z.infer<typeof receiptSchema>;

interface LocationOption {
  id: string;
  name: string;
  warehouse_id: string;
  warehouse_name: string;
  is_active: boolean;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  category_id: string | null;
  category_name?: string;
  unit_of_measure: string;
  reorder_point: number;
  reorder_qty: number;
  is_active: boolean;
  total_stock: number;
}

interface ReceiptFormProps {
  locations: LocationOption[];
  products: ProductOption[];
  reference: string;
}

export default function ReceiptForm({ locations, products, reference }: ReceiptFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptSchema) as any,
    defaultValues: {
      supplier_name: '',
      destination_location_id: '',
      scheduled_date: '',
      notes: '',
      lines: [{ product_id: '', expected_qty: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  const watchedLines = watch('lines');

  const locationOptions = locations.map(loc => ({
    value: loc.id,
    label: `${loc.name} (${loc.warehouse_name})`,
  }));

  const productOptions = products.map(p => ({
    value: p.id,
    label: `${p.sku} - ${p.name}`,
    uom: p.unit_of_measure,
  }));

  const onSubmit = async (data: ReceiptFormData) => {
    setIsSubmitting(true);
    try {
      const validLines = data.lines.filter(line => line.product_id && line.expected_qty > 0);
      const result = await createReceipt({
        supplier_name: data.supplier_name,
        destination_location_id: data.destination_location_id,
        scheduled_date: data.scheduled_date || undefined,
        notes: data.notes || undefined,
        lines: validLines.map(l => ({
          product_id: l.product_id,
          expected_qty: l.expected_qty,
        })),
      });
      toast.success('Receipt created successfully');
      router.push(`/receipts/${result.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSaveAsDraft = handleSubmit(onSubmit);

  const onSaveAndReady = handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      const validLines = data.lines.filter(line => line.product_id && line.expected_qty > 0);
      const result = await createReceipt({
        supplier_name: data.supplier_name,
        destination_location_id: data.destination_location_id,
        scheduled_date: data.scheduled_date || undefined,
        notes: data.notes || undefined,
        lines: validLines.map(l => ({
          product_id: l.product_id,
          expected_qty: l.expected_qty,
        })),
      });
      toast.success('Receipt created and marked as ready');
      router.push(`/receipts/${result.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create receipt');
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">New Receipt</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Receipt Details</CardTitle>
              <CardDescription>Enter the receipt header information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Reference</Label>
                <Input value={reference} disabled className="font-mono" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_name">Supplier Name *</Label>
                <Input
                  id="supplier_name"
                  {...register('supplier_name')}
                  placeholder="Enter supplier name"
                />
                {errors.supplier_name && (
                  <p className="text-sm text-destructive">{errors.supplier_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination_location_id">Destination Location *</Label>
                <Select
                  onValueChange={(value) => setValue('destination_location_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((loc) => (
                      <SelectItem key={loc.value} value={loc.value}>
                        {loc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.destination_location_id && (
                  <p className="text-sm text-destructive">{errors.destination_location_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled_date">Scheduled Date</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  {...register('scheduled_date')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Optional notes..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Line Items</CardTitle>
                <CardDescription>Products to receive</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ product_id: '', expected_qty: 1 })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No line items. Click &quot;Add Product&quot; to add one.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Expected Qty</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const selectedProduct = productOptions.find(
                        p => p.value === watchedLines[index]?.product_id
                      );
                      return (
                        <TableRow key={field.id}>
                          <TableCell>
                            <Select
                              value={watchedLines[index]?.product_id || ''}
                              onValueChange={(value) => {
                                setValue(`lines.${index}.product_id`, value);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {productOptions.map((product) => (
                                  <SelectItem key={product.value} value={product.value}>
                                    {product.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.lines?.[index]?.product_id && (
                              <p className="text-xs text-destructive mt-1">
                                {errors.lines[index]?.product_id?.message}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              {...register(`lines.${index}.expected_qty`)}
                              className="w-24"
                            />
                            {selectedProduct && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {selectedProduct.uom}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              disabled={fields.length === 1}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
              {errors.lines && typeof errors.lines.message === 'string' && (
                <p className="text-sm text-destructive mt-2">{errors.lines.message}</p>
              )}

              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Total lines: {fields.length} | Total expected units:{' '}
                  {watchedLines.reduce((sum, line) => sum + (line.expected_qty || 0), 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="secondary"
            onClick={onSaveAsDraft}
            disabled={isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={onSaveAndReady}
            disabled={isSubmitting}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Save & Mark Ready
          </Button>
        </div>
      </form>
    </div>
  );
}
