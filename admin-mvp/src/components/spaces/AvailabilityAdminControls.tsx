"use client";
import React, { useState, useEffect } from "react";
import { Calendar, Ban, CheckCircle, AlertTriangle, Settings } from "lucide-react";
import {
  AvailabilityOverride,
} from "@/types/availability";
import { formatDate } from "@/utils/formatters";

interface AvailabilityAdminControlsProps {
  spaceId: string;
  selectedDate: Date | null;
  overrides: AvailabilityOverride[];
  onOverrideAvailability: (override: Omit<AvailabilityOverride, 'id' | 'createdAt'>) => void;
  onBlockDate: (date: Date, reason: string) => void;
  onUnblockDate: (date: Date) => void;
}

const AvailabilityAdminControls: React.FC<AvailabilityAdminControlsProps> = ({
  spaceId,
  selectedDate,
  overrides,
  onOverrideAvailability,
  onBlockDate,
  onUnblockDate,
}) => {
  const [blockReason, setBlockReason] = useState('');
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideType, setOverrideType] = useState<'available' | 'unavailable'>('available');
  const [customTimeSlots, setCustomTimeSlots] = useState<string[]>([]);
  const [newTimeSlot, setNewTimeSlot] = useState({ start: '', end: '', price: 0 });

  useEffect(() => {
    if (!selectedDate) {
      setShowBlockForm(false);
      setShowOverrideForm(false);
      setBlockReason('');
      setCustomTimeSlots([]);
    }
  }, [selectedDate]);

  const handleBlockDate = () => {
    if (selectedDate && blockReason.trim()) {
      onBlockDate(selectedDate, blockReason.trim());
      setBlockReason('');
      setShowBlockForm(false);
    }
  };

  const handleUnblockDate = () => {
    if (selectedDate) {
      onUnblockDate(selectedDate);
    }
  };

  // Check if date is currently blocked
  const isDateBlocked = selectedDate 
    ? overrides.some(o => 
        o.date.toDateString() === selectedDate.toDateString() && !o.isAvailable
      )
    : false;

  const handleOverrideAvailability = () => {
    if (selectedDate) {
      onOverrideAvailability({
        spaceId,
        date: selectedDate,
        isAvailable: overrideType === 'available',
        reason: `Admin override: ${overrideType}`,
        createdBy: 'admin',
      });
      setShowOverrideForm(false);
      setCustomTimeSlots([]);
    }
  };

  const addTimeSlot = () => {
    if (newTimeSlot.start && newTimeSlot.end && newTimeSlot.price > 0) {
      const timeSlotString = `${newTimeSlot.start}-${newTimeSlot.end} ($${newTimeSlot.price})`;
      setCustomTimeSlots(prev => [...prev, timeSlotString]);
      setNewTimeSlot({ start: '', end: '', price: 0 });
    }
  };

  const removeTimeSlot = (index: number) => {
    setCustomTimeSlots(prev => prev.filter((_, i) => i !== index));
  };



  const commonBlockReasons = [
    'Maintenance',
    'Private Event',
    'Staff Training',
    'Equipment Repair',
    'Holiday Closure',
    'Deep Cleaning',
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-brand-500" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Admin Controls
        </h3>
      </div>

      {!selectedDate ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Select a date on the calendar to manage its availability
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Selected Date Info */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-brand-500" />
              <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                Selected Date
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedDate ? formatDate(selectedDate.toISOString()) : 'No date selected'}
            </p>
            {isDateBlocked && (
              <div className="mt-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <Ban className="w-3 h-3" />
                Currently blocked
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-800 dark:text-white/90">
              Quick Actions
            </h4>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setShowOverrideForm(!showOverrideForm)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/20 dark:hover:bg-gray-900/30 text-gray-700 dark:text-gray-400 rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Override Availability
              </button>
              
              <button
                onClick={() => setShowBlockForm(!showBlockForm)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg transition-colors"
              >
                <Ban className="w-4 h-4" />
                Block Date
              </button>
              
              <button
                onClick={handleUnblockDate}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Unblock Date
              </button>
            </div>
          </div>

          {/* Override Form */}
          {showOverrideForm && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
              <h5 className="text-sm font-medium text-gray-800 dark:text-white/90">
                Override Availability
              </h5>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Override Type
                  </label>
                  <select
                    value={overrideType}
                    onChange={(e) => setOverrideType(e.target.value as 'available' | 'unavailable')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white/90 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  >
                    <option value="available">Make Available</option>
                    <option value="unavailable">Make Unavailable</option>
                  </select>
                </div>

                {overrideType === 'available' && (
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Custom Time Slots
                    </div>
                    
                    {/* Add Time Slot */}
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="time"
                        value={newTimeSlot.start}
                        onChange={(e) => setNewTimeSlot(prev => ({ ...prev, start: e.target.value }))}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white/90"
                        placeholder="Start"
                      />
                      <input
                        type="time"
                        value={newTimeSlot.end}
                        onChange={(e) => setNewTimeSlot(prev => ({ ...prev, end: e.target.value }))}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white/90"
                        placeholder="End"
                      />
                      <input
                        type="number"
                        value={newTimeSlot.price ?? ''}
                        onChange={(e) => setNewTimeSlot(prev => ({ ...prev, price: Number(e.target.value) }))}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white/90"
                        placeholder="Price"
                        min="0"
                      />
                    </div>
                    
                    <button
                      onClick={addTimeSlot}
                      className="w-full px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                    >
                      Add Time Slot
                    </button>

                    {/* Time Slots List */}
                    {customTimeSlots.length > 0 && (
                      <div className="space-y-2">
                        {customTimeSlots.map((slot, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded p-2">
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {slot}
                            </span>
                            <button
                              onClick={() => removeTimeSlot(index)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleOverrideAvailability}
                    className="flex-1 px-3 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
                  >
                    Apply Override
                  </button>
                  <button
                    onClick={() => setShowOverrideForm(false)}
                    className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Block Form */}
          {showBlockForm && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
              <h5 className="text-sm font-medium text-gray-800 dark:text-white/90">
                Block Date
              </h5>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reason for Blocking
                  </label>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white/90 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    placeholder="Enter reason for blocking this date"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Common Reasons
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    {commonBlockReasons.map((reason) => (
                      <button
                        key={reason}
                        onClick={() => setBlockReason(reason)}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors text-left"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleBlockDate}
                    disabled={!blockReason.trim()}
                    className="flex-1 px-3 py-2 text-sm bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Block Date
                  </button>
                  <button
                    onClick={() => setShowBlockForm(false)}
                    className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-700 dark:text-gray-400">
                <p className="font-medium mb-1">Admin Tips:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Override availability to handle special cases</li>
                  <li>• Block dates for maintenance or private events</li>
                  <li>• Custom time slots allow flexible pricing</li>
                  <li>• Changes are applied immediately</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityAdminControls;