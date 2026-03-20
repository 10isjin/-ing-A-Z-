import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Post } from '../types';
import { getDirectImageUrl, getYoutubeId } from '../imageUtils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, User, ArrowLeft, Share2, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'posts', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() } as Post);
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 animate-pulse">
        <div className="h-8 bg-gray-100 w-3/4 mb-6 rounded-lg" />
        <div className="h-4 bg-gray-100 w-1/4 mb-12 rounded-lg" />
        <div className="aspect-video bg-gray-100 rounded-3xl mb-12" />
        <div className="space-y-4">
          <div className="h-4 bg-gray-100 w-full rounded-lg" />
          <div className="h-4 bg-gray-100 w-full rounded-lg" />
          <div className="h-4 bg-gray-100 w-2/3 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">게시글을 찾을 수 없습니다.</h1>
        <button onClick={() => navigate('/posts')} className="text-green-600 font-bold">목록으로 돌아가기</button>
      </div>
    );
  }

  const formattedDate = post.createdAt?.toDate() 
    ? format(post.createdAt.toDate(), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })
    : '날짜 정보 없음';

  return (
    <article className="max-w-4xl mx-auto px-4 py-16 md:py-24">
      <button 
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-2 text-gray-400 hover:text-green-600 mb-8 transition-colors group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-bold">뒤로가기</span>
      </button>

      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 leading-tight">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 border-b border-gray-100 pb-8">
          <div className="flex items-center space-x-2">
            <Calendar size={18} className="text-green-500" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center space-x-2">
            <User size={18} className="text-green-500" />
            <span className="font-medium text-gray-600">{post.authorName || '선생님'}</span>
          </div>
          <button className="ml-auto flex items-center space-x-2 text-gray-400 hover:text-green-600 transition-colors">
            <Share2 size={18} />
            <span className="text-xs font-bold">공유하기</span>
          </button>
        </div>
      </header>

      <div className="aspect-video rounded-[40px] overflow-hidden mb-12 shadow-2xl shadow-green-500/10">
        {getYoutubeId(post.imageUrl) ? (
          <iframe
            src={`https://www.youtube.com/embed/${getYoutubeId(post.imageUrl)}`}
            title={post.title}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <img 
            src={getDirectImageUrl(post.imageUrl) || `https://picsum.photos/seed/${post.id}/1200/675`} 
            alt={post.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      <div className="prose prose-lg prose-green max-w-none">
        <div className="markdown-body">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </div>
      
      <div className="mt-24 pt-12 border-t border-gray-100 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <User size={24} className="text-gray-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">작성자</p>
            <p className="font-bold text-gray-900">{post.authorName || '갈매중학교 체육건강부'}</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/posts')}
          className="px-8 py-3 rounded-full border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
        >
          목록으로
        </button>
      </div>
    </article>
  );
}
