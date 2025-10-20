import Badge from '@/components/ui/badge/Badge'

interface InvoiceStatusBadgeProps {
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'draft'
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success'
      case 'pending':
        return 'warning'
      case 'overdue':
        return 'error'
      case 'cancelled':
        return 'light'
      case 'draft':
        return 'info'
      default:
        return 'light'
    }
  }

  return (
    <Badge color={getStatusColor(status)} variant="light">
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}