'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Languages, 
  TrendingUp, 
  Users, 
  MessageCircle, 
  Globe,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';

interface ConversationInsightsProps {
  conversationId: string;
}

interface LanguageStats {
  language: string;
  languageName: string;
  flag: string;
  messageCount: number;
  percentage: number;
}

interface ConversationStats {
  totalMessages: number;
  languagesUsed: LanguageStats[];
  translationCount: number;
  participantCount: number;
  crossLanguageConversation: boolean;
}

export default function ConversationInsights({ conversationId }: ConversationInsightsProps) {
  const [stats, setStats] = useState<ConversationStats | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    if (!conversationId) return;
    
    setLoading(true);
    try {
      // Mock data for demo - in production, fetch from API
      const mockStats: ConversationStats = {
        totalMessages: 47,
        languagesUsed: [
          { language: 'en', languageName: 'English', flag: '🇺🇸', messageCount: 25, percentage: 53 },
          { language: 'es', languageName: 'Spanish', flag: '🇪🇸', messageCount: 15, percentage: 32 },
          { language: 'fr', languageName: 'French', flag: '🇫🇷', messageCount: 7, percentage: 15 }
        ],
        translationCount: 22,
        participantCount: 2,
        crossLanguageConversation: true
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching conversation insights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showInsights && !stats) {
      fetchInsights();
    }
  }, [showInsights, conversationId]);

  if (!showInsights) {
    return (
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInsights(true)}
          className="w-full bg-gradient-to-r from-blue-50 to-green-50 border-blue-200 hover:from-blue-100 hover:to-green-100"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Show Conversation Insights
          <Eye className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="mb-4 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Conversation Insights
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInsights(false)}
          >
            <EyeOff className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Analyzing conversation...</p>
          </div>
        ) : stats ? (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
                <MessageCircle className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                <div className="text-lg font-bold text-gray-800">{stats.totalMessages}</div>
                <div className="text-xs text-gray-600">Messages</div>
              </div>
              
              <div className="bg-white rounded-lg p-3 text-center border border-green-100">
                <Zap className="w-5 h-5 mx-auto text-green-600 mb-1" />
                <div className="text-lg font-bold text-gray-800">{stats.translationCount}</div>
                <div className="text-xs text-gray-600">Translated</div>
              </div>
              
              <div className="bg-white rounded-lg p-3 text-center border border-purple-100">
                <Globe className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                <div className="text-lg font-bold text-gray-800">{stats.languagesUsed.length}</div>
                <div className="text-xs text-gray-600">Languages</div>
              </div>
              
              <div className="bg-white rounded-lg p-3 text-center border border-orange-100">
                <Users className="w-5 h-5 mx-auto text-orange-600 mb-1" />
                <div className="text-lg font-bold text-gray-800">{stats.participantCount}</div>
                <div className="text-xs text-gray-600">People</div>
              </div>
            </div>

            {/* Language Breakdown */}
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Languages className="w-4 h-4 mr-2" />
                Language Distribution
              </h4>
              
              <div className="space-y-2">
                {stats.languagesUsed.map((lang) => (
                  <div key={lang.language} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{lang.flag}</span>
                      <span className="text-sm font-medium text-gray-700">{lang.languageName}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${lang.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 w-8">{lang.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cross-Language Badge */}
            {stats.crossLanguageConversation && (
              <div className="text-center">
                <Badge className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                  <Globe className="w-3 h-3 mr-1" />
                  Cross-Language Conversation Active
                </Badge>
                <p className="text-xs text-gray-600 mt-1">
                  🌍 Breaking language barriers in real-time!
                </p>
              </div>
            )}

            {/* Competitive Advantage Highlight */}
            <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-3 border border-green-200">
              <div className="text-center">
                <Zap className="w-5 h-5 mx-auto text-green-600 mb-1" />
                <p className="text-sm font-medium text-gray-800">
                  🚀 <strong>Translation Advantage:</strong> {Math.round((stats.translationCount / stats.totalMessages) * 100)}% of messages auto-translated
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  No other messaging app offers invisible real-time translation!
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-gray-600">
            <Globe className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No insights available yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
