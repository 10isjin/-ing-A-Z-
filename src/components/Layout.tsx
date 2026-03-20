import React from 'react';
import { Outlet } from 'react-router-dom';
import SEO from './SEO';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white selection:bg-green-100 selection:text-green-900">
      <SEO />
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
