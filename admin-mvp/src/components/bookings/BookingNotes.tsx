"use client";

import React, { useState } from "react";
import { Plus, MessageSquare, User, Calendar, Save, X } from "lucide-react";

interface Note {
  id: string;
  content: string;
  author: string;
  timestamp: string;
  type: "admin" | "system" | "customer";
}

// interface BookingNotesProps {
  // bookingId: string; // Not currently used but kept for future implementation
// }

export function BookingNotes({ /*bookingId*/ }: Record<string, unknown>) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState("");
  
  // Mock notes data - in real app, this would come from API
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      content: "Customer requested early check-in at 8 AM. Confirmed with space partner.",
      author: "Admin User",
      timestamp: "2024-01-15T09:15:00Z",
      type: "admin"
    },
    {
      id: "2",
      content: "Payment verification completed. All documents received.",
      author: "System",
      timestamp: "2024-01-15T10:25:00Z",
      type: "system"
    },
    {
      id: "3",
      content: "Customer mentioned they will bring their own laptop and require power outlet access.",
      author: "Support Team",
      timestamp: "2024-01-14T16:30:00Z",
      type: "admin"
    }
  ]);

  const handleAddNote = () => {
    if (newNote.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        content: newNote.trim(),
        author: "Current Admin", // In real app, get from auth context
        timestamp: new Date().toISOString(),
        type: "admin"
      };
      setNotes([note, ...notes]);
      setNewNote("");
      setIsAddingNote(false);
    }
  };

  const handleCancelAdd = () => {
    setNewNote("");
    setIsAddingNote(false);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } else {
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    }
  };

  const getNoteStyles = (type: Note["type"]) => {
    switch (type) {
      case "system":
        return {
          bg: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
          border: "border-red-200 dark:border-red-700",
          icon: "text-red-600 dark:text-red-400",
          badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        };
      case "customer":
        return {
          bg: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
          border: "border-green-200 dark:border-green-700",
          icon: "text-green-600 dark:text-green-400",
          badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        };
      default: // admin
        return {
          bg: "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20",
          border: "border-gray-200 dark:border-gray-700",
          icon: "text-gray-600 dark:text-gray-400",
          badge: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
        };
    }
  };

  return (
    <div className="rounded-lg border border-stroke bg-white p-6 shadow-lg dark:border-strokedark dark:bg-boxdark">
      <div className="mb-6 border-b border-stroke pb-3 dark:border-strokedark">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-black dark:text-white">
              Admin Notes
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Internal notes and communications about this booking
            </p>
          </div>
          {!isAddingNote && (
            <button
              onClick={() => setIsAddingNote(true)}
              className="group flex items-center gap-2 rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition-all duration-200 hover:from-red-100 hover:to-red-200 hover:shadow-md dark:border-red-700 dark:from-red-900/30 dark:to-red-800/30 dark:text-red-300 dark:hover:from-red-800/40 dark:hover:to-red-700/40"
            >
              <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
              Add Note
            </button>
          )}
        </div>
      </div>
      
        {/* Add new note form */}
        {isAddingNote && (
          <div className="mb-6 rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-6 dark:border-red-700 dark:from-red-900/20 dark:to-orange-900/20">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note about this booking..."
              className="w-full resize-none rounded-lg border border-stroke bg-white px-4 py-3 text-black placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-strokedark dark:bg-boxdark dark:text-white dark:placeholder-gray-400 dark:focus:border-red-400 dark:focus:ring-red-800/30"
              rows={4}
              autoFocus
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="group flex items-center gap-2 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-green-100 px-4 py-2 text-sm font-semibold text-green-700 transition-all duration-200 hover:from-green-100 hover:to-green-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed dark:border-green-700 dark:from-green-900/30 dark:to-green-800/30 dark:text-green-300 dark:hover:from-green-800/40 dark:hover:to-green-700/40"
              >
                <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />
                Save Note
              </button>
              <button
                onClick={handleCancelAdd}
                className="group flex items-center gap-2 rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:from-gray-100 hover:to-gray-200 hover:shadow-md dark:border-gray-700 dark:from-gray-900/30 dark:to-gray-800/30 dark:text-gray-300 dark:hover:from-gray-800/40 dark:hover:to-gray-700/40"
              >
                <X className="h-4 w-4 group-hover:scale-110 transition-transform" />
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Notes list */}
        <div className="space-y-4">
          {notes.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-body dark:text-bodydark" />
              <p className="mt-2 text-body dark:text-bodydark">No notes yet</p>
              <p className="text-sm text-body dark:text-bodydark">Add the first note about this booking</p>
            </div>
          ) : (
            notes.map((note) => {
              const styles = getNoteStyles(note.type);
              return (
                <div
                  key={note.id}
                  className={`rounded-lg border p-5 shadow-sm transition-all duration-200 hover:shadow-md ${styles.bg} ${styles.border}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 rounded-full bg-white p-2 shadow-sm ${styles.icon} dark:bg-boxdark`}>
                      {note.type === "system" ? (
                        <Calendar className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-black dark:text-white">
                            {note.author}
                          </p>
                          {note.type === "system" && (
                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles.badge}`}>
                              System
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {formatTimestamp(note.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        {note.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {notes.length > 0 && (
          <div className="mt-6 border-t border-stroke pt-4 dark:border-strokedark">
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-meta-4">
              <MessageSquare className="h-4 w-4" />
              View All Notes ({notes.length})
            </button>
          </div>
        )}
    </div>
  );
}