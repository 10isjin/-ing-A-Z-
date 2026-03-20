import React, { useState, useEffect } from 'react';
import { Instagram, Youtube, Facebook, MapPin, Phone, Mail, Lock } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, loginWithGoogle } from '../firebase';
import { SiteSettings } from '../types';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: '갈매중 체육ing Aㅏ침부터 Zㅓ녁까지',
    primaryColor: '#16a34a',
    secondaryColor: '#ec4899',
    heroTitle: '갈매중 체육ing\nAㅏ침부터 Zㅓ녁까지',
    heroSubtitle: '',
    footerText: '갈매중학교 학생들의 건강한 성장을 위해 아침부터 저녁까지 다양한 체육 활동을 지원하고 소통하는 공간입니다.',
    aboutImage1: '',
    aboutImage2: '',
    aboutImage3: '',
    aboutImage4: '',
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
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSiteSettings(docSnap.data() as SiteSettings);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <footer className="bg-gray-50 border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-6">
              <span className="font-bold text-xl text-gray-900">{siteSettings.siteName}</span>
            </div>
            <p className="text-gray-500 max-w-md leading-relaxed">
              {siteSettings.footerText}
            </p>
            <div className="flex space-x-4 mt-8">
              {siteSettings.instagramUrl && (
                <a href={siteSettings.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-pink-600 hover:border-pink-600 transition-all">
                  <Instagram size={20} />
                </a>
              )}
              {siteSettings.youtubeUrl && (
                <a href={siteSettings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-500 transition-all">
                  <Youtube size={20} />
                </a>
              )}
              {siteSettings.facebookUrl && (
                <a href={siteSettings.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-500 transition-all">
                  <Facebook size={20} />
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-6">바로가기</h3>
            <ul className="space-y-4">
              <li><Link to="/" className="text-gray-500 hover:text-green-600 text-sm transition-colors">홈</Link></li>
              <li><Link to="/news" className="text-gray-500 hover:text-green-600 text-sm transition-colors">NEWS</Link></li>
              <li><Link to="/posts" className="text-gray-500 hover:text-green-600 text-sm transition-colors">GALLERY</Link></li>
              <li><Link to="/apps" className="text-gray-500 hover:text-green-600 text-sm transition-colors">Apps</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-6">문의처</h3>
            <ul className="space-y-3">
              {siteSettings.schoolAddress && (
                <li className="flex items-center space-x-2 text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                  <MapPin size={12} className="text-green-500 shrink-0 sm:size-[14px]" />
                  <span>{siteSettings.schoolAddress}</span>
                </li>
              )}
              {siteSettings.schoolPhone && (
                <li className="flex items-center space-x-2 text-[10px] sm:text-xs text-gray-500">
                  <Phone size={12} className="text-green-500 shrink-0 sm:size-[14px]" />
                  <span>{siteSettings.schoolPhone}</span>
                </li>
              )}
              {siteSettings.schoolEmail && (
                <li className="flex items-center space-x-2 text-[10px] sm:text-xs text-gray-500">
                  <Mail size={12} className="text-green-500 shrink-0 sm:size-[14px]" />
                  <span>{siteSettings.schoolEmail}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400">
            © 2026 갈매중학교 체육건강부. All rights reserved.
          </p>
          <button 
            onClick={loginWithGoogle}
            className="flex items-center space-x-1 text-[10px] text-gray-300 hover:text-gray-500 transition-colors"
          >
            <Lock size={10} />
            <span>Admin Login</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
