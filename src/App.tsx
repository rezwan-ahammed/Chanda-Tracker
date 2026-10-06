import React, { useState, useEffect } from 'react';
import {
  MapPin,
  TrendingUp,
  Radar,
  Users,
  Database,
  Plus,
  ShieldAlert,
  Brain,
} from 'lucide-react';
import { ExtortionSpot, DivisionName, SpotStatus, User } from './types';
import { OFFICIAL_VERIFIED_SPOTS } from './data/verifiedRegistry';
import { Header } from './components/Header';
import { MapView } from './components/MapView';
import { AnalyticsView } from './components/AnalyticsView';
import { ThreatAnalysisView } from './components/ThreatAnalysisView';
import { RadarView } from './components/RadarView';
import { DatabaseView } from './components/DatabaseView';
import { JuryView } from './components/JuryView';
import { ReportModal } from './components/ReportModal';
import { StealthCalculator } from './components/StealthCalculator';
import { AuthModal } from './components/AuthModal';
import { saveSpotToFirestore, subscribeToFirestoreSpots } from './firebase';
import {
  ZkpNidModal,
  ProfileModal,
  EvidenceModal,
  GdModal,
  SosModal,
  FlashAlertModal,
} from './components/Modals';

type ActiveTab = 'explore' | 'analytics' | 'threat' | 'radar' | 'database' | 'jury';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('explore');
  const [spots, setSpots] = useState<ExtortionSpot[]>(() => {
    const saved = localStorage.getItem('civic_defense_spots');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return OFFICIAL_VERIFIED_SPOTS;
      }
    }
    return OFFICIAL_VERIFIED_SPOTS;
  });

  const [selectedSpot, setSelectedSpot] = useState<ExtortionSpot | null>(spots[0] || null);

  // User & Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [userNidHashed, setUserNidHashed] = useState<string>(() => {
    return localStorage.getItem('user_nid_hash') || 'sha256_9c41f7e340a';
  });
  const [civicKarma, setCivicKarma] = useState<number>(() => {
    const saved = localStorage.getItem('civic_karma');
    return saved ? parseInt(saved, 10) : 185;
  });
  const [userLocation, setUserLocation] = useState<[number, number]>([23.7516, 90.3944]);

  // Track live GPS on startup
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  // Check login state on startup
  useEffect(() => {
    const token = localStorage.getItem('civic_auth_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(d => {
          if (d.user) {
            setCurrentUser(d.user);
            setCivicKarma(d.user.karma);
            if (d.user.zkpHash) setUserNidHashed(d.user.zkpHash);
          }
        })
        .catch(() => {});
    } else {
      // Auto-connect as verified citizen
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrEmail: '01711000001', password: 'password123' }),
      })
        .then(r => r.json())
        .then(d => {
          if (d.user && d.token) {
            localStorage.setItem('civic_auth_token', d.token);
            setCurrentUser(d.user);
            setCivicKarma(d.user.karma);
            if (d.user.zkpHash) setUserNidHashed(d.user.zkpHash);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Fetch real spots and poll for live database updates
  useEffect(() => {
    const fetchLiveSpots = () => {
      fetch('/api/spots')
        .then(r => r.json())
        .then(data => {
          if (data.spots && Array.isArray(data.spots) && data.spots.length > 0) {
            setSpots(data.spots);
            setSelectedSpot(prev => {
              if (!prev) return data.spots[0];
              const match = data.spots.find((s: ExtortionSpot) => s.id === prev.id);
              return match || data.spots[0];
            });
          }
        })
        .catch(e => console.warn('Spot fetch error:', e));
    };

    fetchLiveSpots();
    const interval = setInterval(fetchLiveSpots, 6000);
    return () => clearInterval(interval);
  }, []);

  // Stealth Panic Mode
  const [isPanicMode, setIsPanicMode] = useState<boolean>(false);

  // Modals
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showZkpModal, setShowZkpModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState<boolean>(false);
  const [evidenceSpot, setEvidenceSpot] = useState<ExtortionSpot | null>(null);
  const [showGdModal, setShowGdModal] = useState<boolean>(false);
  const [gdSpot, setGdSpot] = useState<ExtortionSpot | null>(null);
  const [showSosModal, setShowSosModal] = useState<boolean>(false);
  const [showFlashModal, setShowFlashModal] = useState<boolean>(false);

  // Persist spots & karma
  useEffect(() => {
    localStorage.setItem('civic_defense_spots', JSON.stringify(spots));
  }, [spots]);

  useEffect(() => {
    localStorage.setItem('civic_karma', civicKarma.toString());
  }, [civicKarma]);

  useEffect(() => {
    localStorage.setItem('user_nid_hash', userNidHashed);
  }, [userNidHashed]);

  // Handle Voting
  const handleVote = (spotId: number, isUp: boolean) => {
    const token = localStorage.getItem('civic_auth_token');
    fetch(`/api/spots/${spotId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ isUp }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.spot) {
          setSpots(prev => prev.map(s => s.id === spotId ? d.spot : s));
          if (selectedSpot && selectedSpot.id === spotId) {
            setSelectedSpot(d.spot);
          }
        }
      })
      .catch(e => console.warn('Vote server sync error:', e));

    setSpots(prevSpots =>
      prevSpots.map(s => {
        if (s.id === spotId) {
          const delta = isUp ? 2 : -3;
          const newScore = Math.min(99, Math.max(15, s.score + delta));
          const newStatus: SpotStatus = newScore >= 75 ? 'RED' : s.status === 'GREEN' ? 'GREEN' : 'YELLOW';
          const updated: ExtortionSpot = {
            ...s,
            upvotes: isUp ? s.upvotes + 1 : s.upvotes,
            downvotes: !isUp ? s.downvotes + 1 : s.downvotes,
            score: newScore,
            status: newStatus,
          };
          if (selectedSpot && selectedSpot.id === spotId) {
            setSelectedSpot(updated);
          }
          return updated;
        }
        return s;
      })
    );

    // Boost Karma
    const addedKarma = isUp ? 5 : 2;
    setCivicKarma(k => k + addedKarma);
    if (currentUser) {
      setCurrentUser(u => u ? { ...u, karma: u.karma + addedKarma } : null);
    }
  };

  const handleWitnessTestimony = (spot: ExtortionSpot) => {
    handleVote(spot.id, true);
    setCivicKarma(k => k + 10);
  };

  const handleReportSubmit = (newSpot: ExtortionSpot) => {
    setSpots(prev => [newSpot, ...prev.filter(s => s.id !== newSpot.id)]);
    setSelectedSpot(newSpot);
    setCivicKarma(k => k + 25);
    if (currentUser) {
      setCurrentUser(u => u ? {
        ...u,
        karma: u.karma + 25,
        reportedSpotIds: [...u.reportedSpotIds, newSpot.id]
      } : null);
    }

    // Direct real-time sync to Firestore database
    saveSpotToFirestore({
      id: newSpot.id,
      name: newSpot.name,
      division: newSpot.division,
      district: newSpot.division,
      thana: newSpot.policeStation || `${newSpot.division} থানা`,
      lat: newSpot.coords[0],
      lng: newSpot.coords[1],
      status: newSpot.status,
      score: newSpot.score,
      category: newSpot.category,
      rate: newSpot.rate,
      syndicate: newSpot.syndicateName,
      collector: 'তদন্তাধীন',
      reportCount: 1,
      upvotes: newSpot.upvotes,
      downvotes: newSpot.downvotes,
      evidenceSummary: newSpot.evidenceTitle,
      reportedBy: currentUser?.id || 'anon_citizen',
      reporterName: currentUser?.name || 'নাগরিক',
    }).catch(e => console.warn('Firestore spot sync fallback:', e));

    setActiveTab('explore');
  };

  const handleZkpSuccess = (newHash: string) => {
    setUserNidHashed(newHash);
    setCivicKarma(k => k + 50);
    if (currentUser) {
      setCurrentUser(u => u ? { ...u, zkpHash: newHash, karma: u.karma + 50 } : null);
    }
  };

  const handleAuthSuccess = (user: User, token?: string) => {
    setCurrentUser(user);
    setCivicKarma(user.karma);
    if (user.zkpHash) setUserNidHashed(user.zkpHash);
    if (token) localStorage.setItem('civic_auth_token', token);
  };

  const handleLogout = () => {
    localStorage.removeItem('civic_auth_token');
    setCurrentUser(null);
  };

  // If panic camouflage mode is triggered
  if (isPanicMode) {
    return (
      <div className="w-full h-[100dvh] flex items-center justify-center bg-slate-900">
        <div className="w-full h-full sm:h-[840px] sm:max-w-[420px] bg-slate-950 sm:rounded-[40px] overflow-hidden shadow-2xl flex flex-col border border-slate-800">
          <StealthCalculator onExit={() => setIsPanicMode(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[#FAFAFA] via-[#FDF2F8]/70 to-[#FFF1F2]/80">
      {/* App Shell Container with Mobile/Desktop responsiveness */}
      <div className="w-full h-full sm:h-[860px] sm:max-w-[440px] bg-white sm:rounded-[44px] shadow-2xl overflow-hidden flex flex-col relative sm:border-[8px] sm:border-white/95">
        
        {/* Top Header */}
        <Header
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenFlashAlert={() => setShowFlashModal(true)}
          onOpenSos={() => setShowSosModal(true)}
          onTogglePanicMode={() => setIsPanicMode(true)}
          onOpenNid={() => setShowZkpModal(true)}
          onOpenAuth={() => setShowAuthModal(true)}
          currentUser={currentUser}
          userNidHashed={userNidHashed}
          civicKarma={currentUser ? currentUser.karma : civicKarma}
        />

        {/* Main View Area */}
        <main className="flex-1 relative overflow-hidden flex flex-col bg-[#FAFAFA]">
          {activeTab === 'explore' && (
            <MapView
              spots={spots}
              selectedSpot={selectedSpot}
              onSelectSpot={setSelectedSpot}
              onVote={handleVote}
              onOpenEvidence={spot => {
                setEvidenceSpot(spot);
                setShowEvidenceModal(true);
              }}
              onOpenGdModal={spot => {
                setGdSpot(spot);
                setShowGdModal(true);
              }}
              onWitnessTestimony={handleWitnessTestimony}
              onNavigateToThreat={() => setActiveTab('threat')}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              spots={spots}
              onNavigateToThreat={() => setActiveTab('threat')}
            />
          )}

          {activeTab === 'threat' && (
            <ThreatAnalysisView
              spots={spots}
              onNavigateToMapSpot={spot => {
                setSelectedSpot(spot);
                setActiveTab('explore');
              }}
              onOpenSafeRoute={() => setActiveTab('explore')}
              onOpenSos={() => setShowSosModal(true)}
            />
          )}

          {activeTab === 'radar' && (
            <RadarView
              spots={spots}
              userLocation={userLocation}
              onTriggerSilentAlert={() => setShowFlashModal(true)}
              onSelectSpot={spot => {
                setSelectedSpot(spot);
                setActiveTab('explore');
              }}
            />
          )}

          {activeTab === 'database' && <DatabaseView />}

          {activeTab === 'jury' && (
            <JuryView
              spots={spots}
              onVote={(spotId, isUp) => {
                handleVote(spotId, isUp);
                const token = localStorage.getItem('civic_auth_token');
                fetch(`/api/spots/${spotId}/jury`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  body: JSON.stringify({ isTrue: isUp }),
                })
                  .then(r => r.json())
                  .then(d => {
                    if (d.spot) {
                      setSpots(prev => prev.map(s => s.id === spotId ? d.spot : s));
                    }
                  })
                  .catch(() => {});
              }}
              onOpenEvidence={spot => {
                setEvidenceSpot(spot);
                setShowEvidenceModal(true);
              }}
              onKarmaReward={pts => {
                setCivicKarma(k => k + pts);
                if (currentUser) {
                  setCurrentUser(u => u ? { ...u, karma: u.karma + pts } : null);
                }
              }}
            />
          )}
        </main>

        {/* Glass Bottom Navigation Bar */}
        <footer className="glass-nav px-2 py-2 flex justify-between items-center relative z-40 shrink-0">
          {/* Tab 1: Map */}
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex flex-col items-center justify-center min-w-[42px] min-h-[44px] transition-all ${
              activeTab === 'explore' ? 'text-rose-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">ম্যাপ</span>
          </button>

          {/* Tab 2: Analytics */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center justify-center min-w-[42px] min-h-[44px] transition-all ${
              activeTab === 'analytics' ? 'text-rose-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">ট্রেন্ড</span>
          </button>

          {/* Tab 3: AI Threat Analysis */}
          <button
            onClick={() => setActiveTab('threat')}
            className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] transition-all relative ${
              activeTab === 'threat' ? 'text-rose-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">AI থ্রেট</span>
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
          </button>

          {/* Central Floating Action Button: Report Submission */}
          <div className="relative -top-3">
            <button
              onClick={() => setShowReportModal(true)}
              title="নতুন অভিযোগ দাখিল করুন"
              className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 text-white flex items-center justify-center pink-glow shadow-xl active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5 stroke-[2.8]" />
            </button>
          </div>

          {/* Tab 4: Radar */}
          <button
            onClick={() => setActiveTab('radar')}
            className={`flex flex-col items-center justify-center min-w-[42px] min-h-[44px] transition-all ${
              activeTab === 'radar' ? 'text-rose-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Radar className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">রাডার</span>
          </button>

          {/* Tab 5: Jury */}
          <button
            onClick={() => setActiveTab('jury')}
            className={`flex flex-col items-center justify-center min-w-[42px] min-h-[44px] transition-all relative ${
              activeTab === 'jury' ? 'text-rose-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">জুরি</span>
            {spots.some(s => s.status === 'YELLOW') && (
              <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-amber-500 rounded-full" />
            )}
          </button>

          {/* Tab 6: Database */}
          <button
            onClick={() => setActiveTab('database')}
            className={`flex flex-col items-center justify-center min-w-[42px] min-h-[44px] transition-all ${
              activeTab === 'database' ? 'text-rose-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Database className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">রেজিস্ট্রি</span>
          </button>
        </footer>

        {/* Modals & Dialogs */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />

        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSubmitSpot={handleReportSubmit}
          userNidHashed={userNidHashed}
          defaultCoords={userLocation}
        />

        <ZkpNidModal
          isOpen={showZkpModal}
          onClose={() => setShowZkpModal(false)}
          currentHash={userNidHashed}
          onSuccess={handleZkpSuccess}
        />

        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          currentUser={currentUser}
          userNidHashed={userNidHashed}
          civicKarma={currentUser ? currentUser.karma : civicKarma}
          onOpenZkp={() => setShowZkpModal(true)}
          onOpenAuth={() => setShowAuthModal(true)}
          onLogout={handleLogout}
        />

        <EvidenceModal
          isOpen={showEvidenceModal}
          onClose={() => {
            setShowEvidenceModal(false);
            setEvidenceSpot(null);
          }}
          spot={evidenceSpot}
        />

        <GdModal
          isOpen={showGdModal}
          onClose={() => {
            setShowGdModal(false);
            setGdSpot(null);
          }}
          spot={gdSpot}
          userNidHashed={userNidHashed}
        />

        <SosModal isOpen={showSosModal} onClose={() => setShowSosModal(false)} />

        <FlashAlertModal isOpen={showFlashModal} onClose={() => setShowFlashModal(false)} />
      </div>
    </div>
  );
}
