import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Post, SiteSettings } from '../types';
import PostCard from '../components/PostCard';
import { Search, Filter, SlidersHorizontal, Newspaper, CheckCircle2, Shield, Target, Zap, Award } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';

const categories = [
  { id: 'all', name: '전체' },
  { id: 'class', name: '교과수업' },
  { id: 'lunch', name: '런치리그' },
  { id: 'sports_club', name: '교육장배학교스포츠' },
  { id: 'festival', name: '체육대회' },
  { id: 'project', name: '프로젝트' },
  { id: 'health_fitness', name: '건강체력교실' },
  { id: 'oasis', name: '오아시스' },
  { id: 'paps', name: 'PAPS' },
  { id: 'character', name: '인성' },
];

export default function News() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Post))
        .filter(post => post.type === 'news');
      
      const categoryFiltered = activeCategory === 'all' 
        ? fetchedPosts 
        : fetchedPosts.filter(post => post.category === activeCategory);
        
      setPosts(categoryFiltered);
      setLoading(false);
    });

    return () => unsubscribePosts();
  }, [activeCategory]);

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const values = [
    { icon: <Target className="text-green-600" size={18} />, title: '목표', desc: '즐겁게 참여하는 체육 문화 조성' },
    { icon: <Zap className="text-yellow-500" size={18} />, title: '열정', desc: '멈추지 않는 에너지 지원' },
    { icon: <Shield className="text-blue-500" size={18} />, title: '안전', desc: '철저한 안전 관리 보장' },
    { icon: <Award className="text-pink-500" size={18} />, title: '성장', desc: '협동심과 바른 인성 함양' },
  ];

  return (
    <div className="pb-24">
      <section className="relative py-24 overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(22,163,74,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight"
          >
            체육 활동 <span className="text-green-500">NEWS</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[10px] sm:text-sm md:text-lg text-gray-400 mx-auto leading-relaxed font-medium max-w-2xl whitespace-nowrap sm:whitespace-normal"
          >
            갈매중학교 체육관련 최신 뉴스(NEWS)와 공지사항을 전해드립니다.
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Compact About Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-16 bg-gray-50/50 p-8 rounded-[32px] border border-gray-100">
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-4 leading-tight">
              아침을 깨우는 운동부터<br />
              <span className="text-green-600">꿈을 키우는 동아리까지</span>
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                갈매중학교 체육건강부는 정규 수업 외에도 아침 체육 활동, 점심 리그전, 방과 후 스포츠 클럽 등 
                학생들이 언제 어디서나 운동을 즐길 수 있는 환경을 제공합니다.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  '자기주도적 아침 운동',
                  '학년별 점심 리그',
                  '방과 후 스포츠 클럽',
                  '스포츠 축제'
                ].map((item, i) => (
                  <li key={i} className="flex items-center space-x-2 text-xs text-gray-700 font-medium">
                    <CheckCircle2 className="text-green-500" size={14} />
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

        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
          <div className="relative w-full md:w-auto">
            <div className="flex items-center space-x-2 mb-3">
              <Filter size={16} className="text-green-600" />
              <span className="text-sm font-black text-gray-900 uppercase tracking-wider">카테고리 선택</span>
            </div>
            <div className="flex items-center space-x-3 overflow-x-auto pb-6 w-full md:w-auto no-scrollbar snap-x snap-mandatory scroll-smooth">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={clsx(
                    "px-6 py-3 rounded-2xl text-sm font-black whitespace-nowrap transition-all border snap-start",
                    activeCategory === cat.id 
                      ? "bg-green-600 text-white border-green-600 shadow-2xl shadow-green-600/40 scale-110 z-10" 
                      : "bg-white text-gray-700 border-gray-200 hover:border-green-500 hover:text-green-600 shadow-md"
                  )}
                >
                  {cat.name}
                </button>
              ))}
              {/* Extra space at the end for better scrolling feel */}
              <div className="min-w-[40px] h-1 md:hidden" />
            </div>
            {/* Mobile-only fade indicator */}
            <div className="absolute right-0 top-10 bottom-6 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
          </div>

          <div className="relative w-full md:w-80">
            <div className="flex items-center space-x-2 mb-3">
              <Search size={16} className="text-green-600" />
              <span className="text-sm font-black text-gray-900 uppercase tracking-wider">검색</span>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="검색어를 입력하세요..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm shadow-sm"
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
                  <Newspaper size={32} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">등록된 소식이 없습니다</h3>
                <p className="text-gray-400">다른 카테고리를 선택해 보세요.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
