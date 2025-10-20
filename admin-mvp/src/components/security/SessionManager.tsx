"use client";
import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal/index";
import Alert from "@/components/ui/alert/Alert";
import { Monitor, Smartphone, Tablet, MapPin, Clock, Shield, LogOut, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type SessionDevice = {
  id: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
  loginTime: string;
};

interface SessionManagerProps {
  onSessionTerminated?: (sessionId: string) => void;
}

export default function SessionManager({ onSessionTerminated }: SessionManagerProps) {
  const [sessions, setSessions] = useState<SessionDevice[]>([
    {
      id: "current-session",
      deviceType: "desktop",
      browser: "Chrome 120.0",
      os: "macOS 14.2",
      location: "San Francisco, CA",
      ipAddress: "192.168.1.100",
      lastActive: new Date().toISOString(),
      isCurrent: true,
      loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    },
    {
      id: "mobile-session",
      deviceType: "mobile",
      browser: "Safari 17.2",
      os: "iOS 17.2",
      location: "San Francisco, CA",
      ipAddress: "192.168.1.101",
      lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      isCurrent: false,
      loginTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
    },
    {
      id: "tablet-session",
      deviceType: "tablet",
      browser: "Chrome 120.0",
      os: "iPadOS 17.2",
      location: "New York, NY",
      ipAddress: "10.0.0.50",
      lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      isCurrent: false,
      loginTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    }
  ]);
  
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [sessionToTerminate, setSessionToTerminate] = useState<SessionDevice | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getDeviceIcon = (deviceType: SessionDevice['deviceType']) => {
    switch (deviceType) {
      case 'desktop':
        return <Monitor className="w-5 h-5" />;
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const formatLastActive = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleTerminateSession = async (session: SessionDevice) => {
    if (session.isCurrent) {
      toast.error("Cannot terminate your current session");
      return;
    }
    
    setSessionToTerminate(session);
    setShowTerminateDialog(true);
  };

  const confirmTerminateSession = async () => {
    if (!sessionToTerminate) return;
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSessions(prev => prev.filter(s => s.id !== sessionToTerminate.id));
    onSessionTerminated?.(sessionToTerminate.id);
    
    toast.success(`Session terminated: ${sessionToTerminate.browser} on ${sessionToTerminate.os}`);
    setShowTerminateDialog(false);
    setSessionToTerminate(null);
    setIsLoading(false);
  };

  const terminateAllOtherSessions = async () => {
    const otherSessions = sessions.filter(s => !s.isCurrent);
    if (otherSessions.length === 0) {
      toast.info("No other sessions to terminate");
      return;
    }
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSessions(prev => prev.filter(s => s.isCurrent));
    
    otherSessions.forEach(session => {
      onSessionTerminated?.(session.id);
    });
    
    toast.success(`Terminated ${otherSessions.length} other session(s)`);
    setIsLoading(false);
  };

  const activeSessions = sessions.length;
  const otherSessions = sessions.filter(s => !s.isCurrent).length;

  return (
    <ComponentCard 
      title="Active Sessions"
      desc="Manage your active login sessions across all devices"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium">Session Overview</h3>
            <p className="text-sm text-gray-600">
              {activeSessions} active session{activeSessions !== 1 ? 's' : ''} • {otherSessions} other device{otherSessions !== 1 ? 's' : ''}
            </p>
          </div>
          {otherSessions > 0 && (
            <Button 
              variant="outline"
              onClick={terminateAllOtherSessions}
              disabled={isLoading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoading ? "Terminating..." : "End All Other Sessions"}
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {sessions.map((session) => {
            const isStale = new Date().getTime() - new Date(session.lastActive).getTime() > 7 * 24 * 60 * 60 * 1000; // 7 days
            
            return (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    session.isCurrent ? "bg-green-100" : "bg-gray-100"
                  }`}>
                    {getDeviceIcon(session.deviceType)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">
                        {session.browser} on {session.os}
                      </h4>
                      {session.isCurrent && (
                        <Badge variant="light" color="success">
                          Current
                        </Badge>
                      )}
                      {isStale && (
                        <Badge variant="light" color="warning">
                          Stale
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{session.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Last active: {formatLastActive(session.lastActive)}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        IP: {session.ipAddress} • Logged in: {new Date(session.loginTime).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isStale && (
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  )}
                  
                  {!session.isCurrent && (
                    <Button
                      variant="outline"
                      onClick={() => handleTerminateSession(session)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      End Session
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {sessions.length === 1 && (
          <Alert
            variant="info"
            title="Session Information"
            message="You only have one active session. This is your current session."
          />
        )}

        <Modal isOpen={showTerminateDialog} onClose={() => setShowTerminateDialog(false)} className="max-w-md">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Terminate Session</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to end this session? The user will be logged out immediately.
            </p>
            
            {sessionToTerminate && (
              <div className="p-4 bg-gray-50 rounded-lg mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-full">
                    {getDeviceIcon(sessionToTerminate.deviceType)}
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {sessionToTerminate.browser} on {sessionToTerminate.os}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {sessionToTerminate.location} • {sessionToTerminate.ipAddress}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowTerminateDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="outline"
                onClick={confirmTerminateSession}
                disabled={isLoading}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {isLoading ? "Terminating..." : "End Session"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </ComponentCard>
  );
}
