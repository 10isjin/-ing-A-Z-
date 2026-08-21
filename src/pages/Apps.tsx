import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Smartphone, 
  ExternalLink, 
  Activity, 
  Trophy, 
  Heart, 
  Timer, 
  Loader2, 
  Award, 
  Target, 
  Zap, 
  Book, 
  Globe, 
  Video, 
  Music, 
  Camera, 
  Map, 
  Users, 
  MessageSquare, 
  Star, 
  Smile, 
  Dumbbell, 
  Layout, 
  Grid, 
  List, 
  Info, 
  Play, 
  Mic, 
  Headphones, 
  Cpu, 
  Cloud, 
  Wifi, 
  Sun, 
  Moon, 
  Flame, 
  Leaf, 
  Coffee, 
  Utensils, 
  Briefcase, 
  FileText, 
  Mail, 
  Send, 
  Share2, 
  Download, 
  Upload, 
  Lock, 
  Shield, 
  Flag, 
  MapPin, 
  Navigation, 
  Compass, 
  Clock, 
  Hash, 
  Paperclip, 
  Edit3, 
  Trash2,
  ThumbsUp,
  Search,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, writeBatch, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { AppEntry } from '../types';
import { clsx } from 'clsx';
import { deduplicateApps, RECOMMENDED_DEFAULT_APPS, normalizeAppName } from '../utils/appsData';

const getIcon = (iconName: string) => {
  const props = { className: "text-white", size: 24 };
  switch (iconName) {
    case 'Activity': return <Activity {...props} />;
    case 'Timer': return <Timer {...props} />;
    case 'Trophy': return <Trophy {...props} />;
    case 'Heart': return <Heart {...props} />;
    case 'Smartphone': return <Smartphone {...props} />;
    case 'Award': return <Award {...props} />;
    case 'Target': return <Target {...props} />;
    case 'Zap': return <Zap {...props} />;
    case 'Book': return <Book {...props} />;
    case 'Globe': return <Globe {...props} />;
    case 'Video': return <Video {...props} />;
    case 'Music': return <Music {...props} />;
    case 'Camera': return <Camera {...props} />;
    case 'Map': return <Map {...props} />;
    case 'Users': return <Users {...props} />;
    case 'MessageSquare': return <MessageSquare {...props} />;
    case 'Star': return <Star {...props} />;
    case 'Smile': return <Smile {...props} />;
    case 'Dumbbell': return <Dumbbell {...props} />;
    case 'Layout': return <Layout {...props} />;
    case 'Grid': return <Grid {...props} />;
    case 'List': return <List {...props} />;
    case 'Info': return <Info {...props} />;
    case 'Play': return <Play {...props} />;
    case 'Flame': return <Flame {...props} />;
    case 'MapPin': return <MapPin {...props} />;
    case 'Shield': return <Shield {...props} />;
    default: return <Smartphone {...props} />;
  }
};

export default function Apps() {
  const [apps, setApps] = useState<AppEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedApps, setLikedApps] = useState<Record<string, boolean>>({});
  const [user, setUser] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const q = query(collection(db, 'apps'), orderBy('createdAt', 'desc'));
    const unsubscribeApps = onSnapshot(q, (snapshot) => {
      const fetchedApps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppEntry));
      
      // Deduplicate fetched apps from database
      const uniqueFetched = deduplicateApps(fetchedApps);

      // Merge with default recommended apps so missing defaults are included seamlessly
      const existingKeys = new Set(uniqueFetched.map(a => normalizeAppName(a.name)));
      const fallbackList: AppEntry[] = RECOMMENDED_DEFAULT_APPS
        .filter(def => !existingKeys.has(normalizeAppName(def.name)))
        .map((def, idx) => ({
          ...def,
          id: `default-${idx}`,
          createdAt: Timestamp.now()
        }));

      const finalApps = [...uniqueFetched, ...fallbackList];
      setApps(finalApps);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching apps, falling back to default list:", error);
      // Fallback to local defaults if Firestore read has issues
      const fallbackList: AppEntry[] = RECOMMENDED_DEFAULT_APPS.map((def, idx) => ({
        ...def,
        id: `default-${idx}`,
        createdAt: Timestamp.now()
      }));
      setApps(fallbackList);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeApps();
    };
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'appLikes'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const likes: Record<string, boolean> = {};
        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (data.userId === user.uid) {
            likes[data.appId] = true;
          }
        });
        setLikedApps(likes);
      });
      return () => unsubscribe();
    } else {
      const saved = localStorage.getItem('app_likes');
      if (saved) {
        try {
          setLikedApps(JSON.parse(saved));
        } catch (e) {
          console.error("Error parsing saved likes:", e);
        }
      }
    }
  }, [user]);

  const handleLike = async (app: AppEntry) => {
    const appId = app.id || normalizeAppName(app.name);
    const isLiked = likedApps[appId];

    // If it's an existing Firestore doc
    if (app.id && !app.id.startsWith('default-')) {
      const appRef = doc(db, 'apps', app.id);
      if (user) {
        const likeId = `${user.uid}_${app.id}`;
        const likeRef = doc(db, 'appLikes', likeId);
        const batch = writeBatch(db);

        try {
          if (isLiked) {
            batch.delete(likeRef);
            batch.update(appRef, { likesCount: increment(-1) });
          } else {
            batch.set(likeRef, {
              appId: app.id,
              userId: user.uid,
              createdAt: new Date()
            });
            batch.update(appRef, { likesCount: increment(1) });
          }
          await batch.commit();
        } catch (error) {
          console.error("Error toggling app like (auth):", error);
        }
      } else {
        try {
          const localLikes = JSON.parse(localStorage.getItem('app_likes') || '{}');
          if (isLiked) {
            await updateDoc(appRef, { likesCount: increment(-1) });
            delete localLikes[appId];
          } else {
            await updateDoc(appRef, { likesCount: increment(1) });
            localLikes[appId] = true;
          }
          localStorage.setItem('app_likes', JSON.stringify(localLikes));
          setLikedApps({ ...localLikes });
        } catch (error) {
          console.error("Error toggling app like (unauth):", error);
        }
      }
    } else {
      // Local state update for non-persisted default cards
      const nextLiked = !isLiked;
      const updatedLikes = { ...likedApps, [appId]: nextLiked };
      setLikedApps(updatedLikes);
      localStorage.setItem('app_likes', JSON.stringify(updatedLikes));
      setApps(prev => prev.map(a => {
        if ((a.id || normalizeAppName(a.name)) === appId) {
          return {
            ...a,
            likesCount: Math.max(0, (a.likesCount || 0) + (nextLiked ? 1 : -1))
          };
        }
        return a;
      }));
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    apps.forEach(a => {
      if (a.category) {
        const mainCat = a.category.split('/')[0].trim();
        set.add(mainCat);
      }
    });
    return ['전체', '추천 앱', ...Array.from(set)];
  }, [apps]);

  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const matchesSearch = !searchQuery.trim() || 
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.category.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedCategory === '전체') return true;
      if (selectedCategory === '추천 앱') return !!app.isRecommended;
      return app.category.includes(selectedCategory);
    });
  }, [apps, searchQuery, selectedCategory]);

  const recommendedList = useMemo(() => {
    return filteredApps.filter(app => app.isRecommended);
  }, [filteredApps]);

  const generalList = useMemo(() => {
    return filteredApps.filter(app => !app.isRecommended);
  }, [filteredApps]);

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      {/* Header Banner */}
      <section className="relative py-20 md:py-24 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.25),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md text-blue-400 text-sm font-bold mb-6"
          >
            <Sparkles size={16} />
            <span>스마트 자기주도 체육 생활</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-6 tracking-tight"
          >
            자기주도 학습 <span className="text-blue-400">APPS</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm md:text-lg text-slate-300 mx-auto leading-relaxed font-medium max-w-2xl"
          >
            언제 어디서나 스스로 운동하고 건강한 체력을 관리할 수 있도록 엄선된 스마트 체육 앱들을 만나보세요.
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search & Filter Controls */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200/80 mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={clsx(
                  "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all",
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="앱 이름, 카테고리 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-sm font-bold text-slate-400">앱 목록을 불러오는 중입니다...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 p-8">
            <Smartphone className="mx-auto text-slate-300 mb-3" size={48} />
            <p className="text-slate-500 font-bold text-lg mb-1">검색 결과와 일치하는 앱이 없습니다.</p>
            <p className="text-slate-400 text-sm">다른 검색어나 카테고리를 선택해 보세요.</p>
          </div>
        ) : (
          <div className="space-y-14">
            {/* Recommended Apps Section */}
            {recommendedList.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
                      <Star size={22} className="fill-amber-500" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">선생님 강력 추천 앱</h2>
                      <p className="text-xs sm:text-sm text-slate-500">AI 피드백과 체계적인 트레이닝 프로그램을 갖춘 대표 앱</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 font-bold text-xs rounded-full border border-amber-200">
                    {recommendedList.length}개
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendedList.map((app, idx) => {
                    const appIdKey = app.id || normalizeAppName(app.name);
                    const isLiked = !!likedApps[appIdKey];

                    return (
                      <motion.div
                        key={app.id || app.name}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all flex flex-col justify-between group relative overflow-hidden"
                      >
                        <div>
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                              {getIcon(app.iconName)}
                            </div>
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[11px] font-bold rounded-lg uppercase tracking-tight border border-blue-100">
                              {app.category}
                            </span>
                          </div>

                          <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                            {app.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 mb-6">
                            {app.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                          <a
                            href={app.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors bg-slate-50 group-hover:bg-blue-50 px-3.5 py-2 rounded-xl"
                          >
                            <span>바로가기</span>
                            <ExternalLink size={14} className="ml-1.5" />
                          </a>

                          <button
                            onClick={() => handleLike(app)}
                            className={clsx(
                              "flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all",
                              isLiked 
                                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-105" 
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                            )}
                            title="추천하기"
                          >
                            <ThumbsUp size={14} className={isLiked ? 'fill-current' : ''} />
                            <span>{app.likesCount || 0}</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Other PE Apps Section */}
            {generalList.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 shadow-sm">
                      <Grid size={22} />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">다양한 맞춤 체육 & 건강 관리 앱</h2>
                      <p className="text-xs sm:text-sm text-slate-500">종목별 특화 훈련과 청소년 맞춤 스트레칭·체력 관리 앱</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-full">
                    {generalList.length}개
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {generalList.map((app, idx) => {
                    const appIdKey = app.id || normalizeAppName(app.name);
                    const isLiked = !!likedApps[appIdKey];

                    return (
                      <motion.div
                        key={app.id || app.name}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 ${app.color} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                              {getIcon(app.iconName)}
                            </div>
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg uppercase tracking-tight">
                              {app.category}
                            </span>
                          </div>

                          <h3 className="text-base font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                            {app.name}
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-6">
                            {app.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                          <a
                            href={app.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors"
                          >
                            <span>바로가기</span>
                            <ExternalLink size={13} className="ml-1" />
                          </a>

                          <button
                            onClick={() => handleLike(app)}
                            className={clsx(
                              "flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                              isLiked 
                                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            )}
                          >
                            <ThumbsUp size={13} className={isLiked ? 'fill-current' : ''} />
                            <span>{app.likesCount || 0}</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Tip Section */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-xl"
        >
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <CheckCircle2 size={24} className="text-amber-300" />
              </div>
              <h2 className="text-xl md:text-2xl font-black">체육 선생님이 전하는 앱 활용 팁 💡</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                <div className="text-2xl mb-2">⏱️</div>
                <h4 className="font-bold text-base mb-1">하루 15분의 기적</h4>
                <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                  짧은 시간이라도 꾸준히 운동하면 심폐 지구력과 집중력이 크게 향상됩니다.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                <div className="text-2xl mb-2">🤝</div>
                <h4 className="font-bold text-base mb-1">친구와 챌린지</h4>
                <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                  홈코트와 런데이로 친구들과 기록을 공유하며 선의의 경쟁을 즐겨보세요.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                <div className="text-2xl mb-2">🛡️</div>
                <h4 className="font-bold text-base mb-1">스트레칭 & 안전 우선</h4>
                <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                  운동 전후 충분한 스트레칭을 실시하고, 주변 안전 공간을 확보하세요.
                </p>
              </div>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </motion.div>
      </div>
    </div>
  );
}
