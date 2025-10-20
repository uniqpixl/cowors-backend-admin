'use client';

import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Clock, 
  User, 
  MapPin, 
  Star, 
  DollarSign,
  Users,
  Calendar,
  Shield,
  MessageSquare,
  Send,
  X,
  Eye,
  Building,
  Loader2
} from 'lucide-react';

// UI Components
import { Modal, Button, Badge, Avatar, Textarea } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

// Types
import { AdminSpace, SpaceApprovalData } from '@/types/admin-spaces';

// Utils
import { formatDate, formatCurrency, formatSpaceId } from '@/utils/formatters';

interface SpaceApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  space: AdminSpace;
  onApprove: (data: SpaceApprovalData) => Promise<void>;
  onReject: (data: SpaceApprovalData) => Promise<void>;
}

// Approval checklist items
const approvalChecklist = [
  {
    id: 'basic_info',
    label: 'Basic Information Complete',
    description: 'Name, description, location, and contact details are provided'
  },
  {
    id: 'images',
    label: 'Quality Images Provided',
    description: 'At least 3 high-quality images showing the space clearly'
  },
  {
    id: 'pricing',
    label: 'Pricing Information',
    description: 'Clear and competitive pricing structure'
  },
  {
    id: 'amenities',
    label: 'Amenities Listed',
    description: 'Comprehensive list of available amenities'
  },
  {
    id: 'operating_hours',
    label: 'Operating Hours',
    description: 'Clear operating hours and availability'
  },
  {
    id: 'safety_compliance',
    label: 'Safety & Compliance',
    description: 'Meets safety standards and local regulations'
  },
  {
    id: 'partner_verification',
    label: 'Partner Verification',
    description: 'Partner identity and business credentials verified'
  },
  {
    id: 'location_accuracy',
    label: 'Location Accuracy',
    description: 'Address and location details are accurate'
  }
];

// Common rejection reasons
const rejectionReasons = [
  'Incomplete basic information',
  'Poor quality or insufficient images',
  'Unclear or unrealistic pricing',
  'Missing essential amenities information',
  'Unclear operating hours',
  'Safety or compliance concerns',
  'Unverified partner credentials',
  'Inaccurate location information',
  'Duplicate listing',
  'Inappropriate content',
  'Does not meet quality standards',
  'Other (specify in comments)'
];

export const SpaceApprovalModal: React.FC<SpaceApprovalModalProps> = ({
  isOpen,
  onClose,
  space,
  onApprove,
  onReject
}) => {
  const [activeAction, setActiveAction] = useState<'approve' | 'reject' | null>(null);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comments, setComments] = useState('');
  const [notifyPartner, setNotifyPartner] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChecklistChange = (itemId: string, checked: boolean) => {
    setCheckedItems(prev => 
      checked 
        ? [...prev, itemId]
        : prev.filter(id => id !== itemId)
    );
  };

  const handleReasonChange = (reason: string, checked: boolean) => {
    setSelectedReasons(prev => 
      checked 
        ? [...prev, reason]
        : prev.filter(r => r !== reason)
    );
  };

  const handleApprove = async () => {
    if (checkedItems.length < approvalChecklist.length * 0.8) {
      alert('Please ensure most checklist items are verified before approving.');
      return;
    }

    setIsSubmitting(true);
    try {
      const approvalData: SpaceApprovalData = {
        action: 'approve',
        comments,
        checklist: checkedItems,
        notifyPartner,
        approvedBy: 'current-admin', // This should come from auth context
        approvedAt: new Date().toISOString()
      };

      await onApprove(approvalData);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Approval failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (selectedReasons.length === 0 && !comments.trim()) {
      alert('Please provide at least one rejection reason or comment.');
      return;
    }

    setIsSubmitting(true);
    try {
      const rejectionData: SpaceApprovalData = {
        action: 'reject',
        comments,
        rejectionReasons: selectedReasons,
        notifyPartner,
        rejectedBy: 'current-admin', // This should come from auth context
        rejectedAt: new Date().toISOString()
      };

      await onReject(rejectionData);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Rejection failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setActiveAction(null);
    setCheckedItems([]);
    setSelectedReasons([]);
    setComments('');
    setNotifyPartner(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!space) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <div className="flex flex-col h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Space Approval Review
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Review and approve or reject space listing
              </p>
            </div>
          </div>
          
          <Button variant="outline" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {/* Space Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Space Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {space.gallery?.[0]?.url ? (
                        <img
                          src={space.gallery[0].url}
                          alt={space.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {space.name}
                        </h3>
                        <Badge variant="warning" className="bg-yellow-100 text-yellow-800">
                          Pending Approval
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {space.location?.city || space.city}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {space.capacity?.total || space.capacity} people
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {formatCurrency(space.pricing?.hourlyRate || space.hourlyRate || 0)}/hr
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {formatDate(space.submittedAt || space.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      {space.partner && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <Avatar
                            src={space.partner.avatar}
                            alt={space.partner.name}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {space.partner.businessName || space.partner.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {space.partner.email}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Selection */}
              {!activeAction && (
                <Card>
                  <CardHeader>
                    <CardTitle>Choose Action</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        onClick={() => setActiveAction('approve')}
                        className="h-20 bg-green-600 hover:bg-green-700 text-white flex flex-col items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-6 h-6" />
                        <span>Approve Space</span>
                      </Button>
                      
                      <Button
                        onClick={() => setActiveAction('reject')}
                        variant="destructive"
                        className="h-20 flex flex-col items-center justify-center gap-2"
                      >
                        <XCircle className="w-6 h-6" />
                        <span>Reject Space</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Approval Form */}
              {activeAction === 'approve' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      Approve Space
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Approval Checklist */}
                    <div>
                      <Label className="text-base font-medium mb-3 block">
                        Approval Checklist
                      </Label>
                      <div className="space-y-3">
                        {approvalChecklist.map((item) => (
                          <div key={item.id} className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <Checkbox
                              id={item.id}
                              checked={checkedItems.includes(item.id)}
                              onCheckedChange={(checked) => handleChecklistChange(item.id, checked as boolean)}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={item.id}
                                className="font-medium text-gray-900 dark:text-white cursor-pointer"
                              >
                                {item.label}
                              </label>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-green-700 dark:text-green-300">
                          <strong>Progress:</strong> {checkedItems.length} of {approvalChecklist.length} items verified
                        </p>
                      </div>
                    </div>

                    {/* Comments */}
                    <div>
                      <Label htmlFor="approval-comments" className="text-base font-medium mb-2 block">
                        Approval Comments (Optional)
                      </Label>
                      <Textarea
                        id="approval-comments"
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Add any comments or notes about the approval..."
                        rows={4}
                        className="w-full"
                      />
                    </div>

                    {/* Notification Option */}
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="notify-partner-approve"
                        checked={notifyPartner}
                        onCheckedChange={(checked) => setNotifyPartner(checked as boolean)}
                      />
                      <label
                        htmlFor="notify-partner-approve"
                        className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                      >
                        Notify partner via email about approval
                      </label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="outline"
                        onClick={() => setActiveAction(null)}
                        disabled={isSubmitting}
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleApprove}
                        disabled={isSubmitting || checkedItems.length < approvalChecklist.length * 0.8}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Approve Space
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Rejection Form */}
              {activeAction === 'reject' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <XCircle className="w-5 h-5" />
                      Reject Space
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Rejection Reasons */}
                    <div>
                      <Label className="text-base font-medium mb-3 block">
                        Rejection Reasons
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {rejectionReasons.map((reason) => (
                          <div key={reason} className="flex items-center gap-3">
                            <Checkbox
                              id={`reason-${reason}`}
                              checked={selectedReasons.includes(reason)}
                              onCheckedChange={(checked) => handleReasonChange(reason, checked as boolean)}
                            />
                            <label
                              htmlFor={`reason-${reason}`}
                              className="text-sm text-gray-900 dark:text-white cursor-pointer"
                            >
                              {reason}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Comments */}
                    <div>
                      <Label htmlFor="rejection-comments" className="text-base font-medium mb-2 block">
                        Additional Comments <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="rejection-comments"
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Provide detailed feedback about why this space is being rejected and what needs to be improved..."
                        rows={5}
                        className="w-full"
                        required
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Please provide constructive feedback to help the partner improve their listing.
                      </p>
                    </div>

                    {/* Notification Option */}
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="notify-partner-reject"
                        checked={notifyPartner}
                        onCheckedChange={(checked) => setNotifyPartner(checked as boolean)}
                      />
                      <label
                        htmlFor="notify-partner-reject"
                        className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                      >
                        Notify partner via email about rejection
                      </label>
                    </div>

                    {/* Warning */}
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-red-800 dark:text-red-200">
                            Important Notice
                          </h4>
                          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                            Rejecting this space will notify the partner and they will need to resubmit 
                            after addressing the issues. Please ensure your feedback is clear and actionable.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="outline"
                        onClick={() => setActiveAction(null)}
                        disabled={isSubmitting}
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleReject}
                        disabled={isSubmitting || (selectedReasons.length === 0 && !comments.trim())}
                        variant="destructive"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Reject Space
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </Modal>
  );
};

export default SpaceApprovalModal;