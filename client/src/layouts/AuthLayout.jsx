import React from 'react';
import { Outlet, Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AuthLayout = () => {
  const { token } = useSelector((state) => state.auth);

  // If already logged in, redirect to dashboard
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-darkBg px-4 overflow-hidden">
      {/* Background neon glows */}
      <div className="absolute top-[30%] left-[5%] w-[40vw] h-[40vw] rounded-full neon-glow-sphere-1 pointer-events-none z-0"></div>
      <div className="absolute bottom-[20%] right-[5%] w-[40vw] h-[40vw] rounded-full neon-glow-sphere-2 pointer-events-none z-0"></div>
      <div className="absolute inset-0 grid-bg opacity-[0.3] pointer-events-none z-0"></div>

      {/* Header logo */}
      <div className="relative z-10 mb-8 text-center">
        <Link to="/" className="inline-flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-neon-gradient flex items-center justify-center font-bold text-white shadow-neon-blue">
            IA
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Interview <span className="text-neonBlue">AI</span>
          </span>
        </Link>
        <p className="mt-2 text-sm text-gray-400">Perfect your interviewing skills with Generative AI</p>
      </div>

      {/* Main card box */}
      <div className="relative z-10 w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
