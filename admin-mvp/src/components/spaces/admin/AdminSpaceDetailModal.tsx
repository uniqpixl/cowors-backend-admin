'use client';

import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Users, 
  Clock, 
  Star, 
  Calendar, 
  DollarSign, 
  Wifi, 
  Coffee, 
  Car, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
  Download,
  Share2,
  TrendingUp,
  Activity,
  BarChart3,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  Building,
  CreditCard,
  Package,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// UI Components
import { Modal, Button, Badge, Avatar, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// Types
import { AdminSpace } from '@/types/admin-spaces';

// Utils
import { formatDate, formatCurrency, formatSpaceId } from '@/utils/formatters';

interface AdminSpaceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  space: AdminSpace;
  onEdit?: (space: AdminSpace) => void;
  onDelete?: (space: AdminSpace) => void;
  onApprove?: (space: AdminSpace) => void;
  onReject?: (space: AdminSpace) => void;
}

// Helper functions
const getStatusBadge = (status: string, approvalStatus?: string) => {
  if (approvalStatus === 'pending') {
    return <Badge variant="warning" className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>;
  }
  
  switch (status) {
    case 'Active':
      return <Badge variant="success" className="bg-green-100 text-green-800">Active</Badge>;
    case 'Inactive':
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>;
    case 'Maintenance':
      return <Badge variant="warning" className="bg-orange-100 text-orange-800">Maintenance</Badge>;
    case 'suspended':
      return <Badge variant="destructive" className="bg-red-100 text-red-800">Suspended</Badge>;
    case 'rejected':
      return <Badge variant="destructive" className="bg-red-100 text-red-800">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getAmenityIcon = (amenity: string) => {
  const iconClass = "w-4 h-4";
  
  switch (amenity.toLowerCase()) {
    case 'wifi':
    case 'internet':
      return <Wifi className={iconClass} />;
    case 'coffee':
    case 'refreshments':
      return <Coffee className={iconClass} />;
    case 'parking':
      return <Car className={iconClass} />;
    case 'security':
      return <Shield className={iconClass} />;
    case 'air conditioning':
    case 'ac':
      return <Activity className={iconClass} />;
    default:
      return <CheckCircle className={iconClass} />;
  }
};

const ImageGallery: React.FC<{ images: any[]; spaceName: string }> = ({ images, spaceName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">No images available</p>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative">
      <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={images[currentIndex]?.url || images[currentIndex]}
          alt={`${spaceName} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />
        
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
      
      {images.length > 1 && (
        <div className="flex justify-center mt-3 gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-[#d4203d]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const AdminSpaceDetailModal: React.FC<AdminSpaceDetailModalProps> = ({
  isOpen,
  onClose,
  space,
  onEdit,
  onDelete,
  onApprove,
  onReject
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!space) return null;

  const canApprove = space.approvalStatus === 'pending' && onApprove;
  const canReject = space.approvalStatus === 'pending' && onReject;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex flex-col h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {space.name}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatSpaceId(space.id)}
                </span>
                {getStatusBadge(space.status, space.approvalStatus)}
                {space.featured && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    Featured
                  </Badge>
                )}
                {space.verified && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {canApprove && (
              <Button
                size="sm"
                onClick={() => onApprove(space)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
            )}
            {canReject && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject(space)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            )}
            {onEdit && (
              <Button size="sm" variant="outline" onClick={() => onEdit(space)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5 mx-6 mt-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="partner">Partner</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 px-6 pb-6">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Image Gallery */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Gallery
                    </h3>
                    <ImageGallery images={space.gallery || []} spaceName={space.name} />
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Basic Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {space.location?.address || space.address}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {space.location?.city || space.city}, {space.location?.state || space.state}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            Capacity: {space.capacity?.total || space.capacity} people
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            {formatCurrency(space.pricing?.hourlyRate || space.hourlyRate || 0)}/hour
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Star className="w-5 h-5 text-yellow-400 fill-current" />
                          <span className="text-gray-900 dark:text-white">
                            {space.rating?.average?.toFixed(1) || 'No rating'} 
                            {space.rating?.count && ` (${space.rating.count} reviews)`}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            Created: {formatDate(space.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Operating Hours */}
                    {space.operatingHours && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Operating Hours
                        </h4>
                        <div className="space-y-1 text-sm">
                          {Object.entries(space.operatingHours).map(([day, hours]) => (
                            <div key={day} className="flex justify-between">
                              <span className="capitalize text-gray-600 dark:text-gray-400">{day}:</span>
                              <span className="text-gray-900 dark:text-white">
                                {typeof hours === 'object' && hours ? 
                                  `${hours.open} - ${hours.close}` : 
                                  hours || 'Closed'
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {space.description && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Description
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {space.description}
                    </p>
                  </div>
                )}

                {/* Amenities */}
                {space.amenities && space.amenities.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Amenities
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {space.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          {getAmenityIcon(typeof amenity === 'string' ? amenity : amenity.name)}
                          <span className="text-sm text-gray-900 dark:text-white">
                            {typeof amenity === 'string' ? amenity : amenity.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Packages */}
                  {space.packages && space.packages.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          Packages
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {space.packages.map((pkg, index) => (
                          <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">{pkg.name}</h4>
                              <span className="font-semibold text-[#d4203d]">
                                {formatCurrency(pkg.price)}
                              </span>
                            </div>
                            {pkg.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {pkg.description}
                              </p>
                            )}
                            {pkg.duration && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Duration: {pkg.duration}
                              </p>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Add-ons */}
                  {space.addOns && space.addOns.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Plus className="w-5 h-5" />
                          Add-ons
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {space.addOns.map((addon, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">{addon.name}</h4>
                              {addon.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {addon.description}
                                </p>
                              )}
                            </div>
                            <span className="font-semibold text-[#d4203d]">
                              {formatCurrency(addon.price)}
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Approval Information */}
                {space.approvalStatus && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Approval Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Status
                          </label>
                          <div className="mt-1">
                            {getStatusBadge(space.status, space.approvalStatus)}
                          </div>
                        </div>
                        {space.submittedAt && (
                          <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Submitted
                            </label>
                            <p className="text-gray-900 dark:text-white">
                              {formatDate(space.submittedAt)}
                            </p>
                          </div>
                        )}
                        {space.approvedAt && (
                          <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Approved
                            </label>
                            <p className="text-gray-900 dark:text-white">
                              {formatDate(space.approvedAt)}
                            </p>
                          </div>
                        )}
                        {space.rejectedAt && (
                          <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Rejected
                            </label>
                            <p className="text-gray-900 dark:text-white">
                              {formatDate(space.rejectedAt)}
                            </p>
                          </div>
                        )}
                      </div>
                      {space.rejectionReason && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Rejection Reason
                          </label>
                          <p className="text-gray-900 dark:text-white mt-1">
                            {space.rejectionReason}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Partner Tab */}
              <TabsContent value="partner" className="space-y-6 mt-6">
                {space.partner && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        Partner Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar
                          src={space.partner.avatar}
                          alt={space.partner.name}
                          size="lg"
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {space.partner.businessName || space.partner.name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            {space.partner.email}
                          </p>
                          {space.partner.phone && (
                            <p className="text-gray-600 dark:text-gray-400">
                              {space.partner.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Partner ID
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {space.partner.id}
                          </p>
                        </div>
                        {space.partner.businessType && (
                          <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Business Type
                            </label>
                            <p className="text-gray-900 dark:text-white">
                              {space.partner.businessType}
                            </p>
                          </div>
                        )}
                        {space.partner.joinedAt && (
                          <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Joined
                            </label>
                            <p className="text-gray-900 dark:text-white">
                              {formatDate(space.partner.joinedAt)}
                            </p>
                          </div>
                        )}
                        {space.partner.totalSpaces && (
                          <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Total Spaces
                            </label>
                            <p className="text-gray-900 dark:text-white">
                              {space.partner.totalSpaces}
                            </p>
                          </div>
                        )}
                      </div>

                      {space.partner.description && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Description
                          </label>
                          <p className="text-gray-900 dark:text-white mt-1">
                            {space.partner.description}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6 mt-6">
                {space.analytics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Total Bookings
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {space.analytics.totalBookings || 0}
                            </p>
                          </div>
                          <BarChart3 className="w-8 h-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Total Revenue
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {formatCurrency(space.analytics.totalRevenue || 0)}
                            </p>
                          </div>
                          <DollarSign className="w-8 h-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Occupancy Rate
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {space.analytics.occupancyRate || 0}%
                            </p>
                          </div>
                          <TrendingUp className="w-8 h-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-6 mt-6">
                {space.reviews && space.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {space.reviews.map((review, index) => (
                      <Card key={index}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar
                              src={review.user?.avatar}
                              alt={review.user?.name}
                              size="sm"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-white">
                                    {review.user?.name || 'Anonymous'}
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-4 h-4 ${
                                            i < review.rating
                                              ? 'text-yellow-400 fill-current'
                                              : 'text-gray-300 dark:text-gray-600'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      {formatDate(review.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {review.comment && (
                                <p className="text-gray-600 dark:text-gray-400">
                                  {review.comment}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Reviews Yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      This space hasn't received any reviews yet.
                    </p>
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>
    </Modal>
  );
};

export default AdminSpaceDetailModal;