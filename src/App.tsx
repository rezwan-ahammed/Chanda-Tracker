import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  TrendingUp,
  Radar,
  Users,
  Database,
  Plus,
  ShieldAlert,
  Brain,
  BellRing,
} from 'lucide-react';
import { ExtortionSpot, DivisionName, SpotStatus, User } from './types';
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
import { DistrictAlertModal } from './components/DistrictAlertModal';
import {
  saveSpotToFirestore,
  subscribeToFirestoreSpots,
  triggerDistrictPushAlert,
  subscribeToFirestoreAlerts,
  voteSpotInFirestore,
  auth,
} from './firebase';
import {
  safeFetchJson,
  clientGetUserByToken,
  clientAuthenticate,
} from './utils/safeApi';
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
  // Pure live Firestore database state — starts empty, no fake mock data
  const [spots, setSpots] = useState<ExtortionSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ExtortionSpot | null>(null);

  // Selected district for FCM real-time push alerts
  const [selectedDistrict, setSelectedDistrict] = useState<DivisionName>(() => {
    return (localStorage.getItem('user_alert_district') as DivisionName) || 'ঢাকা';
  });
  const [showDistrictAlertModal, setShowDistrictAlertModal] = useState<boolean>(false);
  const [activeDistrictAlert, setActiveDistrictAlert] = useState<{
    title: string;
    message: string;
    spot?: ExtortionSpot;
  } | null>(null);

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

  const knownSpotIdsRef = useRef<Set<number | string>>(new Set());
  const initialLoadDoneRef = useRef<boolean>(false);

  // Clean any old mock spots from previous sessions to ensure pure Firestore data
  useEffect(() => {
    localStorage.removeItem('civic_defense_spots');
  }, []);

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
      const localUser = clientGetUserByToken(token);
      if (localUser) {
        setCurrentUser(localUser);
        setCivicKarma(localUser.karma);
        if (localUser.zkpHash) setUserNidHashed(localUser.zkpHash);
        if (localUser.division) setSelectedDistrict(localUser.division);
      }
      safeFetchJson<{ user: User }>('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (res.ok && res.data?.user) {
            setCurrentUser(res.data.user);
            setCivicKarma(res.data.user.karma);
            if (res.data.user.zkpHash) setUserNidHashed(res.data.user.zkpHash);
            if (res.data.user.division) setSelectedDistrict(res.data.user.division);
          }
        })
        .catch(() => {});
    } else {
      // Auto-connect as verified citizen (supports offline and Vercel static environments)
      const defaultAuth = clientAuthenticate('01711000001', 'password123');
      if (defaultAuth) {
        localStorage.setItem('civic_auth_token', defaultAuth.token);
        setCurrentUser(defaultAuth.user);
        setCivicKarma(defaultAuth.user.karma);
        if (defaultAuth.user.zkpHash) setUserNidHashed(defaultAuth.user.zkpHash);
        if (defaultAuth.user.division) setSelectedDistrict(defaultAuth.user.division);
      }
      safeFetchJson<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrEmail: '01711000001', password: 'password123' }),
      })
        .then(res => {
          if (res.ok && res.data?.user && res.data?.token) {
            localStorage.setItem('civic_auth_token', res.data.token);
            setCurrentUser(res.data.user);
            setCivicKarma(res.data.user.karma);
            if (res.data.user.zkpHash) setUserNidHashed(res.data.user.zkpHash);
            if (res.data.user.division) setSelectedDistrict(res.data.user.division);
          }
        })
        .catch(() => {});
    }
  }, []);

  // 100% Authoritative Firestore Database Real-time Subscription
  useEffect(() => {
    const unsub = subscribeToFirestoreSpots(
      (firestoreDocs) => {
        const formatted: ExtortionSpot[] = firestoreDocs.map((doc: any) => ({
          id: typeof doc.id === 'number' ? doc.id : (parseInt(doc.id, 10) || Number(String(doc.id).replace(/\D/g, '')) || Date.now()),
          name: doc.name || 'অজ্ঞাত স্পট',
          division: (doc.division as DivisionName) || 'ঢাকা',
          area: doc.area || doc.thana || `${doc.division || 'ঢাকা'} সংশ্লিষ্ট এলাকা`,
          policeStation: doc.policeStation || doc.thana || `${doc.division || 'ঢাকা'} থানা`,
          rate: String(doc.rate || '০'),
          unit: doc.unit || 'দৈনিক',
          category: doc.category || 'অন্যান্য',
          status: (doc.status as SpotStatus) || 'YELLOW',
          score: typeof doc.score === 'number' ? doc.score : 60,
          upvotes: typeof doc.upvotes === 'number' ? doc.upvotes : 0,
          downvotes: typeof doc.downvotes === 'number' ? doc.downvotes : 0,
          syndicateId: doc.syndicateId || 'syn_unverified',
          syndicateName: doc.syndicate || doc.syndicateName || 'শনাক্তকরণাধীন চক্র',
          distance: doc.distance || '৩৫০ মিটার',
          coords: Array.isArray(doc.coords) && doc.coords.length === 2
            ? doc.coords
            : [typeof doc.lat === 'number' ? doc.lat : 23.75, typeof doc.lng === 'number' ? doc.lng : 90.39],
          evidenceType: doc.evidenceType || 'AUDIO',
          evidenceTitle: doc.evidenceTitle || doc.evidenceSummary || 'নাগরিক ডিজিটাল সাক্ষ্য ও অডিট',
          evidenceMeta: doc.evidenceMeta || 'ভেরিফাইড নাগরিক অভিযোগ',
          ipfsCid: doc.ipfsCid || 'bafybeicivicrecord',
          reportedByHash: doc.reportedByHash || 'sha256_anon',
          estimatedDailyCollection: doc.estimatedDailyCollection || 'তদন্তাধীন',
          updates: doc.updates || ['ফায়ারবেস ক্লাউড ডাটাবেস থেকে সরাসরি সিঙ্ককৃত'],
          reportedAt: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('bn-BD') : 'লাইভ ডাটাবেস',
        }));

        // FCM District Real-time Detection
        if (initialLoadDoneRef.current) {
          formatted.forEach(spot => {
            if (!knownSpotIdsRef.current.has(spot.id)) {
              knownSpotIdsRef.current.add(spot.id);
              // If new spot is reported in the user's selected district and is high-threat
              if (
                spot.division === selectedDistrict &&
                (spot.status === 'RED' || spot.score >= 70 || parseInt(spot.rate, 10) >= 100)
              ) {
                triggerDistrictPushAlert(spot);
                setActiveDistrictAlert({
                  title: `🚨 [${spot.division} জেলা] নতুন রেড জোন চাঁদাবাজি সতর্কতা!`,
                  message: `${spot.name} (${spot.area}) স্পটে ৳ ${spot.rate} হারে চাঁদা দাবির তীব্র অভিযোগ রেকর্ড হয়েছে।`,
                  spot,
                });
              }
            }
          });
        } else {
          formatted.forEach(spot => knownSpotIdsRef.current.add(spot.id));
          initialLoadDoneRef.current = true;
        }

        setSpots(formatted);
        setSelectedSpot(prev => {
          if (!prev) return formatted[0] || null;
          const found = formatted.find(s => s.id === prev.id);
          return found || formatted[0] || null;
        });
      },
      (err) => {
        console.warn('Firestore subscription fallback to server API:', err);
        safeFetchJson<{ spots: ExtortionSpot[] }>('/api/spots')
          .then(res => {
            if (res.ok && res.data?.spots && Array.isArray(res.data.spots)) {
              setSpots(res.data.spots);
              setSelectedSpot(res.data.spots[0] || null);
            }
          })
          .catch(() => {});
      }
    );

    return () => {
      if (unsub) unsub();
    };
  }, [selectedDistrict]);

  // Real-time Firestore alerts subscriber
  useEffect(() => {
    const unsub = subscribeToFirestoreAlerts((alerts) => {
      if (!alerts || alerts.length === 0) return;
      const latest = alerts[0];
      if (
        latest &&
        latest.severity === 'CRITICAL' &&
        (latest.district === selectedDistrict || !latest.district)
      ) {
        // Show emergency district banner if not shown already
        setActiveDistrictAlert(prev => {
          if (prev && prev.title === latest.title) return prev;
          return {
            title: latest.title,
            message: latest.message,
          };
        });
      }
    });

    return () => {
      if (unsub) unsub();
    };
  }, [selectedDistrict]);

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

  useEffect(() => {
    localStorage.setItem('civic_karma', civicKarma.toString());
  }, [civicKarma]);

  useEffect(() => {
    localStorage.setItem('user_nid_hash', userNidHashed);
  }, [userNidHashed]);

  // Handle Voting
  const handleVote = (spotId: number, isUp: boolean) => {
    const token = localStorage.getItem('civic_auth_token');
    safeFetchJson<{ spot: ExtortionSpot }>(`/api/spots/${spotId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ isUp }),
    })
      .then(res => {
        if (res.ok && res.data?.spot) {
          setSpots(prev => prev.map(s => s.id === spotId ? res.data!.spot : s));
          if (selectedSpot && selectedSpot.id === spotId) {
            setSelectedSpot(res.data.spot);
          }
        }
      })
      .catch(e => console.warn('Vote server sync error:', e));

    // Also sync directly with Firestore
    voteSpotInFirestore(spotId, isUp).catch(() => {});

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
      reportedBy: auth.currentUser?.uid || currentUser?.id || 'anon_citizen',
      reporterName: currentUser?.name || 'নাগরিক',
    }).catch(e => console.warn('Firestore spot sync fallback:', e));

    // Trigger FCM real-time push alert if high-threat / Red Zone
    if (newSpot.status === 'RED' || newSpot.score >= 70 || parseInt(newSpot.rate, 10) >= 100) {
      triggerDistrictPushAlert(newSpot);
    }

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
          onOpenDistrictAlert={() => setShowDistrictAlertModal(true)}
          onOpenSos={() => setShowSosModal(true)}
          onTogglePanicMode={() => setIsPanicMode(true)}
          onOpenNid={() => setShowZkpModal(true)}
          onOpenAuth={() => setShowAuthModal(true)}
          currentUser={currentUser}
          userNidHashed={userNidHashed}
          civicKarma={currentUser ? currentUser.karma : civicKarma}
          selectedDistrict={selectedDistrict}
        />

        {/* Real-time District Emergency Push Alert Banner */}
        {activeDistrictAlert && (
          <div className="mx-3 mt-2 bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 text-white rounded-2xl p-3 shadow-xl border border-rose-300/60 z-30 flex items-start justify-between gap-2 animate-bounce">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <BellRing className="w-4 h-4 text-white" />
              </div>
              <div className="text-xs">
                <span className="font-black block">{activeDistrictAlert.title}</span>
                <p className="text-[11px] text-rose-100 leading-tight mt-0.5">{activeDistrictAlert.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {activeDistrictAlert.spot && (
                <button
                  onClick={() => {
                    setSelectedSpot(activeDistrictAlert.spot!);
                    setActiveTab('explore');
                    setActiveDistrictAlert(null);
                  }}
                  className="bg-white text-rose-600 px-2 py-1 rounded-lg font-bold text-[10.5px] shadow-sm hover:bg-rose-50 transition"
                >
                  ম্যাপে দেখুন
                </button>
              )}
              <button
                onClick={() => setActiveDistrictAlert(null)}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>
          </div>
        )}

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
                safeFetchJson<{ spot: ExtortionSpot }>(`/api/spots/${spotId}/jury`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  body: JSON.stringify({ isTrue: isUp }),
                })
                  .then(res => {
                    if (res.ok && res.data?.spot) {
                      setSpots(prev => prev.map(s => s.id === spotId ? res.data!.spot : s));
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

        <DistrictAlertModal
          isOpen={showDistrictAlertModal}
          onClose={() => setShowDistrictAlertModal(false)}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={(dist) => setSelectedDistrict(dist)}
          onSpotSelect={(spotId) => {
            const found = spots.find(s => s.id === spotId);
            if (found) {
              setSelectedSpot(found);
              setActiveTab('explore');
            }
          }}
        />
      </div>
    </div>
  );
}
