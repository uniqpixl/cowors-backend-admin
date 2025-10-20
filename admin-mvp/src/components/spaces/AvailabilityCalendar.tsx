"use client";
import React, { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  EventInput,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import {
  CalendarEvent,
} from "@/types/availability";
import { formatDate } from "@/utils/formatters";

interface AvailabilityCalendarProps {
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  events,
  onDateSelect,
  onEventClick,
}) => {
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const calendarRef = useRef<FullCalendar>(null);

  // Convert events to calendar events
  const calendarEvents: EventInput[] = events.map((event): EventInput => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    backgroundColor: getEventColor(event),
    borderColor: getEventColor(event),
    extendedProps: {
      type: event.type,
      event,
    },
  }));

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const selectedDate = new Date(selectInfo.startStr);
    setSelectedDate(selectInfo.startStr.split('T')[0]);
    onDateSelect(selectedDate);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    const calendarEvent = event.extendedProps.event;
    
    if (calendarEvent) {
      onEventClick(calendarEvent);
    }
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(view);
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Availability Calendar
          </h3>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => handleViewChange('dayGridMonth')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                currentView === 'dayGridMonth'
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => handleViewChange('timeGridWeek')}
              className={`px-3 py-2 text-sm font-medium transition-colors border-l border-gray-300 dark:border-gray-700 ${
                currentView === 'timeGridWeek'
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => handleViewChange('timeGridDay')}
              className={`px-3 py-2 text-sm font-medium transition-colors border-l border-gray-300 dark:border-gray-700 ${
                currentView === 'timeGridDay'
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Confirmed Booking</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Pending Booking</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Unavailable</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Cancelled</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="custom-calendar p-4">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '', // We handle view switching with our custom buttons
            }}
            events={calendarEvents}
            selectable={true}
            selectMirror={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            height="auto"
            dayMaxEvents={3}
            moreLinkClick="popover"
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Monday - Sunday
              startTime: '08:00',
              endTime: '22:00',
            }}
            slotMinTime="08:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
            nowIndicator={true}
            eventDisplay="block"
            dayHeaderFormat={{ weekday: 'short' }}
          />
        </div>
      </div>

      {/* Selected Date Info */}
      {selectedDate && (
        <SelectedDateInfo
          date={selectedDate}
          events={events.filter(e => {
            const eventDate = new Date(e.start).toISOString().split('T')[0];
            return eventDate === selectedDate;
          })}
          onEventClick={onEventClick}
        />
      )}
    </div>
  );
};

// Helper component for selected date information
interface SelectedDateInfoProps {
  date: string;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const SelectedDateInfo: React.FC<SelectedDateInfoProps> = ({
  date,
  events,
  onEventClick,
}) => {

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">
        {formatDate(date)}
      </h4>
      
      {events.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Events ({events.length}):
            </span>
          </div>

          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => onEventClick(event)}
              >
                <div>
                  <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {event.title}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {event.type}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.type === 'booking'
                      ? event.status === 'confirmed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : event.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      : event.type === 'blocked'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}>
                    {event.status || event.type}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No events for this date.
        </p>
      )}
    </div>
  );
};

// Helper function to get event color based on type and status
const getEventColor = (event: CalendarEvent): string => {
  if (event.type === 'booking') {
    switch (event.status) {
      case 'confirmed':
        return '#10b981'; // green
      case 'pending':
        return '#f59e0b'; // yellow
      case 'cancelled':
        return '#6b7280'; // gray
      default:
        return '#374151'; // gray
    }
  } else if (event.type === 'blocked') {
    return '#ef4444'; // red
  }
  return '#374151'; // gray
};

// Custom event content renderer
const renderEventContent = (eventInfo: EventContentArg) => {
  const eventType = eventInfo.event.extendedProps.type;
  
  return (
    <div className="flex items-center gap-1 p-1 text-xs">
      <div className="flex-1 truncate">
        {eventInfo.event.title}
      </div>
      {eventType === 'booking' && (
        <div className="text-xs opacity-75">
          {eventInfo.timeText}
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;