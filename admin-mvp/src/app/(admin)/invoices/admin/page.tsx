'use client';

import { useState } from "react";
import AdminInvoiceListContent from "../../../../components/invoices/admin/AdminInvoiceListContent";
import AdminInvoiceDetailModal from "../../../../components/invoices/admin/AdminInvoiceDetailModal";
import { AdminInvoice } from "../../../../hooks/useAdminInvoices";

export default function AdminInvoicesPage() {
  const [selectedInvoice, setSelectedInvoice] = useState<AdminInvoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleViewInvoice = (invoice: AdminInvoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
  };

  const handleCreateInvoice = () => {
    // TODO: Implement create invoice functionality
    console.log('Create invoice clicked');
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedInvoice(null);
  };

  const handleInvoiceUpdated = () => {
    // Refresh the invoice list by triggering a re-fetch
    // This will be handled by React Query's cache invalidation
  };

  return (
    <div className="space-y-6">
      <AdminInvoiceListContent 
        onViewInvoice={handleViewInvoice}
        onCreateInvoice={handleCreateInvoice}
      />
      
      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <AdminInvoiceDetailModal
          invoice={selectedInvoice}
          isOpen={showDetailModal}
          onClose={handleCloseDetailModal}
          onInvoiceUpdated={handleInvoiceUpdated}
        />
      )}
    </div>
  );
}