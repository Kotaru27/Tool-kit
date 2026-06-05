import React, { useRef, useState, useEffect } from 'react';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';
import { motion, useReducedMotion, useScroll, useTransform, useMotionValueEvent, useSpring } from 'framer-motion';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import Lottie from 'lottie-react';
import arrowAnimation from './arrow.json';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 80, damping: 18 } },
};

function RiveCTA() {
  const { rive, RiveComponent } = useRive({
    src: '/hover_arrow.riv',
    stateMachines: 'State Machine 1',
    autoplay: true,
  });
  const isHoverInput = useStateMachineInput(rive, 'State Machine 1', 'isHover', false);

  return (
    <motion.button
      onMouseEnter={() => isHoverInput && (isHoverInput.value = true)}
      onMouseLeave={() => isHoverInput && (isHoverInput.value = false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center justify-center gap-3 px-8 py-[20px] bg-white text-black rounded-full font-medium hover:bg-white/90 transition-colors w-full sm:w-auto overflow-hidden group shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]"
    >
      <span className="tracking-wide text-sm">Explore Our Work</span>
      <div className="w-5 h-5 flex items-center justify-center">
         <RiveComponent className="w-full h-full object-contain" />
      </div>
    </motion.button>
  );
}

function LottieCTA() {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center justify-center gap-3 px-8 py-[20px] bg-white text-black rounded-full font-medium hover:bg-white/90 transition-colors w-full sm:w-auto overflow-hidden group shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]"
    >
      <span className="tracking-wide text-sm">Explore Our Work</span>
      <div className="w-5 h-5 flex items-center justify-center -mr-1 group-hover:translate-x-1 transition-transform">
         <Lottie animationData={arrowAnimation} loop={true} />
      </div>
    </motion.button>
  );
}

function AssetAwareCTA() {
  const [assetStatus, setAssetStatus] = useState<'checking' | 'rive' | 'lottie'>('checking');

  useEffect(() => {
    fetch('/hover_arrow.riv', { method: 'HEAD' })
      .then(res => {
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && !contentType.includes('text/html')) {
          setAssetStatus('rive');
        } else {
          setAssetStatus('lottie');
        }
      })
      .catch(() => setAssetStatus('lottie'));
  }, []);

  if (assetStatus === 'checking') return <div className="h-[60px]" />;
  if (assetStatus === 'rive') return <RiveCTA />;
  return <LottieCTA />;
}

export default function AgencyHero() {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax Scroll logic with Spring physics for buttery smooth interpolation
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const strengthMVP = useTransform(smoothProgress, [0, 1], [2.5, 6.0]);
  const speedMVP = useTransform(smoothProgress, [0, 1], [0.3, 1.2]);
  
  const [uStrength, setUStrength] = useState(2.5);
  const [uSpeed, setUSpeed] = useState(0.3);

  useMotionValueEvent(strengthMVP, "change", (latest) => setUStrength(latest));
  useMotionValueEvent(speedMVP, "change", (latest) => setUSpeed(latest));

  // Spotlight logic
  const spotlightRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Small optimization: skip standard motion if OS requested reduced motion
      if (shouldReduceMotion || !spotlightRef.current || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      spotlightRef.current.animate(
        { transform: `translate(${x}px, ${y}px) translate(-50%, -50%)` },
        { duration: 400, fill: 'forwards', easing: 'ease-out' }
      );
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [shouldReduceMotion]);

  const animateVariants = shouldReduceMotion ? undefined : stagger;
  const childVariants = shouldReduceMotion ? undefined : fadeUp;

  return (
    <>
      {/* 
        Injecting fonts dynamically since we're scoped to this component demo.
        In a real app, you would load these in index.css or next/font.
      */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        
        .agency-hero {
          font-family: 'DM Sans', sans-serif;
        }
        .agency-hero-title {
          font-family: 'Cormorant Garamond', serif;
        }
      `}</style>
      
      <section ref={containerRef} className="agency-hero relative min-h-[100vh] w-full flex items-center justify-center overflow-hidden bg-[#0A0A0A] text-white selection:bg-white/20">
        
        {/* Living gradient background */}
        <div className="absolute inset-x-0 top-0 h-[150vh] z-0 pointer-events-none opacity-80 mix-blend-screen origin-top">
          <ShaderGradientCanvas style={{ pointerEvents: 'none' }}>
            <ShaderGradient
              control='query'
              type="waterPlane"
              animate={shouldReduceMotion ? "off" : "on"}
              uTime={0.2}
              uSpeed={uSpeed}
              uStrength={uStrength}
              uDensity={1.2}
              color1="#0a0a0a"   // deep void
              color2="#3a2b53"   // desaturated cinematic purple
              color3="#111116"   // tech graphite
            />
          </ShaderGradientCanvas>
        </div>

        {/* Cinematic Vignette Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] z-10 opacity-[0.85] pointer-events-none mix-blend-multiply"></div>
        
        {/* Grain Noise Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj4NCiAgPGZpbHRlciBpZD0ibm9pc2UiPg0KICAgIDxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjY1IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+DQogIDwvZmlsdGVyPg0KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgibm9pc2UpIiBvcGFjaXR5PSIwLjA1Ii8+DQo8L3N2Zz4=')] opacity-[0.035] z-10 mix-blend-overlay pointer-events-none"></div>

        {/* Cursor Tracking Spotlight */}
        {!shouldReduceMotion && (
          <div 
            ref={spotlightRef}
            className="absolute top-0 left-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_60%)] z-10 mix-blend-screen pointer-events-none rounded-full"
            style={{ willChange: 'transform' }}
          />
        )}

        {/* Main Content */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 flex flex-col justify-center items-start pt-20 pb-32">
          <motion.div
            variants={animateVariants}
            initial="hidden"
            animate="show"
            className="max-w-[900px]"
          >
            {/* Eyebrow Label */}
            <motion.div variants={childVariants} className="flex items-center gap-4 mb-8">
              <span className="w-10 h-[1px] bg-white/30" />
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/50 font-medium">
                Voted Studio of the Year
              </p>
            </motion.div>

            {/* Headline */}
            <motion.h1 
              variants={childVariants} 
              className="agency-hero-title text-[clamp(4.5rem,10vw,9rem)] font-medium leading-[0.9] tracking-[-0.03em] text-white mb-8"
            >
              We shape <br />
              <span className="italic font-light text-white/60">the future</span> of<br />
              digital spaces.
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              variants={childVariants} 
              className="text-[clamp(1.125rem,2.2vw,1.4rem)] text-white/60 leading-[1.6] max-w-[580px] font-light"
            >
              An award-winning creative collective building transcendent, unforgettable experiences for visionary brands.
            </motion.p>

            {/* CTA & Actions */}
            <motion.div 
              variants={childVariants}
              className="mt-14 flex flex-col sm:flex-row items-center gap-6"
            >
              <AssetAwareCTA />
              
              <motion.button
                whileHover={{ x: 6, backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center px-8 py-[20px] bg-transparent text-white border border-white/20 rounded-full font-medium transition-all w-full sm:w-auto tracking-wide text-sm"
              >
                Start a Project
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Animated Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-20 pointer-events-none">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="text-[9px] uppercase tracking-[0.25em] text-white/40 font-medium"
          >
            Scroll
          </motion.span>
          <svg width="2" height="40" viewBox="0 0 2 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="1" y1="0" x2="1" y2="40" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="2" strokeLinecap="round" />
            <motion.line 
              x1="1" y1="0" x2="1" y2="40" 
              stroke="url(#scrollGradient)" 
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.8, duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatType: "loop", repeatDelay: 1 }}
            />
            <defs>
              <linearGradient id="scrollGradient" x1="1" y1="0" x2="1" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" stopOpacity="0"/>
                <stop offset="0.5" stopColor="white" stopOpacity="0.8"/>
                <stop offset="1" stopColor="white" stopOpacity="0"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

      </section>
    </>
  );
}
