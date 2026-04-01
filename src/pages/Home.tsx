import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Post, SiteSettings, Highlight, Survey } from '../types';
import { isGoogleDoc, getDirectImageUrl } from '../imageUtils';
import PostCard from '../components/PostCard';
import { ArrowRight, Trophy, Users, Heart, Sparkles, Image as ImageIcon, Smartphone, FileText, Table, Presentation, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Home() {
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [postGalleryHighlights, setPostGalleryHighlights] = useState<Highlight[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: '갈매중은 지금 체육ing Aㅏ침부터 Zㅓ녁까지',
    primaryColor: '#16a34a',
    secondaryColor: '#ec4899',
    heroTitle: '갈매중은 지금 체육ing\nAㅏ침부터 Zㅓ녁까지',
    heroSubtitle: '갈매중 체육의 A to Z! 학생들의 건강한 꿈과 열정이 가득한 현장을 만나보세요.',
    footerText: '갈매중학교 학생들의 건강한 성장을 위해 아침부터 저녁까지 다양한 체육 활동을 지원하고 소통하는 공간입니다.',
    aboutImage1: '',
    aboutImage2: '',
    aboutImage3: '',
    aboutImage4: '',
    stat1Label: '활동 종목',
    stat1Value: '-',
    stat2Label: '참여 학생',
    stat2Value: '-',
    stat3Label: '만족도',
    stat3Value: '-',
    stat4Label: '연간 행사',
    stat4Value: '-'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      
      // Filter latest news for the news section
      const allNews = posts.filter(post => post.type === 'news' || post.type === 'notice');
      const highlightedNews = allNews.filter(p => p.isHighlight);
      const regularNews = allNews.filter(p => !p.isHighlight);
      const sortedNews = [...highlightedNews, ...regularNews].slice(0, 6);
      setLatestPosts(sortedNews);

      // Get all gallery posts with images
      const postHighlights = posts.filter(post => post.imageUrl && post.type === 'gallery');
      
      // Separate post highlights
      const galleryPostHighlights = postHighlights.map(p => ({
        id: p.id,
        title: p.title,
        imageUrl: p.imageUrl || '',
        type: p.type as any,
        createdAt: p.createdAt,
        isHighlight: p.isHighlight || false,
        link: `/post/${p.id}`
      }));

      setPostGalleryHighlights(galleryPostHighlights);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts in Home:", error);
    });

    const hq = query(collection(db, 'highlights'), orderBy('createdAt', 'desc'));
    const unsubscribeHighlights = onSnapshot(hq, (snapshot) => {
      const h = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Highlight));
      // Include only gallery highlights that have an image
      const galleryH = h.filter(item => item.imageUrl && (!item.type || item.type === 'gallery'))
                        .map(item => ({ ...item, isHighlight: true }));
      
      setHighlights(galleryH);
    }, (error) => {
      console.error("Error fetching highlights in Home:", error);
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSiteSettings(docSnap.data() as SiteSettings);
      }
    }, (error) => {
      console.error("Error fetching settings in Home:", error);
    });

    const sq = query(collection(db, 'surveys'), orderBy('createdAt', 'desc'));
    const unsubscribeSurveys = onSnapshot(sq, (snapshot) => {
      const s = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Survey))
        .filter(survey => survey.isActive);
      setSurveys(s);
    }, (error) => {
      console.error("Error fetching surveys in Home:", error);
    });

    return () => {
      unsubscribePosts();
      unsubscribeHighlights();
      unsubscribeSettings();
      unsubscribeSurveys();
    };
  }, []);

  // Combine manual highlights and post-based highlights
  const finalGalleryHighlights = React.useMemo(() => {
    const combined = [...highlights, ...postGalleryHighlights];
    // Filter duplicates by imageUrl
    const unique = combined.filter((v, i, a) => a.findIndex(t => t.imageUrl === v.imageUrl) === i);
    
    return unique.sort((a, b) => {
      // Prioritize manually marked highlights (isHighlight: true)
      const aIsHigh = (a as any).isHighlight;
      const bIsHigh = (b as any).isHighlight;
      
      if (aIsHigh && !bIsHigh) return -1;
      if (!aIsHigh && bIsHigh) return 1;

      const getTime = (date: any) => {
        if (!date) return 0;
        if (typeof date.toMillis === 'function') return date.toMillis();
        if (date instanceof Date) return date.getTime();
        if (typeof date === 'number') return date;
        if (typeof date === 'string') return new Date(date).getTime();
        if (date.seconds) return date.seconds * 1000;
        return 0;
      };
      
      return getTime(b.createdAt) - getTime(a.createdAt);
    }).slice(0, 4);
  }, [highlights, postGalleryHighlights]);

  const displayHighlights = React.useMemo(() => {
    const defaultImages = [
      { id: 'def1', title: '농구', imageUrl: 'https://storage.googleapis.com/multimodal_ai_studio/as_storage/b3ihjs7i4dlulpnvu3n4kz/67d8d263-8822-4a02-8646-068d37452d3c.png', isDefault: true },
      { id: 'def2', title: '운동', imageUrl: 'https://picsum.photos/seed/sports-1/400/600', isDefault: true },
      { id: 'def3', title: '운동', imageUrl: 'https://picsum.photos/seed/sports-2/400/600', isDefault: true },
      { id: 'def4', title: '운동', imageUrl: 'https://picsum.photos/seed/sports-3/400/600', isDefault: true },
    ];
    
    const result = [...finalGalleryHighlights] as any[];
    while (result.length < 4) {
      result.push(defaultImages[result.length]);
    }
    return result;
  }, [finalGalleryHighlights]);

  const stats = [
    { icon: <Trophy className="text-yellow-500" />, label: siteSettings.stat1Label, value: siteSettings.stat1Value },
    { icon: <Users className="text-blue-500" />, label: siteSettings.stat2Label, value: siteSettings.stat2Value },
    { icon: <Heart className="text-pink-500" />, label: siteSettings.stat3Label, value: siteSettings.stat3Value },
    { icon: <Sparkles className="text-green-500" />, label: siteSettings.stat4Label, value: siteSettings.stat4Value },
  ];

  return (
    <div className="space-y-12 sm:space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center overflow-hidden bg-slate-950">
        {/* Dynamic Background Pattern */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(22,163,74,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          
          {/* Animated Blobs */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-green-500/20 rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              x: [0, -50, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-500/10 rounded-full blur-[120px]" 
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center space-x-3 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-green-400 text-xs sm:text-sm font-bold mb-8">
              <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-green-500"></span>
              </span>
              <span className="tracking-wider uppercase">Live: 2026학년도 갈매중 체육 활동 진행중</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-7xl font-black text-white leading-[1.2] mb-8 tracking-tighter">
              {(siteSettings.heroTitle.includes('\n') 
                ? siteSettings.heroTitle 
                : siteSettings.heroTitle.replace('Aㅏ침부터 Zㅓ녁까지', '\nAㅏ침부터 Zㅓ녁까지')
              ).split('\n').map((line, i) => (
                <div key={i} className="block">
                  {line.split('').map((char, j) => (
                    <span key={j} className={char === 'A' || char === 'Z' ? 'text-pink-400 font-black' : ''}>
                      {char}
                    </span>
                  ))}
                </div>
              ))}
            </h1>
            <p className="text-sm sm:text-base text-gray-400 mb-12 leading-relaxed max-w-2xl font-medium">
              {siteSettings.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
              <Link 
                to="/news" 
                className="inline-flex items-center justify-center px-10 py-5 rounded-2xl bg-green-600 text-white font-bold hover:bg-green-500 transition-all shadow-2xl shadow-green-600/40 group relative overflow-hidden"
              >
                <span className="relative z-10">NEWS</span>
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </Link>
              <Link 
                to="/posts" 
                className="inline-flex items-center justify-center px-10 py-5 rounded-2xl bg-pink-100 border border-pink-200 text-pink-700 font-bold hover:bg-pink-200 transition-all shadow-lg shadow-pink-500/10 group"
              >
                <span>GALLERY</span>
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/apps" 
                className="inline-flex items-center justify-center px-10 py-5 rounded-2xl bg-blue-100 border border-blue-200 text-blue-700 font-bold hover:bg-blue-200 transition-all shadow-lg shadow-blue-500/10 group"
              >
                <span>Apps</span>
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-4 gap-2 sm:gap-8">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-3 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 text-center hover:border-green-200 transition-colors shadow-sm sm:shadow-none"
            >
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-50 rounded-lg sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-4">
                <div className="scale-75 sm:scale-100">
                  {stat.icon}
                </div>
              </div>
              <div className="text-lg sm:text-3xl font-black text-gray-900 mb-0.5 sm:mb-1">{stat.value}</div>
              <div className="text-[10px] sm:text-sm text-gray-400 font-medium leading-tight">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Latest Posts Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">최신 NEWS</h2>
            <p className="text-[10px] sm:text-sm text-gray-500 whitespace-nowrap sm:whitespace-normal">갈매중학교의 생생한 체육 현장을 확인하세요.</p>
          </div>
          <Link to="/news" className="flex items-center space-x-2 text-green-600 font-bold hover:underline">
            <span className="text-sm sm:text-base">전체</span>
            <ArrowRight size={18} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {latestPosts.length > 0 ? (
              latestPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-400">아직 등록된 활동 소식이 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Activity Highlights Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">활동 하이라이트</h2>
          <p className="text-[10px] sm:text-sm text-gray-500 whitespace-nowrap sm:whitespace-normal">에너지 넘치는 갈매중 학생들의 모습입니다.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayHighlights.map((h, idx) => (
            <motion.div 
              key={h.id}
              whileHover={{ scale: 1.02 }}
              className={`relative group ${idx % 2 === 1 ? 'md:mt-8' : ''}`}
            >
              {isGoogleDoc(h.imageUrl) ? (
                <div className="w-full h-64 bg-gray-50 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center justify-center p-6 space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
                    {h.imageUrl.includes('spreadsheets') ? (
                      <Table className="text-green-600" size={32} />
                    ) : h.imageUrl.includes('presentation') ? (
                      <Presentation className="text-orange-500" size={32} />
                    ) : (
                      <FileText className="text-blue-500" size={32} />
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 opacity-60">
                    {h.imageUrl.includes('spreadsheets') ? 'Google Sheets' : 
                     h.imageUrl.includes('presentation') ? 'Google Slides' : 'Google Docs'}
                  </span>
                </div>
              ) : (
                <img 
                  src={getDirectImageUrl(h.imageUrl)} 
                  alt={h.title} 
                  className="w-full h-64 object-cover rounded-3xl shadow-lg"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-end p-6">
                <p className="text-white font-bold text-sm">{h.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Surveys Section */}
      {surveys.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">설문조사 참여</h2>
            <p className="text-[10px] sm:text-sm text-gray-500 whitespace-nowrap sm:whitespace-normal">갈매중학교 체육 활동 발전을 위해 여러분의 의견을 들려주세요.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {surveys.map(survey => (
              <motion.a
                key={survey.id}
                href={survey.formUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -5 }}
                className="group bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all flex items-start space-x-6"
              >
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex-shrink-0">
                  <ClipboardList size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{survey.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">{survey.description}</p>
                  <div className="flex items-center text-indigo-600 font-bold text-sm">
                    <span>설문 참여하기</span>
                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </section>
      )}

      {/* Apps Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden group"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl text-center md:text-left">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-blue-100 text-xs font-bold mb-6">
                <Sparkles size={16} />
                <span>자기주도 체육 학습</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                스마트하게 운동하자!<br />
                <span className="text-blue-200">추천 Apps</span>
              </h2>
              <p className="text-lg text-blue-100 mb-10 leading-relaxed">
                학생들이 스스로 운동하고 건강을 관리할 수 있도록 도와주는 유용한 앱들을 소개합니다. 지금 바로 확인해보세요!
              </p>
              <Link 
                to="/apps" 
                className="inline-flex items-center justify-center px-10 py-5 rounded-2xl bg-white text-blue-700 font-bold hover:bg-blue-50 transition-all shadow-xl group/btn"
              >
                <span>Apps</span>
                <ArrowRight size={20} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="relative w-full max-w-sm">
              <div className="aspect-[4/5] bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 p-8 shadow-2xl transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full bg-blue-500/20 rounded-2xl flex items-center justify-center">
                  <Smartphone size={120} className="text-white/40" />
                </div>
              </div>
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-pink-500/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-green-500/20 rounded-full blur-2xl" />
            </div>
          </div>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </motion.div>
      </section>

    </div>
  );
}
