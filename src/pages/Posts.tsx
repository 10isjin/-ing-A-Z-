import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Post, SiteSettings } from '../types';
import PostCard from '../components/PostCard';
import { Search, Shield, Target, Zap, Award, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: '갈매중 체육ing Aㅏ침부터 Zㅓ녁까지',
    primaryColor: '#16a34a',
    secondaryColor: '#ec4899',
    heroTitle: '갈매중학교 체육건강부',
    heroSubtitle: '학생들의 건강한 미래를 설계하는 갈매중학교 체육 교육의 핵심 가치를 소개합니다.',
    footerText: '',
    aboutImage1: 'https://storage.googleapis.com/multimodal_ai_studio/as_storage/b3ihjs7i4dlulpnvu3n4kz/67d8d263-8822-4a02-8646-068d37452d3c.png',
    aboutImage2: 'https://picsum.photos/seed/students-running/400/300',
    aboutImage3: 'https://picsum.photos/seed/students-soccer/400/300',
    aboutImage4: 'https://picsum.photos/seed/students-gymnastics/400/500',
    stat1Label: '',
    stat1Value: '',
    stat2Label: '',
    stat2Value: '',
    stat3Label: '',
    stat3Value: '',
    stat4Label: '',
    stat4Value: ''
  });

  useEffect(() => {
    let q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Post))
        .filter(post => !post.type || post.type === 'gallery'); // Support old posts as gallery
      
      setPosts(fetchedPosts);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts in Posts page:", error);
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSiteSettings(docSnap.data() as SiteSettings);
      }
    }, (error) => {
      console.error("Error fetching settings in Posts page:", error);
    });

    return () => {
      unsubscribePosts();
      unsubscribeSettings();
    };
  }, []);

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const values = [
    { icon: <Target className="text-pink-600" size={18} />, title: '목표', desc: '즐겁게 참여하는 체육 문화 조성' },
    { icon: <Zap className="text-pink-500" size={18} />, title: '열정', desc: '멈추지 않는 에너지 지원' },
    { icon: <Shield className="text-pink-600" size={18} />, title: '안전', desc: '철저한 안전 관리 보장' },
    { icon: <Award className="text-pink-500" size={18} />, title: '성장', desc: '협동심과 바른 인성 함양' },
  ];

  return (
    <div className="pb-24">
      {/* About Section Merged */}
      <section className="relative py-24 overflow-hidden bg-pink-50">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(244,114,182,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ec489908_1px,transparent_1px),linear-gradient(to_bottom,#ec489908_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight"
          >
            체육 활동 <span className="text-pink-500">GALLERY</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[10px] sm:text-sm md:text-lg text-gray-600 mx-auto leading-relaxed font-medium max-w-2xl whitespace-nowrap sm:whitespace-normal"
          >
            갈매중학교 학생들의 생생한 체육 활동 현장을 사진으로 만나보세요.
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Compact About Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-16 bg-gray-50/50 p-8 rounded-[32px] border border-gray-100">
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-4 leading-tight">
              생생한 활동의 순간을<br />
              <span className="text-pink-600">한눈에 확인하세요</span>
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                갈매중학교 학생들이 참여하는 다양한 체육 활동의 생생한 현장을 사진과 영상으로 기록합니다. 
                땀 흘리는 열정과 즐거운 웃음이 가득한 갈매중 체육 활동의 모든 순간을 공유합니다.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  '생생한 현장 사진',
                  '활동 하이라이트',
                  '학생 참여 기록',
                  '체육 활동 아카이브'
                ].map((item, i) => (
                  <li key={i} className="flex items-center space-x-2 text-xs text-gray-700 font-medium">
                    <CheckCircle2 className="text-pink-500" size={14} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {values.map((value, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center mb-2">
                  {value.icon}
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{value.title}</h3>
                <p className="text-gray-500 text-[10px] leading-tight">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-16">
          {/* Search */}
          <div className="flex justify-center mb-12">
            <div className="relative w-full max-w-xl">
              <div className="flex items-center space-x-2 mb-3">
                <Search size={16} className="text-pink-600" />
                <span className="text-sm font-black text-gray-900 uppercase tracking-wider">GALLERY 검색</span>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="GALLERY에서 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all text-base shadow-sm"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {filteredPosts.map(post => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="py-32 text-center bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Search size={32} className="text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">검색 결과가 없습니다</h3>
                  <p className="text-gray-400">다른 검색어를 입력해 보세요.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
