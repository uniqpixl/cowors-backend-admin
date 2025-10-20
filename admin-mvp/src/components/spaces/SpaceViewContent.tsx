"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { useModal } from "@/hooks/useModal";
import { Space } from "@/lib/api/types";
import { useSpace, useSpaceAnalytics } from "@/hooks/useSpaces";
import AvailabilityModal from "./AvailabilityModal";
import { formatSpaceId, isValidCoworsId, getIdType } from '@/utils/formatters';
import { 
  ArrowLeft,
  MapPin, 
  Star, 
  Users, 
  IndianRupee, 
  Clock, 
  Building2,
  Coffee,
  Briefcase,
  Calendar,
  Wine,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Globe,
  Wifi,
  Zap,
  Car,
  Shield,
  Printer,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Eye,
  AlertTriangle,
  Info,
  Table,
  UtensilsCrossed,
  TreePine,
  Music,
  Sun,
  Wind,
  Snowflake,
  Cookie,
  Droplets,
  Accessibility,
  Settings
} from "lucide-react";

interface SpaceViewContentProps {
  spaceId: string;
}

// Helper function to get space type icon
const getSpaceTypeIcon = (type: Space['type']) => {
  switch (type) {
    case 'cafe': return Coffee;
    case 'coworking': return Briefcase;
    case 'office': return Building2;
    case 'meeting': return Users;
    case 'event': return Calendar;
    case 'restobar': return Wine;
    default: return Building2;
  }
};

// Helper function to get status badge color
const getStatusBadgeColor = (status: Space['status']) => {
  switch (status) {
    case 'approved': return 'success';
    case 'pending': return 'warning';
    case 'rejected': return 'error';
    case 'suspended': return 'dark';
    default: return 'primary';
  }
};



// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};



// Helper function to get status alert info
const getStatusAlert = (space: Space) => {
  const alerts = [];
  
  // Check if any day has missing operating hours
  const hasIncompleteHours = Object.values(space.operatingHours || {}).some(
    (hours) => !hours?.open || !hours?.close || hours.open === 'closed'
  );
  if (hasIncompleteHours) {
    alerts.push({ type: 'warning', message: 'Operating hours missing' });
  }

  // Partner contact validation would go here if contactPhone/contactEmail were available
  
  if (space.status === 'pending') {
    alerts.push({ type: 'info', message: 'Awaiting approval' });
  }
  
  if (space.status === 'approved') {
    alerts.push({ type: 'success', message: 'Verified and active' });
  }
  
  return alerts;
};

// Default analytics data for fallback
const getDefaultAnalytics = () => {
  return {
    monthlyBookings: 0,
    occupancyRate: 0,
    totalRevenue: 0,
    trend: '0%',
    recentBookings: [],
    averageRating: 0,
    totalReviews: 0,
    peakHours: [],
    popularAmenities: []
  };
};

export default function SpaceViewContent({ spaceId }: SpaceViewContentProps) {
  // State management - must be before any early returns
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | 'suspend'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Modal states
  const { isOpen: isGalleryModalOpen, openModal: openGalleryModal, closeModal: closeGalleryModal } = useModal();
  const { isOpen: isAvailabilityModalOpen, openModal: openAvailabilityModal, closeModal: closeAvailabilityModal } = useModal();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isOpen: isApprovalModalOpen, openModal: openApprovalModal, closeModal: closeApprovalModal } = useModal();

  // Fetch space data from API
  const { data: space, isLoading, error } = useSpace(spaceId);
  
  // Fetch space analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useSpaceAnalytics(spaceId);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading space details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !space) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Space Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error ? 'Failed to load space details.' : 'The space you\'re looking for doesn\'t exist.'}
          </p>
          <Link href="/inventory/spaces">
            <Button variant="primary">Back to Spaces</Button>
          </Link>
        </div>
      </div>
    );
  }



  // Handle gallery navigation
  const nextImage = () => {
    if (space.gallery && space.gallery.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % space.gallery!.length);
    }
  };

  const prevImage = () => {
    if (space.gallery && space.gallery.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + space.gallery!.length) % space.gallery!.length);
    }
  };

  const TypeIcon = getSpaceTypeIcon(space.type);

  // Use analytics data with fallback
  const analytics = analyticsData || getDefaultAnalytics();
  const statusAlerts = getStatusAlert(space);

  // Handle approval confirmation
  const handleConfirmApproval = () => {
    // This would typically make an API call to update the space status
    console.log(`Space ${approvalAction}d with reason: ${rejectionReason}`);
    closeApprovalModal();
    setRejectionReason('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/inventory/spaces">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Spaces
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <TypeIcon className="w-6 h-6 text-brand-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{space.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-base text-gray-600 dark:text-gray-400">
                    {space.type ? `${space.type.charAt(0).toUpperCase() + space.type.slice(1)} Space` : 'Space'}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-500 font-mono">
                    ID: {formatSpaceId(space.id)}
                    {getIdType(space.id) === 'uuid' && (
                      <span className="ml-1 text-orange-500" title="Legacy UUID format">
                        ⚠️
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-brand-500 fill-current" />
                <span className="font-semibold text-gray-900 dark:text-white">{space.rating?.average || 'N/A'}</span>
                <span className="text-gray-500">({space.rating?.totalReviews || 0})</span>
              </div>
              <Badge color={getStatusBadgeColor(space.status)}>
                {space.status ? space.status.charAt(0).toUpperCase() + space.status.slice(1) : 'Unknown'}
              </Badge>
            </div>
          </div>
          

          
          {/* Status Alerts */}
          {statusAlerts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {statusAlerts.map((alert, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${
                    alert.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700' :
                    alert.type === 'success' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700' :
                'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
                  }`}
                >
                  {alert.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                  {alert.type === 'success' && <CheckCircle className="w-4 h-4" />}
                  {alert.type === 'info' && <Info className="w-4 h-4" />}
                  {alert.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Booking Analytics Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Booking Analytics</h2>
          {analyticsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-600 dark:text-brand-400">Monthly Bookings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.monthlyBookings}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{analytics.trend} from last month</p>
              </div>
              <BarChart3 className="w-6 h-6 text-brand-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-600 dark:text-brand-400">Occupancy Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.occupancyRate}%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Above average</p>
              </div>
              <TrendingUp className="w-6 h-6 text-brand-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-600 dark:text-brand-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{analytics.totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This month</p>
                </div>
                <IndianRupee className="w-6 h-6 text-brand-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-600 dark:text-brand-400">Recent Trend</p>
                  <div className="flex items-center gap-1 mt-2">
                    {analytics.recentBookings.map((day: any, index: number) => (
                      <div
                        key={index}
                        className="w-2 bg-brand-400 rounded-full"
                        style={{ height: `${day.count * 4 + 8}px` }}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-brand-600 dark:text-brand-400 mt-2">Last 5 days</p>
                </div>
                <Eye className="w-6 h-6 text-brand-500" />
              </div>
            </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Content Sections */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Overview</h2>
              </div>
              
              {/* Description */}
              <div className="p-5">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                    {space.description ? (
                      showFullDescription ? space.description : `${space.description.slice(0, 200)}...`
                    ) : (
                      'No description available'
                    )}
                  </p>
                  {space.description && space.description.length > 200 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-brand-500 hover:text-brand-600 font-medium mt-3"
                    >
                      {showFullDescription ? 'Show Less' : 'Read More'}
                    </button>
                  )}
                </div>
                
                {/* Key Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="p-1.5 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                        <MapPin className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                      </div>
                      <span className="text-sm text-gray-500">Location</span>
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">{space.location?.city || 'N/A'}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="p-1.5 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                        <Users className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                      </div>
                      <span className="text-sm text-gray-500">Capacity</span>
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">{space.capacity?.total || 'N/A'} people</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="p-1.5 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                        <IndianRupee className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                      </div>
                      <span className="text-sm text-gray-500">Starting Price</span>
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">₹{space.pricing?.startingPrice || 'N/A'}/hr</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="p-1.5 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                        <Clock className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                      </div>
                      <span className="text-sm text-gray-500">Hours</span>
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {space.operatingHours?.monday?.open && space.operatingHours?.monday?.close 
                        ? `${space.operatingHours.monday.open} - ${space.operatingHours.monday.close}`
                        : 'Not specified'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Gallery</h2>
              </div>
              
              <div className="overflow-hidden">
                <div className="relative h-80">
                  <Image
                    src={space.gallery?.[currentImageIndex]?.url || '/images/placeholder-space.jpg'}
                    alt={space.gallery?.[currentImageIndex]?.alt || space.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                    className="object-cover cursor-pointer"
                    onClick={openGalleryModal}
                  />
                  
                  {space.gallery && space.gallery.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {space.gallery && space.gallery.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                  
                  <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {space.gallery?.length || 0}
                  </div>
                </div>
                
                {space.gallery && space.gallery.length > 4 && (
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-4 gap-2">
                      {space.gallery.slice(0, 4).map((image, index) => (
                        <div
                          key={index}
                          className="relative h-20 rounded-lg overflow-hidden cursor-pointer"
                          onClick={() => setCurrentImageIndex(index)}
                        >
                          <Image
                            src={image.url}
                            alt={image.alt}
                            fill
                            sizes="(max-width: 768px) 25vw, (max-width: 1200px) 20vw, 15vw"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openGalleryModal}
                      className="w-full mt-3"
                    >
                      View All {space.gallery?.length || 0} Photos
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Space Options */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Space Options</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 3 Hour Pass */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">3 Hour Pass</h3>
                      <div className="flex items-center text-brand-500 font-semibold">
                        <IndianRupee className="w-4 h-4 mr-1" />
                        150
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">3 hour workspace access</p>
                    <p className="text-xs text-gray-400">Hover to see inclusions</p>
                  </div>

                  {/* 6 Hour Pass */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">6 Hour Pass</h3>
                      <div className="flex items-center text-brand-500 font-semibold">
                        <IndianRupee className="w-4 h-4 mr-1" />
                        250
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">6 hour workspace access</p>
                    <p className="text-xs text-gray-400">Hover to see inclusions</p>
                  </div>

                  {/* Day Pass */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">Day Pass</h3>
                      <div className="flex items-center text-brand-500 font-semibold">
                        <IndianRupee className="w-4 h-4 mr-1" />
                        400
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Full day workspace access</p>
                    <p className="text-xs text-gray-400">Hover to see inclusions</p>
                  </div>

                  {/* Weekend Pass */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">Weekend Pass</h3>
                      <div className="flex items-center text-brand-500 font-semibold">
                        <IndianRupee className="w-4 h-4 mr-1" />
                        600
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Weekend workspace access</p>
                    <p className="text-xs text-gray-400">Hover to see inclusions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Add-ons: Menu Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add-ons: Menu</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Hot Beverage */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">Hot Beverage</h3>
                      <div className="flex items-center text-brand-500 font-semibold">
                        <IndianRupee className="w-4 h-4 mr-1" />
                        40
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">e.g. Coffee, Tea</p>
                  </div>

                  {/* Cold Beverage */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">Cold Beverage</h3>
                      <div className="flex items-center text-brand-500 font-semibold">
                        <IndianRupee className="w-4 h-4 mr-1" />
                        80
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">e.g. Juice, Smoothie</p>
                  </div>

                  {/* Snacks */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">Snacks</h3>
                      <div className="flex items-center text-brand-500 font-semibold">
                        <IndianRupee className="w-4 h-4 mr-1" />
                        60
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">e.g. Cookies, Chips</p>
                  </div>

                  {/* Meal */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">Meal</h3>
                      <div className="flex items-center text-brand-500 font-semibold">
                        <IndianRupee className="w-4 h-4 mr-1" />
                        150
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">e.g. Sandwich, Pasta</p>
                  </div>

                  {/* Refillable Drink */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">Refillable Drink</h3>
                      <div className="flex items-center text-brand-500 font-semibold">
                        <IndianRupee className="w-4 h-4 mr-1" />
                        30
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">e.g. Coffee, Tea</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Amenities</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Available facilities and services</p>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="p-1.5 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                      <Wifi className="w-5 h-5 text-brand-500 dark:text-brand-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">High-Speed WiFi</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="p-1.5 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                      <Coffee className="w-5 h-5 text-brand-500 dark:text-brand-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Premium Coffee & Tea</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="p-1.5 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                      <Table className="w-5 h-5 text-brand-500 dark:text-brand-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Work-Friendly Tables</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="p-1.5 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                      <Zap className="w-5 h-5 text-brand-500 dark:text-brand-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Power Outlets</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="p-1.5 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                      <UtensilsCrossed className="w-5 h-5 text-brand-500 dark:text-brand-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Food & Beverages</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="p-1.5 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                      <TreePine className="w-5 h-5 text-brand-500 dark:text-brand-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Outdoor Seating</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="p-1.5 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                      <Music className="w-5 h-5 text-brand-500 dark:text-brand-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Ambient Music</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Sun className="w-5 h-5 text-brand-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Natural Lighting</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Wind className="w-5 h-5 text-brand-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Air Conditioning</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Volume2 className="w-5 h-5 text-brand-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Quiet Zones</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Coffee className="w-5 h-5 text-brand-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Espresso Machine</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Snowflake className="w-5 h-5 text-brand-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Cold Beverages</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Cookie className="w-5 h-5 text-brand-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Fresh Pastries</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Droplets className="w-5 h-5 text-brand-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Filtered Water</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Car className="w-5 h-5 text-brand-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Street Parking</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Accessibility className="w-5 h-5 text-brand-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Wheelchair Accessible</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Users className="w-5 h-5 text-brand-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Meeting Space</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Printer className="w-5 h-5 text-brand-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Printing Services</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reviews</h2>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-brand-500 fill-current" />
                      <span className="font-semibold text-gray-900 dark:text-white">{space.rating?.average || 'N/A'}</span>
                      <span className="text-gray-500">({space.rating?.totalReviews || 0} reviews)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Shield className="w-4 h-4 mr-2" />
                      Moderate
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                <div className="space-y-3">
                  {space.reviews && space.reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">{review.userName}</div>
                            <div className="text-xs text-gray-500">{formatDate(review.date)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.rating ? 'text-brand-500 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">{review.comment}</p>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="flex-1">
                    View All {space.reviews?.length || 0} Reviews
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    Review Analytics
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Quick Info</h3>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                      <MapPin className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Location</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{space.location?.address || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{space.location?.city || 'N/A'}, {space.location?.state || 'N/A'} {space.location?.pincode || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                      <Users className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Capacity</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{space.capacity?.total || 'N/A'} people</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                      <IndianRupee className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Starting Price</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">₹{space.pricing?.startingPrice || 'N/A'}/hour</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                      <Clock className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Operating Hours</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {space.operatingHours?.monday?.open && space.operatingHours?.monday?.close 
                          ? `${space.operatingHours.monday.open} - ${space.operatingHours.monday.close}`
                          : (
                            <span className="text-brand-600 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Not specified
                            </span>
                          )
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Partner Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Partner Information</h3>
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4 text-status-success-dark" />
                    <span className="text-xs text-status-success-dark font-medium">Verified</span>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                      <Building2 className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Business Name</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{space.partner?.businessName || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                      <Phone className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Contact Phone</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span className="text-brand-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Not provided
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                      <Mail className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Contact Email</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span className="text-brand-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Not provided
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                      <Globe className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Website</div>
                      <div className="text-sm mt-1">
                        <span className="text-brand-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Not provided
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link href={`/partner/view/${space.partner?.id || ''}`}>
                      <Button variant="outline" className="w-full">
                        View Partner Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Commission & Revenue */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Commission & Revenue</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Revenue sharing and commission settings</p>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  {/* Commission Rate */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                        <IndianRupee className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">Commission Rate</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Platform commission per booking</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-brand-600 dark:text-brand-400">15%</div>
                      <div className="text-xs text-gray-500">Standard rate</div>
                    </div>
                  </div>

                  {/* Monthly Revenue */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                        <span className="text-sm font-medium text-brand-900 dark:text-brand-100">Partner Revenue</span>
                      </div>
                      <div className="text-xl font-bold text-brand-600 dark:text-brand-400">₹1,06,250</div>
                      <div className="text-xs text-brand-700 dark:text-brand-300">This month</div>
                    </div>
                    <div className="p-3 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                        <span className="text-sm font-medium text-brand-900 dark:text-brand-100">Platform Revenue</span>
                      </div>
                      <div className="text-xl font-bold text-brand-600 dark:text-brand-400">₹18,750</div>
                      <div className="text-xs text-brand-700 dark:text-brand-300">This month</div>
                    </div>
                  </div>

                  {/* Commission Settings */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Commission Settings</span>
                      <Button variant="outline" size="sm" className="text-xs">
                        <Settings className="w-3 h-3 mr-1" />
                        Adjust
                      </Button>
                    </div>
                    <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Base commission rate:</span>
                        <span className="font-medium">15%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment processing fee:</span>
                        <span className="font-medium">2.9% + ₹3</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Next payout date:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">Jan 31, 2024</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Admin Settings</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Space management and configuration</p>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  {/* Visibility Settings */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                        <Eye className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">Visibility</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Control space visibility on platform</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-brand-600 dark:text-brand-400 font-medium">Public</span>
                      <Button variant="outline" size="sm" className="text-xs">
                        Change
                      </Button>
                    </div>
                  </div>

                  {/* Featured Status */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                        <Star className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">Featured Space</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Highlight in search results</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        space.featured ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {space.featured ? 'Featured' : 'Standard'}
                      </span>
                      <Button variant="outline" size="sm" className="text-xs">
                        Toggle
                      </Button>
                    </div>
                  </div>

                  {/* Booking Settings */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">Booking Configuration</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Advance booking limit:</span>
                        <span className="font-medium text-gray-900 dark:text-white">30 days</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Minimum booking duration:</span>
                        <span className="font-medium text-gray-900 dark:text-white">1 hour</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Cancellation policy:</span>
                        <span className="font-medium text-gray-900 dark:text-white">24 hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Pricing Controls</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage pricing and promotional offers</p>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  {/* Dynamic Pricing */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">Dynamic Pricing</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Automatic price adjustments based on demand</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Disabled</span>
                      <Button variant="outline" size="sm" className="text-xs">
                        Enable
                      </Button>
                    </div>
                  </div>

                  {/* Promotional Offers */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                        <IndianRupee className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">Active Promotions</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Special offers and discounts</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-brand-600 dark:text-brand-400 font-medium">2 Active</span>
                      <Button variant="outline" size="sm" className="text-xs">
                        Manage
                      </Button>
                    </div>
                  </div>

                  {/* Price Override */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Price Override</span>
                      <Button variant="outline" size="sm" className="text-xs">
                        <Settings className="w-3 h-3 mr-1" />
                        Configure
                      </Button>
                    </div>
                    <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Admin discount authority:</span>
                        <span className="font-medium">Up to 25%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Seasonal pricing:</span>
                        <span className="font-medium text-brand-600 dark:text-brand-400">Winter rates active</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bulk booking discount:</span>
                        <span className="font-medium">10% for 5+ hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Admin Actions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage this space efficiently</p>
              </div>
              <div className="p-5">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full border-brand-200 text-brand-700 hover:bg-brand-50 hover:border-brand-300 dark:border-brand-700 dark:text-brand-400 dark:hover:bg-brand-900/30" startIcon={<Edit className="w-4 h-4" />}>
                    Edit Space Details
                  </Button>
                  <Button variant="outline" className="w-full border-brand-200 text-brand-700 hover:bg-brand-50 hover:border-brand-300 dark:border-brand-700 dark:text-brand-400 dark:hover:bg-brand-900/30" startIcon={<MessageSquare className="w-4 h-4" />}>
                    Contact Partner
                  </Button>
                  <Button variant="outline" className="w-full border-brand-200 text-brand-700 hover:bg-brand-50 hover:border-brand-300 dark:border-brand-700 dark:text-brand-400 dark:hover:bg-brand-900/30" startIcon={<Calendar className="w-4 h-4" />}>
                    View Bookings
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-brand-200 text-brand-700 hover:bg-brand-50 hover:border-brand-300 dark:border-brand-700 dark:text-brand-400 dark:hover:bg-brand-900/30" 
                    startIcon={<Settings className="w-4 h-4" />}
                    onClick={openAvailabilityModal}
                  >
                    Manage Availability
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600" 
                    startIcon={<Trash2 className="w-4 h-4" />}
                  >
                    Delete Space
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      <Modal isOpen={isApprovalModalOpen} onClose={closeApprovalModal}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${
              approvalAction === 'approve' ? 'bg-status-success-light dark:bg-status-success-dark/30' :
              approvalAction === 'reject' ? 'bg-status-error-light dark:bg-status-error-dark/30' :
              'bg-status-warning-light dark:bg-status-warning-dark/30'
            }`}>
              {approvalAction === 'approve' && <CheckCircle className="w-6 h-6 text-status-success-dark" />}
              {approvalAction === 'reject' && <XCircle className="w-6 h-6 text-status-error-dark" />}
              {approvalAction === 'suspend' && <AlertTriangle className="w-6 h-6 text-status-warning-dark" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {approvalAction === 'approve' ? 'Approve Space' : 
                 approvalAction === 'reject' ? 'Reject Space' : 'Suspend Space'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{space.name}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Partner: <strong>{space.partner?.businessName || 'N/A'}</strong>
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              {approvalAction === 'approve' && 'Are you sure you want to approve this space? It will become available for bookings immediately.'}
              {approvalAction === 'reject' && 'Are you sure you want to reject this space? The partner will be notified of your decision.'}
              {approvalAction === 'suspend' && 'Are you sure you want to suspend this space? It will no longer be available for new bookings.'}
            </p>
          </div>
          
          {(approvalAction === 'reject' || approvalAction === 'suspend') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {approvalAction === 'reject' ? 'Rejection Reason' : 'Suspension Reason'}
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={`Please provide a reason for ${approvalAction}...`}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                required
              />
            </div>
          )}
          
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={closeApprovalModal}>
              Cancel
            </Button>
            <Button 
              variant={approvalAction === 'approve' ? 'primary' : 'outline'}
              className={approvalAction !== 'approve' ? 'bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600' : ''}
              onClick={handleConfirmApproval}
              disabled={(approvalAction === 'reject' || approvalAction === 'suspend') && !rejectionReason.trim()}
            >
              {approvalAction === 'approve' ? 'Approve Space' : 
               approvalAction === 'reject' ? 'Reject Space' : 'Suspend Space'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Gallery Modal */}
      <Modal isOpen={isGalleryModalOpen} onClose={closeGalleryModal}>
        <div className="p-6 max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Gallery - {space.name}</h3>
            <Button variant="outline" onClick={closeGalleryModal}>
              Close
            </Button>
          </div>
          
          <div className="relative h-96 mb-4">
            <Image
              src={space.gallery?.[currentImageIndex]?.url || '/images/placeholder-space.jpg'}
              alt={space.gallery?.[currentImageIndex]?.alt || space.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
              className="object-contain"
            />
          </div>
          
          <div className="grid grid-cols-6 gap-2">
            {space.gallery?.map((image, index) => (
              <div
                key={index}
                className={`relative h-16 rounded-lg overflow-hidden cursor-pointer border-2 ${
                  index === currentImageIndex ? 'border-brand-500' : 'border-transparent'
                }`}
                onClick={() => setCurrentImageIndex(index)}
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 768px) 20vw, (max-width: 1200px) 15vw, 10vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Availability Modal */}
      <AvailabilityModal
        isOpen={isAvailabilityModalOpen}
        onClose={closeAvailabilityModal}
        spaceId={space.id}
        spaceName={space.name}
      />
    </div>
  );
}