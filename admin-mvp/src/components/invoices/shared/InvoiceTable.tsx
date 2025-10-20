import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import Checkbox from '@/components/form/input/Checkbox'
import Button from '@/components/ui/button/Button'
import { Eye, Download } from 'lucide-react'
import { InvoiceStatusBadge } from './InvoiceStatusBadge'
import React from 'react'

interface BaseInvoice {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'draft'
  issuedDate: string
  dueDate: string
}

interface InvoiceTableProps<T extends BaseInvoice> {
  invoices: T[]
  selectedInvoices: string[]
  onSelectInvoice: (invoiceId: string) => void
  onSelectAll: (checked: boolean) => void
  sortField: keyof T | null
  sortDirection: 'asc' | 'desc'
  onSort: (field: keyof T) => void
  formatCurrency: (amount: number, currency: string) => string
  formatDate: (date: string) => string
  renderCustomColumns?: (invoice: T) => React.ReactNode
  customHeaders?: string[]
}

export function InvoiceTable<T extends BaseInvoice>({
  invoices,
  selectedInvoices,
  onSelectInvoice,
  onSelectAll,
  sortField,
  sortDirection,
  onSort,
  formatCurrency,
  formatDate,
  renderCustomColumns,
  customHeaders = []
}: InvoiceTableProps<T>) {
  const getSortIcon = (field: keyof T) => {
    if (sortField !== field) return '↕️'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell isHeader className="w-12">
              <Checkbox
                checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                onChange={onSelectAll}
              />
            </TableCell>
            <TableCell isHeader>
              <div 
                className="cursor-pointer hover:bg-gray-50 flex items-center gap-1"
                onClick={() => onSort('invoiceNumber' as keyof T)}
              >
                <span>Invoice #</span>
                <span>{getSortIcon('invoiceNumber' as keyof T)}</span>
              </div>
            </TableCell>
            <TableCell isHeader>
              <div 
                className="cursor-pointer hover:bg-gray-50 flex items-center gap-1"
                onClick={() => onSort('amount' as keyof T)}
              >
                <span>Amount</span>
                <span>{getSortIcon('amount' as keyof T)}</span>
              </div>
            </TableCell>
            <TableCell isHeader>
              <div 
                className="cursor-pointer hover:bg-gray-50 flex items-center gap-1"
                onClick={() => onSort('status' as keyof T)}
              >
                <span>Status</span>
                <span>{getSortIcon('status' as keyof T)}</span>
              </div>
            </TableCell>
            <TableCell isHeader>
              <div 
                className="cursor-pointer hover:bg-gray-50 flex items-center gap-1"
                onClick={() => onSort('issuedDate' as keyof T)}
              >
                <span>Issued Date</span>
                <span>{getSortIcon('issuedDate' as keyof T)}</span>
              </div>
            </TableCell>
            <TableCell isHeader>
              <div 
                className="cursor-pointer hover:bg-gray-50 flex items-center gap-1"
                onClick={() => onSort('dueDate' as keyof T)}
              >
                <span>Due Date</span>
                <span>{getSortIcon('dueDate' as keyof T)}</span>
              </div>
            </TableCell>
            {customHeaders.map((header, index) => (
              <TableCell isHeader key={index}>{header}</TableCell>
            ))}
            <TableCell isHeader>Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>
                <Checkbox
                  checked={selectedInvoices.includes(invoice.id)}
                  onChange={() => onSelectInvoice(invoice.id)}
                />
              </TableCell>
              <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
              <TableCell>{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
              <TableCell>
                <InvoiceStatusBadge status={invoice.status} />
              </TableCell>
              <TableCell>{formatDate(invoice.issuedDate)}</TableCell>
              <TableCell>{formatDate(invoice.dueDate)}</TableCell>
              {renderCustomColumns && (
                <>{renderCustomColumns(invoice)}</>
              )}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}