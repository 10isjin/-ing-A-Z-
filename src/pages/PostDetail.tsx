import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Post } from '../types';
import { getDirectImageUrl, getYoutubeId } from '../imageUtils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, User, ArrowLeft, Share2, Tag, X, Maximize2, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [imageError, setImageError] = useState(false);
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content.substring(0, 100),
          url: window.location.href,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('링크가 클립보드에 복사되었습니다.');
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

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
          <button 
            onClick={handleShare}
            className="ml-auto flex items-center space-x-2 text-gray-400 hover:text-green-600 transition-colors"
          >
            <Share2 size={18} />
            <span className="text-xs font-bold">공유하기</span>
          </button>
        </div>
      </header>

      <div className="relative group aspect-video rounded-[40px] overflow-hidden mb-12 shadow-2xl shadow-green-500/10">
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
          <>
            {!imageError ? (
              <img 
                src={getDirectImageUrl(post.imageUrl) || `https://picsum.photos/seed/${post.id}/1200/675`} 
                alt={post.title}
                className="w-full h-full object-cover cursor-zoom-in"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                onClick={() => {
                  setModalImageUrl(getDirectImageUrl(post.imageUrl) || `https://picsum.photos/seed/${post.id}/1200/675`);
                  setIsImageModalOpen(true);
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-8 text-center">
                <FileText size={64} className="mb-4 opacity-20" />
                <p className="text-lg font-medium mb-4">이미지를 불러올 수 없거나 문서 파일입니다.</p>
                <a 
                  href={post.imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Maximize2 size={18} />
                  전체 파일 보기
                </a>
              </div>
            )}
            {!imageError && (
              <button 
                onClick={() => {
                  setModalImageUrl(getDirectImageUrl(post.imageUrl) || `https://picsum.photos/seed/${post.id}/1200/675`);
                  setIsImageModalOpen(true);
                }}
                className="absolute bottom-6 right-6 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center text-gray-900 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              >
                <Maximize2 size={20} />
              </button>
            )}
          </>
        )}
      </div>

      <div className="prose prose-lg prose-green max-w-none">
        <div className="markdown-body">
          <ReactMarkdown
            components={{
              img: ({ node, ...props }) => (
                <img
                  {...props}
                  className="rounded-2xl cursor-zoom-in hover:opacity-90 transition-opacity"
                  onClick={() => {
                    setModalImageUrl(props.src || '');
                    setIsImageModalOpen(true);
                  }}
                />
              ),
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline font-bold"
                />
              )
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
          onClick={() => setIsImageModalOpen(false)}
        >
          <img 
            src={modalImageUrl} 
            alt={post.title}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            referrerPolicy="no-referrer"
          />
          <button 
            className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
            onClick={(e) => {
              e.stopPropagation();
              setIsImageModalOpen(false);
            }}
          >
            <X size={32} />
          </button>
        </div>
      )}
      
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
