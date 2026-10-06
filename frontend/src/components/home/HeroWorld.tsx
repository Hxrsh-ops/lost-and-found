import React, { useState, useEffect, useRef } from 'react';
import {
  Laptop,
  Key,
  CreditCard,
  Briefcase,
  Headphones,
  BookOpen,
  Coffee,
  Smartphone,
  Sparkles,
} from 'lucide-react';

interface HeroWorldProps {
  onSelectCategoryName: (categoryName: string) => void;
  onOpenReport: (type: 'LOST' | 'FOUND') => void;
}

interface InteractiveObject {
  id: string;
  name: string;
  categoryName: string;
  type: 'LOST' | 'FOUND';
  location: string;
  icon: React.ReactNode;
  initialX: number; // percentage from left (0 - 100)
  initialY: number; // percentage from top (0 - 100)
  floatDelay: string;
  floatDuration: string;
  parallaxFactor: number;
}

export const HeroWorld: React.FC<HeroWorldProps> = ({
  onSelectCategoryName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    // Normalized offset between -1 and 1
    const normX = (e.clientX - centerX) / (rect.width / 2);
    const normY = (e.clientY - centerY) / (rect.height / 2);
    setMouseOffset({ x: normX * 8, y: normY * 8 });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
    setHoveredObjectId(null);
  };

  const objects: InteractiveObject[] = [
    {
      id: 'obj-phone',
      name: 'iPhone 15 Pro',
      categoryName: 'Electronics',
      type: 'LOST',
      location: 'Tech Park',
      icon: <Smartphone className="w-5 h-5 text-zinc-800" />,
      initialX: 18,
      initialY: 22,
      floatDelay: '0s',
      floatDuration: '6s',
      parallaxFactor: 1.2,
    },
    {
      id: 'obj-keys',
      name: 'Bike & Hostel Keys',
      categoryName: 'Keys',
      type: 'FOUND',
      location: 'Central Library',
      icon: <Key className="w-5 h-5 text-amber-700" />,
      initialX: 68,
      initialY: 18,
      floatDelay: '1.2s',
      floatDuration: '5.5s',
      parallaxFactor: 0.8,
    },
    {
      id: 'obj-idcard',
      name: 'SRM Student ID',
      categoryName: 'Documents',
      type: 'FOUND',
      location: 'Cafeteria',
      icon: <CreditCard className="w-5 h-5 text-blue-700" />,
      initialX: 42,
      initialY: 48,
      floatDelay: '0.8s',
      floatDuration: '7s',
      parallaxFactor: 1.5,
    },
    {
      id: 'obj-backpack',
      name: 'Black Backpack',
      categoryName: 'Bags & Backpacks',
      type: 'LOST',
      location: 'Main Block',
      icon: <Briefcase className="w-5 h-5 text-emerald-800" />,
      initialX: 15,
      initialY: 70,
      floatDelay: '2.1s',
      floatDuration: '6.5s',
      parallaxFactor: 0.9,
    },
    {
      id: 'obj-earbuds',
      name: 'AirPods Pro Case',
      categoryName: 'Electronics',
      type: 'FOUND',
      location: 'Audi Block',
      icon: <Headphones className="w-5 h-5 text-zinc-700" />,
      initialX: 78,
      initialY: 66,
      floatDelay: '1.5s',
      floatDuration: '5.8s',
      parallaxFactor: 1.3,
    },
    {
      id: 'obj-laptop',
      name: 'MacBook Air Charger',
      categoryName: 'Electronics',
      type: 'LOST',
      location: 'Lab 304',
      icon: <Laptop className="w-4 h-4 text-purple-700" />,
      initialX: 84,
      initialY: 38,
      floatDelay: '2.8s',
      floatDuration: '6.2s',
      parallaxFactor: 1.1,
    },
    {
      id: 'obj-bottle',
      name: 'Hydro Flask Bottle',
      categoryName: 'Water Bottles',
      type: 'FOUND',
      location: 'Sports Ground',
      icon: <Coffee className="w-4 h-4 text-teal-700" />,
      initialX: 48,
      initialY: 82,
      floatDelay: '0.4s',
      floatDuration: '6.8s',
      parallaxFactor: 0.7,
    },
    {
      id: 'obj-book',
      name: 'Engineering Physics',
      categoryName: 'Books / Stationery',
      type: 'LOST',
      location: 'Study Hall',
      icon: <BookOpen className="w-4 h-4 text-rose-700" />,
      initialX: 30,
      initialY: 10,
      floatDelay: '1.9s',
      floatDuration: '7.4s',
      parallaxFactor: 1.0,
    },
  ];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[320px] sm:h-[380px] lg:h-[420px] rounded-3xl bg-gradient-to-b from-[#F5F5F1] via-[#EDEDE6] to-[#E5E5DD] border border-[#E0E0D6] overflow-hidden select-none flex items-center justify-center p-4 group shadow-inner"
      aria-label="Interactive Campus Lost & Found World"
    >
      {/* Background Architectural Grid Pattern */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, #C8C8BE 1px, transparent 0)
          `,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Central Visual Anchor / Orbit Center */}
      <div className="relative z-10 text-center pointer-events-none flex flex-col items-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-surface/90 backdrop-blur-md border border-surface-border shadow-card flex items-center justify-center text-ink mb-2">
          <Sparkles className="w-7 h-7 text-accent" />
        </div>
        <div className="text-[11px] font-bold tracking-wider text-ink-secondary uppercase">
          Campus Property Grid
        </div>
        <div className="text-[10px] text-ink-muted">
          Click any object to filter reports
        </div>
      </div>

      {/* Interactive Floating Object Cards */}
      {objects.map((obj) => {
        const isHovered = hoveredObjectId === obj.id;
        const transformX = mouseOffset.x * obj.parallaxFactor;
        const transformY = mouseOffset.y * obj.parallaxFactor;

        return (
          <button
            key={obj.id}
            type="button"
            onClick={() => onSelectCategoryName(obj.categoryName)}
            onMouseEnter={() => setHoveredObjectId(obj.id)}
            onMouseLeave={() => setHoveredObjectId(null)}
            onFocus={() => setHoveredObjectId(obj.id)}
            onBlur={() => setHoveredObjectId(null)}
            style={{
              left: `${obj.initialX}%`,
              top: `${obj.initialY}%`,
              transform: `translate(${transformX}px, ${transformY}px)`,
              animation: prefersReducedMotion
                ? 'none'
                : `float ${obj.floatDuration} ease-in-out infinite alternate ${obj.floatDelay}`,
            }}
            className={`absolute z-20 group -translate-x-1/2 -translate-y-1/2 p-2.5 rounded-2xl bg-surface/95 hover:bg-surface border transition-all duration-200 cursor-pointer shadow-xs text-left focus:outline-none focus:ring-2 focus:ring-accent ${
              isHovered
                ? 'scale-110 shadow-card-hover border-ink/40 z-30'
                : 'border-surface-border/80 hover:border-surface-border'
            }`}
            title={`Filter by ${obj.categoryName}`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  obj.type === 'LOST'
                    ? 'bg-lost-bg/80 border-lost-border/60 text-lost-text'
                    : 'bg-found-bg/80 border-found-border/60 text-found-text'
                }`}
              >
                {obj.icon}
              </div>

              <div className="min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-bold px-1 py-0.2 rounded uppercase ${
                      obj.type === 'LOST'
                        ? 'bg-lost-bg text-lost-text border border-lost-border/50'
                        : 'bg-found-bg text-found-text border border-found-border/50'
                    }`}
                  >
                    {obj.type}
                  </span>
                  <span className="text-[10px] text-ink-muted truncate">
                    {obj.location}
                  </span>
                </div>
                <div className="text-xs font-bold text-ink truncate mt-0.5 max-w-[110px] sm:max-w-[130px]">
                  {obj.name}
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {/* Floating Legend / Quick Status at bottom */}
      <div className="absolute bottom-3 inset-x-4 flex items-center justify-between pointer-events-none text-[10px] text-ink-secondary">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-lost" /> Lost Items
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-found" /> Found Items
          </span>
        </div>
        <span className="font-mono text-[9px] text-ink-muted">
          SRM Ramapuram
        </span>
      </div>

      <style>{`
        @keyframes float {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-6px) rotate(0.5deg);
          }
          100% {
            transform: translateY(6px) rotate(-0.5deg);
          }
        }
      `}</style>
    </div>
  );
};
