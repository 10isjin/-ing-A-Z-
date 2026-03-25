import React, { useState, useEffect } from 'react';
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
  ThumbsUp
} from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, writeBatch, setDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { AppEntry } from '../types';
import { clsx } from 'clsx';

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
    case 'Mic': return <Mic {...props} />;
    case 'Headphones': return <Headphones {...props} />;
    case 'Cpu': return <Cpu {...props} />;
    case 'Cloud': return <Cloud {...props} />;
    case 'Wifi': return <Wifi {...props} />;
    case 'Sun': return <Sun {...props} />;
    case 'Moon': return <Moon {...props} />;
    case 'Flame': return <Flame {...props} />;
    case 'Leaf': return <Leaf {...props} />;
    case 'Coffee': return <Coffee {...props} />;
    case 'Utensils': return <Utensils {...props} />;
    case 'Briefcase': return <Briefcase {...props} />;
    case 'FileText': return <FileText {...props} />;
    case 'Mail': return <Mail {...props} />;
    case 'Send': return <Send {...props} />;
    case 'Share2': return <Share2 {...props} />;
    case 'Download': return <Download {...props} />;
    case 'Upload': return <Upload {...props} />;
    case 'Lock': return <Lock {...props} />;
    case 'Shield': return <Shield {...props} />;
    case 'Flag': return <Flag {...props} />;
    case 'MapPin': return <MapPin {...props} />;
    case 'Navigation': return <Navigation {...props} />;
    case 'Compass': return <Compass {...props} />;
    case 'Clock': return <Clock {...props} />;
    case 'Hash': return <Hash {...props} />;
    case 'Paperclip': return <Paperclip {...props} />;
    case 'Edit3': return <Edit3 {...props} />;
    case 'Trash2': return <Trash2 {...props} />;
    default: return <Smartphone {...props} />;
  }
};

export default function Apps() {
  const [apps, setApps] = useState<AppEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedApps, setLikedApps] = useState<Record<string, boolean>>({});
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    const q = query(collection(db, 'apps'), orderBy('createdAt', 'desc'));
    const unsubscribeApps = onSnapshot(q, (snapshot) => {
      const fetchedApps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppEntry));
      setApps(fetchedApps);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching apps:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeApps();
    };
  }, []);

  useEffect(() => {
    if (user) {
      // Fetch user's app likes
      const q = query(collection(db, 'appLikes'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const likes: Record<string, boolean> = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.userId === user.uid) {
            likes[data.appId] = true;
          }
        });
        setLikedApps(likes);
      });
      return () => unsubscribe();
    } else {
      // Load from localStorage for unauthenticated users
      const saved = localStorage.getItem('app_likes');
      if (saved) {
        setLikedApps(JSON.parse(saved));
      }
    }
  }, [user]);

  const handleLike = async (appId: string) => {
    const isLiked = likedApps[appId];
    const appRef = doc(db, 'apps', appId);

    if (user) {
      const likeId = `${user.uid}_${appId}`;
      const likeRef = doc(db, 'appLikes', likeId);
      const batch = writeBatch(db);

      try {
        if (isLiked) {
          batch.delete(likeRef);
          batch.update(appRef, {
            likesCount: increment(-1)
          });
        } else {
          batch.set(likeRef, {
            appId,
            userId: user.uid,
            createdAt: new Date()
          });
          batch.update(appRef, {
            likesCount: increment(1)
          });
        }
        await batch.commit();
      } catch (error) {
        console.error("Error toggling app like (auth):", error);
      }
    } else {
      try {
        const localLikes = JSON.parse(localStorage.getItem('app_likes') || '{}');
        if (isLiked) {
          await updateDoc(appRef, {
            likesCount: increment(-1)
          });
          delete localLikes[appId];
        } else {
          await updateDoc(appRef, {
            likesCount: increment(1)
          });
          localLikes[appId] = true;
        }
        localStorage.setItem('app_likes', JSON.stringify(localLikes));
        setLikedApps({ ...localLikes });
      } catch (error) {
        console.error("Error toggling app like (unauth):", error);
      }
    }
  };

  return (
    <div className="pb-24">
      <section className="relative py-24 overflow-hidden bg-blue-950">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.2),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md text-blue-400 text-sm font-bold mb-6"
          >
            <Smartphone size={18} />
            <span>스마트 체육 생활</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight"
          >
            자기주도 학습 <span className="text-blue-400">APPS</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[10px] sm:text-sm md:text-lg text-gray-300 mx-auto leading-relaxed font-medium max-w-2xl whitespace-nowrap sm:whitespace-normal"
          >
            언제 어디서나 스스로 운동하고 건강을 관리할 수 있도록 도와주는 유용한 앱들을 소개합니다.
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Apps Grid */}

        {/* Apps Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={48} />
          </div>
        ) : (
          <div className="space-y-16">
            {apps.some(app => app.isRecommended) ? (
              <section>
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <Star size={24} fill="currentColor" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">추천 앱</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {apps.filter(app => app.isRecommended).map((app, idx) => (
                    <motion.div
                      key={app.id || app.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white rounded-3xl p-8 border-2 border-blue-100 shadow-lg shadow-blue-100/20 hover:shadow-xl hover:border-blue-200 transition-all group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-100 transition-colors" />
                      <div className="flex items-start space-x-6 relative z-10">
                        <div className={`w-16 h-16 ${app.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          {getIcon(app.iconName)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{app.category}</span>
                            <a
                              href={app.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <ExternalLink size={20} />
                            </a>
                          </div>
                          <h3 className="text-xl font-black text-gray-900 mb-3">{app.name}</h3>
                          <p className="text-gray-500 leading-relaxed mb-6">
                            {app.description}
                          </p>
                          <div className="flex items-center justify-between mt-6">
                            <a
                              href={app.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors"
                            >
                              자세히 보기 <ExternalLink size={14} className="ml-1" />
                            </a>
                            <button
                              onClick={() => app.id && handleLike(app.id)}
                              className={clsx(
                                "flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                                likedApps[app.id || ''] 
                                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-105" 
                                  : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:scale-105"
                              )}
                            >
                              <ThumbsUp size={14} className={likedApps[app.id || ''] ? 'fill-current' : ''} />
                              <span>{app.likesCount || 0}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-400">추천된 앱이 없습니다. 관리자 페이지에서 앱을 추가해 주세요.</p>
              </div>
            )}

            {apps.some(app => !app.isRecommended) && (
              <section>
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
                    <Grid size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">기타 유용한 앱</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {apps.filter(app => !app.isRecommended).map((app, idx) => (
                    <motion.div
                      key={app.id || app.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 ${app.color} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                          {getIcon(app.iconName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{app.category}</span>
                            <a
                              href={app.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <ExternalLink size={16} />
                            </a>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{app.name}</h3>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                            {app.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <a
                              href={app.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              자세히 보기
                            </a>
                            <button
                              onClick={() => app.id && handleLike(app.id)}
                              className={clsx(
                                "flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                                likedApps[app.id || ''] 
                                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                              )}
                            >
                              <ThumbsUp size={12} className={likedApps[app.id || ''] ? 'fill-current' : ''} />
                              <span>{app.likesCount || 0}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}

        {/* Tip Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-10 md:p-16 text-white text-center relative overflow-hidden"
        >
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-black mb-6 whitespace-nowrap">선생님이 전하는 활용 팁! 💡</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                <div className="text-2xl mb-2">📅</div>
                <h4 className="font-bold mb-2">꾸준함이 생명!</h4>
                <p className="text-sm text-blue-100">하루 15분이라도 매일 정해진 시간에 앱을 활용해 보세요.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                <div className="text-2xl mb-2">🤝</div>
                <h4 className="font-bold mb-2">친구와 함께!</h4>
                <p className="text-sm text-blue-100">추천 앱들을 활용해 친구들과 기록을 공유하며 즐겁게 운동하세요.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                <div className="text-2xl mb-2">⚠️</div>
                <h4 className="font-bold mb-2">안전이 제일!</h4>
                <p className="text-sm text-blue-100">운동 전 충분한 스트레칭을 하고, 주변 환경을 꼭 확인하세요.</p>
              </div>
            </div>
          </div>
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </motion.div>
      </div>
    </div>
  );
}
