import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Search, ShieldAlert, Route, FileText, Download, ThumbsUp, ThumbsDown, Eye, ChevronUp, ChevronDown, CheckCircle2, AlertOctagon, Compass } from 'lucide-react';
import { ExtortionSpot, SpotCategory } from '../types';
import { calculateHaversineDistance, formatDistanceBengali } from '../utils/geo';

interface MapViewProps {
  spots: ExtortionSpot[];
  selectedSpot: ExtortionSpot | null;
  onSelectSpot: (spot: ExtortionSpot) => void;
  onVote: (spotId: number, isUp: boolean) => void;
  onOpenEvidence: (spot: ExtortionSpot) => void;
  onOpenGdModal: (spot: ExtortionSpot) => void;
  onWitnessTestimony: (spot: ExtortionSpot) => void;
  onNavigateToThreat?: () => void;
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
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('সকল');
  const [showSafeRoute, setShowSafeRoute] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [witnessSubmitted, setWitnessSubmitted] = useState<number | null>(null);

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const routePolyline = useRef<L.Polyline | null>(null);

  const [userLocation, setUserLocation] = useState<[number, number]>([23.7516, 90.3944]);
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const categories: Array<SpotCategory | 'সকল'> = ['সকল', 'পরিবহন', 'কাঁচাবাজার', 'ফুটপাত', 'নদীঘাট', 'অন্যান্য'];

  // Real GPS Geolocation tracker
  const locateUser = () => {
    if ('geolocation' in navigator) {
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

  // Filter spots
  const filteredSpots = spots.filter(spot => {
    const matchesCategory = selectedCategory === 'সকল' || spot.category === selectedCategory;
    const matchesSearch =
      spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.syndicateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.division.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Initialize Leaflet Map
  useEffect(() => {
    if (mapContainer.current && !mapInstance.current) {
      const map = L.map(mapContainer.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([23.7516, 90.3944], 13); // Dhaka coordinates

      // Esri Light Gray Base (Pastel Clean Vector style)
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 18,
          errorTileUrl: 'https://tile.openstreetmap.org/13/4915/3412.png',
        }
      ).addTo(map);

      // Add Zoom control to top right with neat style
      L.control.zoom({ position: 'topright' }).addTo(map);

      markersLayer.current = L.layerGroup().addTo(map);
      mapInstance.current = map;
    }

    const timer = setTimeout(() => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    }, 250);

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
          setSheetExpanded(true);
          if (mapInstance.current) {
            mapInstance.current.flyTo(spot.coords, 14, { duration: 0.8 });
          }
        });

        // Geofence Circle
        L.circle(spot.coords, {
          color: circleColor,
          fillColor: circleFill,
          fillOpacity: spot.status === 'RED' ? 0.35 : 0.25,
          weight: 1.5,
          radius: spot.status === 'RED' ? 450 : 350,
        }).addTo(markersLayer.current!);
      });

      // Add real user live GPS marker
      if (userLocation) {
        const userIcon = L.divIcon({
          className: 'user-live-gps-pin',
          html: '<div style="width:18px;height:18px;background:#2563eb;border:3px solid #ffffff;border-radius:50%;box-shadow:0 0 12px #2563eb;"></div>',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        const uMarker = L.marker(userLocation, { icon: userIcon }).addTo(markersLayer.current!);
        uMarker.bindPopup('<b>📍 আপনার বর্তমান লাইভ অবস্থান</b><br/><span style="font-size:11px;">জিপিএস ট্রেসিং সক্রিয়</span>');
        userMarkerRef.current = uMarker;
      }
    }
  }, [filteredSpots, onSelectSpot, userLocation]);

  // Safe Route Toggle
  useEffect(() => {
    if (mapInstance.current) {
      if (showSafeRoute) {
        // Safe bypass route skirting around Kawran Bazar & Tejgaon
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
জাতীয় চাঁদাবাজি রেজিস্ট্রি ও নাগরিক ডসিয়ার (CIVIC DEFENSE HUB)
দলিলায়ন ও অনুসন্ধানী নথি আইডি: ${spot.ipfsCid}
==========================================================
স্পটের নাম: ${spot.name}
বিভাগ ও এলাকা: ${spot.division}, ${spot.area}
সংশ্লিষ্ট থানা: ${spot.policeStation}
ক্যাটাগরি: ${spot.category}
ঝুঁকি স্থিতি: ${spot.status === 'RED' ? 'ভেরিফায়েড রেড জোন (সক্রিয় চাঁদাবাজি)' : spot.status === 'YELLOW' ? 'তদন্তাধীন জোন' : 'মুক্ত স্পট'}
এআই ট্রাস্ট স্কোর: ${spot.score}%
স্থানাঙ্ক (GPS Coords): ${spot.coords.join(', ')}

[সিন্ডিকেট বিবরণী]
সিন্ডিকেটের নাম: ${spot.syndicateName}
দাবিকৃত হার: ৳ ${spot.rate} (${spot.unit})
আনুমানিক দৈনিক চাঁদা আদায়: ${spot.estimatedDailyCollection || '৳ ১,০০,০০০+'}

[ডিজিটাল প্রমাণ তথ্য]
প্রমাণপত্র টাইপ: ${spot.evidenceType}
শিরোনাম: ${spot.evidenceTitle}
মেটাডেটা: ${spot.evidenceMeta}
আইপিএফএস বিকেন্দ্রীকৃত CID: ${spot.ipfsCid}
রিপোর্টকারীর ক্রিপ্টোগ্রাফিক হ্যাশ: ${spot.reportedByHash}

[হালনাগাদ কার্যবিবরণী]
${spot.updates.map((u, i) => `${i + 1}. ${u}`).join('\n')}

বিজ্ঞপ্তি: এই নথিটি নাগরিক অধিকার ও আইনের শাসনের স্বার্থে ক্রিপ্টোগ্রাফিক ডেটাবেস থেকে সংকলিত।
তারিখ ও সময়: ${new Date().toLocaleString('bn-BD')}
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
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* Floating Header Controls */}
      <div className="absolute top-3 left-3 right-3 z-20 space-y-2 pointer-events-none">
        {/* Search Bar + Safe Route Bypass Toggle */}
        <div className="glass-card rounded-2xl p-2 flex items-center gap-2 pointer-events-auto shadow-md">
          <Search className="w-4 h-4 text-pink-500 shrink-0 ml-1.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="স্পট, এলাকা বা সিন্ডিকেটের নাম খুঁজুন..."
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-1"
            >
              ×
            </button>
          )}

          <button
            onClick={locateUser}
            title="আমার বর্তমান অবস্থান ট্র্যাক করুন"
            className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 transition-all ${
              gpsActive
                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Compass className={`w-3.5 h-3.5 ${gpsActive ? 'text-blue-600 animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowSafeRoute(!showSafeRoute)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shrink-0 transition-all ${
              showSafeRoute
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            <span>{showSafeRoute ? 'বাইপাস সক্রিয়' : 'সেফ রুট'}</span>
          </button>
        </div>

        {/* Category Pills Filter */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto py-0.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                selectedCategory === cat
                  ? 'bg-rose-500 text-white pink-glow'
                  : 'glass-pill text-slate-700 hover:text-slate-900 hover:bg-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Full-view Leaflet Map Container */}
      <div ref={mapContainer} className="w-full h-full z-0" />

      {/* Floating Map Legend Indicator */}
      <div className="absolute top-24 right-3 z-10 glass-pill px-2.5 py-1.5 rounded-xl text-[10px] space-y-1 shadow-sm hidden sm:block">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span className="text-slate-700 font-medium">রেড জোন (সক্রিয়)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-slate-700 font-medium">হলুদ জোন (তদন্তাধীন)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-slate-700 font-medium">গ্রিন জোন (মুক্ত স্পট)</span>
        </div>
      </div>

      {/* Draggable Frosted Glass Bottom Sheet */}
      {selectedSpot ? (
        <div
          className={`absolute bottom-3 left-3 right-3 z-20 glass-card rounded-[28px] p-4 transition-all duration-300 border border-white/95 ${
            sheetExpanded ? 'max-h-[72%] overflow-y-auto' : 'max-h-[92px] overflow-hidden'
          }`}
        >
          {/* Drag handle header */}
          <div
            onClick={() => setSheetExpanded(!sheetExpanded)}
            className="cursor-pointer group flex flex-col items-center mb-2"
          >
            <div className="w-10 h-1.5 bg-slate-300 group-hover:bg-pink-400 rounded-full transition-colors mb-1" />
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
              <span>{sheetExpanded ? 'সংক্ষেপ করুন' : 'বিস্তারিত বিবরণ দেখতে টানুন'}</span>
              {sheetExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </div>
          </div>

          {/* Top Title & Score */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                    selectedSpot.status === 'RED'
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : selectedSpot.status === 'YELLOW'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      selectedSpot.status === 'RED'
                        ? 'bg-rose-600'
                        : selectedSpot.status === 'YELLOW'
                        ? 'bg-amber-600'
                        : 'bg-emerald-600'
                    }`}
                  ></span>
                  {selectedSpot.status === 'RED'
                    ? 'ভেরিফায়েড রেড জোন'
                    : selectedSpot.status === 'YELLOW'
                    ? 'তদন্তাধীন জোন'
                    : 'প্রশাসন কর্তৃক মুক্ত স্পট'}
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">
                  এআই ট্রাস্ট স্কোর: <b className="text-slate-800">{selectedSpot.score}%</b>
                </span>
                <span className="text-[10px] text-slate-400">
                  · {userLocation ? formatDistanceBengali(calculateHaversineDistance(userLocation, selectedSpot.coords)) : selectedSpot.distance} দূরে
                </span>
              </div>

              <h2 className="text-sm font-extrabold text-slate-900 mt-1">{selectedSpot.name}</h2>
              <p className="text-[11px] text-slate-500">
                {selectedSpot.division} বিভাগ • {selectedSpot.area} ({selectedSpot.policeStation})
              </p>

              {/* AI Escalation Risk Prediction Chip */}
              {selectedSpot.status === 'YELLOW' && onNavigateToThreat && (
                <button
                  onClick={onNavigateToThreat}
                  className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-lg transition"
                >
                  <span>⚡ AI পূর্বাভাস: {Math.min(95, Math.round(selectedSpot.score * 0.95))}% রেড জোন ঝুঁকি</span>
                  <span className="text-amber-700 underline ml-1">বিশ্লেষণ →</span>
                </button>
              )}
            </div>

            {/* Live Upvote & Downvote Counter */}
            <div className="flex items-center gap-1 bg-pink-50/90 px-2 py-1 rounded-xl border border-pink-100 shrink-0">
              <button
                onClick={() => onVote(selectedSpot.id, true)}
                title="সত্যতা সমর্থন করুন (+১)"
                className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-bold text-xs p-1 active:scale-95 transition"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span className="font-num">{selectedSpot.upvotes}</span>
              </button>
              <div className="w-[1px] h-3 bg-pink-200"></div>
              <button
                onClick={() => onVote(selectedSpot.id, false)}
                title="ভিত্তিহীন মনে হলে জানান"
                className="text-slate-400 hover:text-slate-600 text-xs p-1 active:scale-95 transition"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {sheetExpanded && (
            <div className="mt-3 space-y-2.5 animate-fadeIn">
              {/* Demanded Rate & Syndicate info */}
              <div className="bg-pink-50/70 border border-pink-100/80 rounded-xl p-2.5 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-600 block text-[11px]">দাবিকৃত চাঁদার হার:</span>
                  <span className="text-sm font-extrabold text-rose-600">
                    ৳ {selectedSpot.rate}{' '}
                    <span className="text-[11px] font-normal text-slate-600">({selectedSpot.unit})</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">আওতাধীন সিন্ডিকেট:</span>
                  <span className="text-xs font-bold text-slate-800">{selectedSpot.syndicateName}</span>
                </div>
              </div>

              {/* Evidence Snippet */}
              <div className="bg-white/80 rounded-xl p-2.5 flex justify-between items-center text-xs border border-slate-100 shadow-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-slate-800 font-bold text-[11px] block truncate">
                      {selectedSpot.evidenceTitle}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">{selectedSpot.evidenceMeta}</span>
                  </div>
                </div>

                <button
                  onClick={() => onOpenEvidence(selectedSpot)}
                  className="inline-flex items-center gap-1 text-[10px] text-rose-600 font-bold bg-pink-50 hover:bg-pink-100 px-2.5 py-1.5 rounded-lg border border-pink-200 shrink-0 transition"
                >
                  <Eye className="w-3 h-3" />
                  <span>প্রমাণ দেখুন</span>
                </button>
              </div>

              {/* Updates log */}
              {selectedSpot.updates && selectedSpot.updates.length > 0 && (
                <div className="bg-slate-50/80 rounded-xl p-2.5 text-[11px] text-slate-600 border border-slate-100">
                  <span className="font-bold text-slate-700 block mb-1 text-[10px] uppercase tracking-wider">
                    সাম্প্রতিক নজরদারি রিপোর্ট:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {selectedSpot.updates.map((update, idx) => (
                      <li key={idx}>{update}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Two Secondary Actions: Auto-GD & Dossier Export */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  onClick={() => onOpenGdModal(selectedSpot)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-200/90 flex items-center justify-center gap-1.5 active:scale-95 transition"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-600" />
                  <span>অটো-জিডি ড্রাফট</span>
                </button>

                <button
                  onClick={() => handleDownloadDossier(selectedSpot)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-200/90 flex items-center justify-center gap-1.5 active:scale-95 transition"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>ডসিয়ার এক্সপোর্ট</span>
                </button>
              </div>

              {/* Primary Pink CTA Button: Witness Testimony */}
              <button
                onClick={() => handleWitnessClick(selectedSpot)}
                className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  witnessSubmitted === selectedSpot.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-500 hover:bg-rose-600 text-white pink-glow active:scale-98'
                }`}
              >
                {witnessSubmitted === selectedSpot.id ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>সাক্ষ্য সফলভাবে অন্তর্ভুক্ত হয়েছে (+৫ কার্মা)</span>
                  </>
                ) : (
                  <>
                    <AlertOctagon className="w-4 h-4" />
                    <span>প্রত্যক্ষদর্শী হিসেবে সাক্ষ্য দিন</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : spots.length === 0 ? (
        <div className="absolute bottom-6 left-4 right-4 z-20 glass-card rounded-3xl p-5 border border-white/95 shadow-xl text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-800">
            ফায়ারবেস ডাটাবেসে বর্তমানে কোনো স্পট নথিভুক্ত নেই
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            ক্লাউড ডাটাবেস সম্পূর্ণ সক্রিয় ও লাইভ। আপনি নিচের প্লাস (<strong className="text-rose-600">+</strong>) বাটনে ট্যাপ করে আপনার এলাকার প্রথম চাঁদাবাজি স্পট বা অভিযোগ দাখিল করতে পারেন।
          </p>
        </div>
      ) : null}
    </div>
  );
};
