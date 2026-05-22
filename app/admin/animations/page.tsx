'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import {
  Sparkles,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Calendar,
  MessageSquare,
  X
} from 'lucide-react';

interface AnimationSetting {
  id: string;
  animationType: string;
  isEnabled: boolean;
  startDate: string | null;
  endDate: string | null;
  customMessage: string | null;
}

const ANIMATION_INFO = {
  NEW_YEAR: {
    name: 'New Year',
    icon: '🎉',
    description: 'Celebrate the New Year with fireworks and confetti',
    color: 'from-purple-500 to-pink-500'
  },
  DIWALI: {
    name: 'Diwali',
    icon: '🪔',
    description: 'Festival of Lights with diyas and fireworks',
    color: 'from-yellow-500 to-orange-500'
  },
  CHRISTMAS: {
    name: 'Christmas',
    icon: '🎄',
    description: 'Merry Christmas with snowflakes and decorations',
    color: 'from-red-500 to-green-500'
  },
  HOLI: {
    name: 'Holi',
    icon: '🎨',
    description: 'Festival of Colors with vibrant splashes',
    color: 'from-pink-500 to-purple-500'
  },
  EID: {
    name: 'Eid',
    icon: '🌙',
    description: 'Eid Mubarak with stars and crescents',
    color: 'from-teal-500 to-indigo-500'
  },
  INDEPENDENCE_DAY: {
    name: 'Independence Day',
    icon: '🇮🇳',
    description: 'Celebrate Independence with tricolor theme',
    color: 'from-orange-500 via-white to-green-500'
  },
  NONE: {
    name: 'None',
    icon: '❌',
    description: 'No animation displayed',
    color: 'from-gray-400 to-gray-500'
  }
};

export default function AdminAnimations() {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState<AnimationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      redirect('/dashboard');
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/animations');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (animationType: string) => {
    const currentSetting = settings.find(s => s.animationType === animationType);
    const newEnabledState = !currentSetting?.isEnabled;
    
    // Optimistically update UI
    const newSettings = settings.map(s => ({
      ...s,
      isEnabled: s.animationType === animationType ? newEnabledState : false
    }));
    setSettings(newSettings);
    
    // Save to server
    await saveSetting(animationType, newEnabledState);
    
    // Refresh settings from server to ensure sync
    await fetchSettings();
  };

  const saveSetting = async (animationType: string, isEnabled: boolean) => {
    const setting = settings.find(s => s.animationType === animationType);
    if (!setting) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/animations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animationType,
          isEnabled,
          startDate: setting.startDate,
          endDate: setting.endDate,
          customMessage: setting.customMessage
        })
      });

      if (!response.ok) throw new Error('Failed to save setting');
      
      setSaveMessage('Animation setting updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save setting:', error);
      setSaveMessage('Failed to save setting. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (animationType: string, field: string, value: string | boolean) => {
    setSettings(settings.map(s => 
      s.animationType === animationType ? { ...s, [field]: value } : s
    ));
  };

  const handleSaveMessage = async (animationType: string) => {
    const setting = settings.find(s => s.animationType === animationType);
    if (!setting) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/animations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animationType,
          isEnabled: setting.isEnabled,
          startDate: setting.startDate,
          endDate: setting.endDate,
          customMessage: setting.customMessage
        })
      });

      if (!response.ok) throw new Error('Failed to save message');
      
      setSaveMessage('Message saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      setEditingMessage(null);
    } catch (error) {
      console.error('Failed to save message:', error);
      setSaveMessage('Failed to save message. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Sparkles className="h-8 w-8 mr-3 text-purple-600" />
                  Festival Animations
                </h1>
                <p className="mt-2 text-gray-600">Manage festival and holiday animations for the website</p>
              </div>
              <div className="flex items-center space-x-3">
                {saveMessage && (
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm ${
                    saveMessage.includes('successfully') 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {saveMessage.includes('successfully') ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <span>{saveMessage}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(ANIMATION_INFO).map(([type, info]) => {
            const setting = settings.find(s => s.animationType === type);
            const isActive = setting?.isEnabled || false;

            return (
              <div
                key={type}
                className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
                  isActive ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-4xl">{info.icon}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{info.name}</h3>
                        <p className="text-sm text-gray-500">{info.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(type)}
                      disabled={saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isActive ? 'bg-blue-600' : 'bg-gray-200'
                      } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {isActive && type !== 'NONE' && (
                    <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
                      {/* Date Range */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Start Date
                          </label>
                          <input
                            type="datetime-local"
                            value={setting?.startDate?.slice(0, 16) || ''}
                            onChange={(e) => updateSetting(type, 'startDate', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            End Date
                          </label>
                          <input
                            type="datetime-local"
                            value={setting?.endDate?.slice(0, 16) || ''}
                            onChange={(e) => updateSetting(type, 'endDate', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Custom Message */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Custom Message
                        </label>
                        {editingMessage === type ? (
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={setting?.customMessage || ''}
                              onChange={(e) => updateSetting(type, 'customMessage', e.target.value)}
                              placeholder="Enter custom message..."
                              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveMessage(type)}
                              disabled={saving}
                              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingMessage(null)}
                              className="px-2 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => setEditingMessage(type)}
                            className="px-2 py-1.5 text-sm border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 truncate"
                          >
                            {setting?.customMessage || 'Click to add custom message...'}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => saveSetting(type, true)}
                        disabled={saving}
                        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Settings
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Note:</p>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>Only one animation can be active at a time</li>
                <li>Set start and end dates to automatically enable/disable animations</li>
                <li>Leave dates empty to keep animation active indefinitely</li>
                <li>Custom messages will be displayed with the animation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
