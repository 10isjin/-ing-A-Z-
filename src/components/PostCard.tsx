import React from 'react';
import { Post } from '../types';
import { getDirectImageUrl } from '../imageUtils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, User, ArrowRight, ThumbsUp, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PostCardProps {
  post: Post;
}

const categoryLabels = {
  class: '교과수업',
  lunch: '런치리그',
  sports_club: '교육장배학교스포츠',
  festival: '체육대회',
  project: '프로젝트',
  health_fitness: '건강체력교실',
  oasis: '오아시스',
  paps: 'PAPS',
  character: '인성'
};

const categoryColors = {
  class: 'bg-blue-50 text-blue-600 border-blue-100',
  lunch: 'bg-orange-50 text-orange-600 border-orange-100',
  sports_club: 'bg-green-50 text-green-600 border-green-100',
  festival: 'bg-pink-50 text-pink-600 border-pink-100',
  project: 'bg-purple-50 text-purple-600 border-purple-100',
  health_fitness: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  oasis: 'bg-cyan-50 text-cyan-600 border-cyan-100',
  paps: 'bg-red-50 text-red-600 border-red-100',
  character: 'bg-yellow-50 text-yellow-600 border-yellow-100'
};

export default function PostCard({ post }: PostCardProps) {
  const navigate = useNavigate();
  const formattedDate = post.createdAt?.toDate() 
    ? format(post.createdAt.toDate(), 'yyyy년 MM월 dd일', { locale: ko })
    : '날짜 정보 없음';

  const isGallery = post.type === 'gallery';
  
  const themeClasses = isGallery 
    ? {
        hoverShadow: 'hover:shadow-pink-500/5',
        titleHover: 'group-hover:text-pink-600',
        textAccent: 'text-pink-600'
      }
    : {
        hoverShadow: 'hover:shadow-green-500/5',
        titleHover: 'group-hover:text-green-600',
        textAccent: 'text-green-600'
      };

  return (
    <div 
      onClick={() => navigate(`/posts/${post.id}`)}
      className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl ${themeClasses.hoverShadow} transition-all duration-300 flex flex-col h-full cursor-pointer`}
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={getDirectImageUrl(post.imageUrl) || `https://picsum.photos/seed/${post.id}/800/450`}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center space-x-4 text-xs text-gray-400 mb-3">
          <div className="flex items-center space-x-1">
            <Calendar size={14} />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center space-x-1">
            <User size={14} />
            <span>{post.authorName || '선생님'}</span>
          </div>
        </div>
        
        <h3 className={`text-xl font-bold text-gray-900 mb-3 ${themeClasses.titleHover} transition-colors line-clamp-2`}>
          {post.title}
        </h3>
        
        <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed">
          {post.content.replace(/[#*`]/g, '')}
        </p>
        
        <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <Eye size={14} />
              <span>{post.viewCount || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <ThumbsUp size={14} />
              <span>{post.likesCount || 0}</span>
            </div>
          </div>
          <div className={`text-sm font-bold ${themeClasses.textAccent} flex items-center space-x-1 group-hover:translate-x-1 transition-transform`}>
            <span>자세히 보기</span>
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
