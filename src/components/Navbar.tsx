import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth, loginWithGoogle, logout, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { Menu, X, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SiteSettings } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: '갈매중 체육ing Aㅏ침부터 Zㅓ녁까지',
    primaryColor: '#16a34a',
    secondaryColor: '#ec4899',
    heroTitle: '',
    heroSubtitle: '',
    footerText: '',
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => setUser(u));
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSiteSettings(docSnap.data() as SiteSettings);
      }
    }, (error) => {
      console.error("Error fetching settings in Navbar:", error);
    });
    return () => {
      unsubscribeAuth();
      unsubscribeSettings();
    };
  }, []);

  const isAdmin = user?.email === 'yelloboll@goedu.kr';

  const navLinks = [
    { name: '홈', path: '/' },
    { name: 'NEWS', path: '/news' },
    { name: 'GALLERY', path: '/posts' },
    { name: 'Apps', path: '/apps' },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="font-bold text-lg text-gray-900 hidden sm:block">
                {siteSettings.siteName}
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-green-600",
                  location.pathname === link.path ? "text-green-600" : "text-gray-600"
                )}
              >
                {link.name}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center space-x-1 text-sm font-medium text-pink-500 hover:text-pink-600"
              >
                <LayoutDashboard size={16} />
                <span>관리자</span>
              </Link>
            )}
            {user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-gray-200" />
                  <span className="font-medium">{user.displayName}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="로그아웃"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-gray-600 p-2"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 animate-in slide-in-from-top duration-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium",
                  location.pathname === link.path ? "bg-green-50 text-green-600" : "text-gray-600 hover:bg-gray-50"
                )}
              >
                {link.name}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-pink-500 hover:bg-pink-50"
              >
                관리자 대시보드
              </Link>
            )}
            {user ? (
              <div className="pt-4 pb-3 border-t border-gray-100">
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                    <img className="h-10 w-10 rounded-full" src={user.photoURL || ''} alt="" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user.displayName}</div>
                    <div className="text-sm font-medium text-gray-500">{user.email}</div>
                  </div>
                </div>
                <div className="mt-3 px-2 space-y-1">
                  <button
                    onClick={() => { logout(); setIsMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
}
