import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Search,
  ShieldAlert,
  Route,
  FileText,
  Download,
  ThumbsUp,
  ThumbsDown,
  Eye,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertOctagon,
  Compass,
  MapPin,
  Plus,
  ArrowLeft,
  ShieldCheck,
  Building,
  UserCheck,
  Filter,
} from 'lucide-react';
import { ExtortionSpot, SpotCategory } from '../types';
import { formatDistanceBengali } from '../utils/geo';

interface MapViewProps {
  spots: ExtortionSpot[];
  selectedSpot: ExtortionSpot | null;
  onSelectSpot: (spot: ExtortionSpot | null) => void;
  onVote: (spotId: number, isUp: boolean) => void;
  onOpenEvidence: (spot: ExtortionSpot) => void;
  onOpenGdModal: (spot: ExtortionSpot) => void;
  onWitnessTestimony: (spot: ExtortionSpot) => void;
  onNavigateToThreat?: () => void;
  onOpenReportModal?: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  spots,
  selectedSpot,
  onSelectSpot,
  onVote,
  onOpenEvidence,
  onOpenGdModal,
  onWitnessTestimony,
  onNavigateToThreat,
  onOpenReportModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('সকল');
  const [showSafeRoute, setShowSafeRoute] = useState(false);
  const [mobileSheetExpanded, setMobileSheetExpanded] = useState(true);
  const [witnessSubmitted, setWitnessSubmitted] = useState<number | null>(null);

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const routePolyline = useRef<L.Polyline | null>(null);

  const [userLocation, setUserLocation] = useState<[number, number]>([23.7516, 90.3944]);
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const categories: Array<SpotCategory | 'সকল'> = ['সকল', 'পরিবহন', 'কাঁচাবাজার', 'ফুটপাত', 'নদীঘাট', 'অন্যান্য'];

  // Geolocation tracker
  const locateUser = () => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(coords);
          setGpsActive(true);
          if (mapInstance.current) {
            mapInstance.current.flyTo(coords, 14, { duration: 1 });
            if (userMarkerRef.current) {
              userMarkerRef.current.setLatLng(coords);
            }
          }
        },
        err => {
          console.warn('Geolocation permission error, using fallback:', err);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  useEffect(() => {
    locateUser();
  }, []);

  // Filtered spots
  const filteredSpots = spots.filter(spot => {
    const matchesCategory = selectedCategory === 'সকল' || spot.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      spot.name.toLowerCase().includes(q) ||
      spot.syndicateName.toLowerCase().includes(q) ||
      spot.area.toLowerCase().includes(q) ||
      spot.division.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  // Initialize Leaflet Map
  useEffect(() => {
    if (mapContainer.current && !mapInstance.current) {
      const map = L.map(mapContainer.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([23.7516, 90.3944], 13);

      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 18,
          errorTileUrl: 'https://tile.openstreetmap.org/13/4915/3412.png',
        }
      ).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      markersLayer.current = L.layerGroup().addTo(map);
      mapInstance.current = map;
    }

    const timer = setTimeout(() => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // Update Markers
  useEffect(() => {
    if (mapInstance.current && markersLayer.current) {
      markersLayer.current.clearLayers();

      filteredSpots.forEach(spot => {
        let pinClass = 'custom-pink-pin';
        let circleColor = '#f43f5e';
        let circleFill = '#fda4af';

        if (spot.status === 'YELLOW') {
          pinClass = 'custom-yellow-pin';
          circleColor = '#d97706';
          circleFill = '#fef08a';
        } else if (spot.status === 'GREEN') {
          pinClass = 'custom-green-pin';
          circleColor = '#059669';
          circleFill = '#a7f3d0';
        }

        const customIcon = L.divIcon({
          className: pinClass,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker(spot.coords, { icon: customIcon }).addTo(markersLayer.current!);

        marker.on('click', () => {
          onSelectSpot(spot);
          setMobileSheetExpanded(true);
          if (mapInstance.current) {
            mapInstance.current.flyTo(spot.coords, 14, { duration: 0.8 });
          }
        });

        L.circle(spot.coords, {
          color: circleColor,
          fillColor: circleFill,
          fillOpacity: spot.status === 'RED' ? 0.3 : 0.18,
          weight: 1.5,
          radius: spot.status === 'RED' ? 450 : 350,
        }).addTo(markersLayer.current!);
      });

      // User Live GPS Pin
      if (userLocation) {
        const userIcon = L.divIcon({
          className: 'user-live-gps-pin',
          html: '<div style="width:18px;height:18px;background:#2563eb;border:3px solid #ffffff;border-radius:50%;box-shadow:0 0 12px #2563eb;"></div>',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        const uMarker = L.marker(userLocation, { icon: userIcon }).addTo(markersLayer.current!);
        uMarker.bindPopup('<b>📍 আপনার বর্তমান অবস্থান</b><br/><span style="font-size:11px;">লাইভ জিপিএস সংযোগ</span>');
        userMarkerRef.current = uMarker;
      }
    }
  }, [filteredSpots, onSelectSpot, userLocation]);

  // Safe Route Polyline Toggle
  useEffect(() => {
    if (mapInstance.current) {
      if (showSafeRoute) {
        const bypassCoords: L.LatLngExpression[] = [
          [23.7380, 90.3800],
          [23.7480, 90.3780],
          [23.7620, 90.3820],
          [23.7740, 90.3890],
          [23.7850, 90.4020],
        ];

        routePolyline.current = L.polyline(bypassCoords, {
          color: '#059669',
          weight: 4.5,
          dashArray: '8, 8',
          opacity: 0.9,
        }).addTo(mapInstance.current);

        mapInstance.current.fitBounds(routePolyline.current.getBounds(), { padding: [40, 40] });
      } else if (routePolyline.current) {
        mapInstance.current.removeLayer(routePolyline.current);
        routePolyline.current = null;
      }
    }
  }, [showSafeRoute]);

  const handleDownloadDossier = (spot: ExtortionSpot) => {
    const textContent = `==========================================================
জাতীয় চাঁদাবাজি রেজিস্ট্রি ও নাগরিক প্রতিরক্ষা ডসিয়ার
দলিলায়ন ও অনুসন্ধানী আইডি: ${spot.ipfsCid}
==========================================================
স্পটের নাম: ${spot.name}
বিভাগ ও এলাকা: ${spot.division}, ${spot.area}
সংশ্লিষ্ট থানা: ${spot.policeStation}
ক্যাটাগরি: ${spot.category}
ঝুঁকি স্থিতি: ${spot.status === 'RED' ? 'রেড জোন (সক্রিয় ও তীব্র চাঁদাবাজি)' : spot.status === 'YELLOW' ? 'তদন্তাধীন জোন' : 'মুক্ত স্পট'}
স্থানাঙ্ক: ${spot.coords.join(', ')}

[সিন্ডিকেট বিবরণী]
সিন্ডিকেটের নাম: ${spot.syndicateName}
দাবিকৃত হার: ৳ ${spot.rate} (${spot.unit})
দৈনিক সম্ভাব্য আদায়: ${spot.estimatedDailyCollection}

[ফরেনসিক ডিজিটাল সাক্ষ্য]
প্রমাণপত্র টাইপ: ${spot.evidenceType}
শিরোনাম: ${spot.evidenceTitle}
আইপিএফএস সিআইডি: ${spot.ipfsCid}
রিপোর্টার হ্যাশ: ${spot.reportedByHash}

তারিখ: ${new Date().toLocaleString('bn-BD')}
==========================================================`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dossier_${spot.name.replace(/\s+/g, '_')}_${spot.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleWitnessClick = (spot: ExtortionSpot) => {
    onWitnessTestimony(spot);
    setWitnessSubmitted(spot.id);
    setTimeout(() => {
      setWitnessSubmitted(null);
    }, 2500);
  };

  return (
    <div className="relative w-full h-full flex flex-col lg:flex-row overflow-hidden bg-slate-100">
      
      {/* ======================================================== */}
      {/* DESKTOP SIDEBAR: Incident Explorer & Forensic Inspector  */}
      {/* ======================================================== */}
      <div className="hidden lg:flex flex-col w-[420px] h-full bg-white border-r border-slate-200/90 shadow-sm z-20 shrink-0">
        
        {/* Top Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="স্পট, এলাকা বা চক্রের নাম অনুসন্ধান..."
              className="w-full pl-9 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-200 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>ফলাফল: <strong className="text-slate-900 font-num">{filteredSpots.length}</strong> টি স্পট</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              লাইভ ক্লাউড ডাটাবেস
            </span>
          </div>
        </div>

        {/* Sidebar Body: Spot Detail OR Spot List OR Empty State */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          
          {selectedSpot ? (
            /* Selected Spot Forensic Inspector View */
            <div className="space-y-4 animate-fadeIn">
              
              {/* Back to List Button */}
              <button
                onClick={() => onSelectSpot(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>সকল স্পট তালিকায় ফিরে যান</span>
              </button>

              {/* Title Header Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      {selectedSpot.division} বিভাগ · {selectedSpot.category}
                    </span>
                    <h3 className="text-base font-black text-slate-900 leading-snug">
                      {selectedSpot.name}
                    </h3>
                    <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{selectedSpot.area}</span>
                    </p>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    selectedSpot.status === 'RED'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : selectedSpot.status === 'YELLOW'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {selectedSpot.status === 'RED' ? 'রেড জোন' : selectedSpot.status === 'YELLOW' ? 'তদন্তাধীন' : 'মুক্ত'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">দাবিকৃত অবৈধ চাঁদা</span>
                    <span className="text-sm font-black text-rose-600 font-num">
                      ৳ {selectedSpot.rate} <span className="text-[11px] font-normal text-slate-500">/{selectedSpot.unit}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">দায়ী অপরাধ চক্র</span>
                    <span className="text-xs font-bold text-slate-800">{selectedSpot.syndicateName}</span>
                  </div>
                </div>
              </div>

              {/* Evidence & Jurisdictional Police Station */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    সংশ্লিষ্ট থানা:
                  </span>
                  <span className="font-medium text-slate-900">{selectedSpot.policeStation}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-700">ডিজিটাল সাক্ষ্য ও অডিট:</span>
                  <button
                    onClick={() => onOpenEvidence(selectedSpot)}
                    className="text-rose-600 hover:text-rose-700 font-bold inline-flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>প্রমাণপত্র দেখুন</span>
                  </button>
                </div>
              </div>

              {/* Citizen Consensus & Actions */}
              <div className="space-y-2 pt-1">
                <div className="flex gap-2">
                  <button
                    onClick={() => onVote(selectedSpot.id, true)}
                    className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>সত্য ({selectedSpot.upvotes})</span>
                  </button>

                  <button
                    onClick={() => onVote(selectedSpot.id, false)}
                    className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                    <span>সন্দেহজনক ({selectedSpot.downvotes})</span>
                  </button>
                </div>

                <button
                  onClick={() => handleWitnessClick(selectedSpot)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    witnessSubmitted === selectedSpot.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>
                    {witnessSubmitted === selectedSpot.id ? 'সাক্ষ্য লিপিবদ্ধ হয়েছে (+১০ কার্মা)' : 'আমিও প্রত্যক্ষদর্শী (নাগরিক সাক্ষ্য দিন)'}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => onOpenGdModal(selectedSpot)}
                    className="py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>জিডি ড্রাফট করুন</span>
                  </button>

                  <button
                    onClick={() => handleDownloadDossier(selectedSpot)}
                    className="py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ডসিয়ার ডাউনলোড</span>
                  </button>
                </div>
              </div>

            </div>
          ) : filteredSpots.length === 0 ? (
            /* Clean Enterprise Empty State */
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-100 shadow-xs">
                <ShieldCheck className="w-7 h-7 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">
                  ফায়ারবেস ক্লাউড ডেটাবেস সংযুক্ত
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  নির্বাচিত ক্যাটাগরি বা ফিল্টারে বর্তমানে কোনো সক্রিয় চাঁদাবাজি স্পট নেই। সম্পূর্ণ ডেটাবেস লাইভ ক্লাউড ডাটাবেস থেকে পরিচালিত।
                </p>
              </div>

              {onOpenReportModal && (
                <button
                  onClick={onOpenReportModal}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>প্রথম স্পট রিপোর্ট করুন</span>
                </button>
              )}
            </div>
          ) : (
            /* Incident List */
            <div className="space-y-2.5">
              {filteredSpots.map(spot => (
                <div
                  key={spot.id}
                  onClick={() => {
                    onSelectSpot(spot);
                    if (mapInstance.current) {
                      mapInstance.current.flyTo(spot.coords, 14, { duration: 0.8 });
                    }
                  }}
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-rose-300 rounded-xl cursor-pointer transition-all shadow-xs group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        {spot.division} · {spot.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                        {spot.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{spot.area}</p>
                    </div>

                    <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                      spot.status === 'RED'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : spot.status === 'YELLOW'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {spot.status === 'RED' ? 'রেড জোন' : spot.status === 'YELLOW' ? 'তদন্তাধীন' : 'মুক্ত'}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-rose-600 font-num">
                      ৳ {spot.rate} <span className="text-[10px] text-slate-400 font-normal">/{spot.unit}</span>
                    </span>
                    <span className="text-slate-500 text-[10.5px]">
                      সাক্ষ্য: <strong className="text-slate-700 font-num">{spot.upvotes}</strong> জন
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* ======================================================== */}
      {/* INTERACTIVE LEAFLET MAP CANVAS                           */}
      {/* ======================================================== */}
      <div className="flex-1 h-full relative overflow-hidden">
        
        {/* Floating Tools on Top of Map */}
        <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 right-2.5 sm:right-3 z-10 flex items-center justify-between pointer-events-none gap-1.5 sm:gap-2">
          
          {/* Mobile search bar */}
          <div className="lg:hidden pointer-events-auto flex-1 max-w-sm mr-1 sm:mr-2 min-w-0">
            <div className="bg-white/95 backdrop-blur-md rounded-xl p-1.5 sm:p-2 border border-slate-200 shadow-md flex items-center gap-1.5 min-w-0">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="স্পট খুঁজুন..."
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none min-w-0"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto ml-auto shrink-0">
            {/* GPS Tracking Button */}
            <button
              onClick={locateUser}
              title="আমার লাইভ অবস্থান দেখুন"
              className={`h-8.5 sm:h-9 px-2 sm:px-3 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 text-xs font-bold flex items-center gap-1 sm:gap-1.5 shadow-md hover:bg-slate-50 transition-all shrink-0 ${
                gpsActive ? 'text-blue-600' : 'text-slate-700'
              }`}
            >
              <Compass className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${gpsActive ? 'text-blue-600 animate-spin' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">আমার অবস্থান</span>
            </button>

            {/* Safe Bypass Route Toggle */}
            <button
              onClick={() => setShowSafeRoute(!showSafeRoute)}
              className={`h-8.5 sm:h-9 px-2 sm:px-3 rounded-xl text-xs font-bold flex items-center gap-1 sm:gap-1.5 shadow-md transition-all shrink-0 ${
                showSafeRoute
                  ? 'bg-emerald-600 text-white shadow-emerald-600/25 ring-2 ring-emerald-300'
                  : 'bg-white/95 backdrop-blur-md text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Route className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">{showSafeRoute ? 'বাইপাস সক্রিয়' : 'নিরাপদ রুট'}</span>
              <span className="sm:hidden">{showSafeRoute ? 'বাইপাস' : 'রুট'}</span>
            </button>
          </div>

        </div>

        {/* Map Legend */}
        <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 text-[10.5px] space-y-1 shadow-md hidden sm:block">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-700 font-semibold">রেড জোন (সক্রিয় চাঁদাবাজি)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-700 font-semibold">হলুদ জোন (তদন্তাধীন)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-700 font-semibold">গ্রিন জোন (চাঁদাবাজিমুক্ত)</span>
          </div>
        </div>

        {/* Map DOM Element */}
        <div ref={mapContainer} className="w-full h-full z-0" />

        {/* ======================================================== */}
        {/* MOBILE SLIDE-UP BOTTOM SHEET (< lg screens)              */}
        {/* ======================================================== */}
        <div className="lg:hidden">
          {selectedSpot ? (
            <div
              className={`absolute bottom-3 left-3 right-3 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-200 transition-all ${
                mobileSheetExpanded ? 'max-h-[70%] overflow-y-auto' : 'max-h-[88px] overflow-hidden'
              }`}
            >
              <div
                onClick={() => setMobileSheetExpanded(!mobileSheetExpanded)}
                className="cursor-pointer flex flex-col items-center mb-2"
              >
                <div className="w-8 h-1 bg-slate-300 rounded-full mb-1" />
                <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <span>{mobileSheetExpanded ? 'সংক্ষেপ করুন' : 'বিস্তারিত দেখুন'}</span>
                  {mobileSheetExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                </div>
              </div>

              <div className="flex justify-between items-start gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{selectedSpot.name}</h4>
                  <p className="text-xs text-slate-500">{selectedSpot.area}</p>
                </div>
                <span className="text-xs font-bold text-rose-600 font-num">
                  ৳ {selectedSpot.rate} /{selectedSpot.unit}
                </span>
              </div>

              {mobileSheetExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">অপরাধ চক্র:</span>
                    <span className="font-bold text-slate-800">{selectedSpot.syndicateName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">থানা:</span>
                    <span className="font-medium text-slate-800">{selectedSpot.policeStation}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => onVote(selectedSpot.id, true)}
                      className="flex-1 py-1.5 bg-slate-100 rounded-lg font-bold text-slate-700"
                    >
                      সত্য ({selectedSpot.upvotes})
                    </button>
                    <button
                      onClick={() => onOpenEvidence(selectedSpot)}
                      className="flex-1 py-1.5 bg-rose-50 text-rose-700 rounded-lg font-bold"
                    >
                      সাক্ষ্য দেখুন
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : spots.length === 0 ? (
            <div className="absolute bottom-4 left-4 right-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-200 text-center space-y-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-slate-800">ফায়ারবেস ডেটাবেসে কোনো সক্রিয় স্পট নেই</p>
              {onOpenReportModal && (
                <button
                  onClick={onOpenReportModal}
                  className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  + প্রথম অভিযোগ দাখিল করুন
                </button>
              )}
            </div>
          ) : null}
        </div>

      </div>

    </div>
  );
};
