import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Activity, Heart, BarChart3, UploadCloud, History, Info, Menu, X, ShieldAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const { data: health } = useQuery({
    queryKey: ["health"],
    queryFn: api.getHealth,
    refetchInterval: 30000,
  });

  const isHealthy = health?.status === "healthy";

  const navLinks = [
    { to: "/", label: "Home", icon: Heart },
    { to: "/assessment", label: "Dual Assessment", icon: Activity },
    { to: "/dashboard", label: "Insights", icon: BarChart3 },
    { to: "/batch", label: "Batch Screening", icon: UploadCloud },
    { to: "/history", label: "History", icon: History },
    { to: "/about", label: "About Model", icon: Info },
  ];

  return (
    <>
      {/* Persistent Top Clinical Disclaimer Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-slate-300 text-[11px] py-1 px-4 text-center font-medium flex items-center justify-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-teal-400 shrink-0" />
        <span>
          Educational & Clinical Decision Support Prototype. Not a diagnostic medical device.
        </span>
      </div>

      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-1">
                Cardio<span className="text-teal-600">Care</span>
              </span>
              <span className="block text-[10px] font-semibold text-slate-400 -mt-1 tracking-wider uppercase">
                Cardiometabolic Risk AI
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-teal-50 text-teal-700 font-bold shadow-xs border border-teal-200/50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-teal-600" : "text-slate-400"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions: Health Indicator & CTA */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Backend status pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/70 text-[11px] font-mono text-slate-500">
              <span
                className={`w-2 h-2 rounded-full ${
                  isHealthy ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span>{isHealthy ? "API v1.0 Connected" : "Connecting..."}</span>
            </div>

            <Link
              to="/assessment"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 shadow-md shadow-teal-500/20 active:scale-95 transition-all"
            >
              Start Assessment
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl px-4 py-3 space-y-1 shadow-xl">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? "bg-teal-50 text-teal-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-100 mt-2">
              <Link
                to="/assessment"
                onClick={() => setMobileOpen(false)}
                className="w-full block text-center py-2.5 rounded-xl text-sm font-bold text-white bg-teal-600"
              >
                Start Assessment
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
