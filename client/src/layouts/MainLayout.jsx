import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MainLayout = () => {
  return (
    <div className="relative min-h-screen flex flex-col bg-darkBg text-gray-100 overflow-x-hidden">
      {/* Animated Glowing Spheres */}
      <div className="absolute top-[10%] left-[-10%] w-[50vw] h-[50vw] rounded-full neon-glow-sphere-1 pointer-events-none z-0"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full neon-glow-sphere-2 pointer-events-none z-0"></div>

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 grid-bg opacity-[0.4] pointer-events-none z-0"></div>

      {/* Navigation */}
      <Navbar />

      {/* Content Area */}
      <main className="flex-grow pt-24 pb-12 relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;
