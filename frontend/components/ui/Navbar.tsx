"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { BrainCircuit, LayoutDashboard, LogOut, User, ChevronDown } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [dropOpen, setDropOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/interview", label: "Practice" },
  ];

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-brand-500/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center group-hover:bg-brand-500 transition-colors">
            <BrainCircuit className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-slate-100">InterviewAI</span>
        </Link>

        {/* Nav Links */}
        {isAuthenticated && (
          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  pathname.startsWith(link.href)
                    ? "bg-brand-600/20 text-brand-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Auth */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setDropOpen(!dropOpen)}
                className="flex items-center gap-2 glass-bright px-3 py-2 rounded-xl hover:border-brand-500/30 transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="text-sm text-slate-200 hidden sm:block">{user?.name}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {dropOpen && (
                <div className="absolute right-0 top-12 glass-bright rounded-xl overflow-hidden w-48 shadow-2xl z-50">
                  <div className="px-4 py-3 border-b border-slate-700/50">
                    <p className="text-xs text-slate-400">Signed in as</p>
                    <p className="text-sm font-medium text-slate-200 truncate">{user?.email}</p>
                  </div>
                  <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700/40 transition-colors">
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700/40 transition-colors">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
