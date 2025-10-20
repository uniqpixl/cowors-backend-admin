// Currency formatting utility
export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper function to format date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Helper function to format date and time
export const formatDateTime = (dateTime: string) => {
  const date = new Date(dateTime);
  const formattedDate = date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const formattedTime = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return { date: formattedDate, time: formattedTime };
};

// Helper function to get status color
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'verified':
    case 'valid':
      return 'success';
    case 'pending':
    case 'processing':
      return 'warning';
    case 'inactive':
    case 'suspended':
    case 'rejected':
    case 'invalid':
      return 'danger';
    default:
      return 'secondary';
  }
};