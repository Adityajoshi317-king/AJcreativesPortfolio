import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';

// ==========================================================================
// 1. HELPER COMPONENTS & INTERACTION WRAPPERS
// ==========================================================================

// Magnetic Hover Effect Wrapper
function Magnetic({ children, strength = 0.3 }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const x = (clientX - centerX) * strength;
    const y = (clientY - centerY) * strength;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 120, damping: 15, mass: 0.1 }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}

// Letter-by-Letter Staggered Reveal Animation
function TextReveal({ text, className }) {
  const words = text.split(" ");
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.2 }
    }
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", damping: 12, stiffness: 80 }
    },
    hidden: {
      opacity: 0,
      y: 40,
      transition: { type: "spring", damping: 12, stiffness: 80 }
    }
  };

  return (
    <motion.h1
      variants={container}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {words.map((word, idx) => (
        <span key={idx} className="inline-block overflow-hidden mr-3 pb-2">
          <motion.span variants={child} className="inline-block">
            {word}
          </motion.span>
        </span>
      ))}
    </motion.h1>
  );
}

// Animated Numbers Count-Up on Scroll
function AnimatedCounter({ value, duration = 1.5 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasRun = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRun.current) {
          hasRun.current = true;
          let start = 0;
          const end = parseInt(value.replace(/[^0-9]/g, ""), 10);
          const range = end - start;
          let current = start;
          const increment = end > 100 ? Math.ceil(end / 40) : 1;
          const stepTime = Math.abs(Math.floor((duration * 1000) / (range / increment)));
          
          const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(current);
            }
          }, stepTime);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [value, duration]);

  // Extract non-digits (e.g. "M+", "K+")
  const suffix = value.replace(/[0-9]/g, "");

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

// Parallax Project Card Component
function ProjectCard({ category, title, description, videoSrc, accentColor, setCursorText, setCursorHovered }) {
  const cardRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [-80, 80]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.93, 1, 0.93]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.6, 1, 1, 0.6]);

  return (
    <motion.div
      ref={cardRef}
      style={{ scale, opacity }}
      onMouseEnter={() => {
        setCursorText("View Work");
        setCursorHovered(true);
      }}
      onMouseLeave={() => {
        setCursorHovered(false);
      }}
      className="relative w-full min-h-[70vh] flex flex-col md:flex-row items-center justify-between gap-12 py-16 border-b border-white/10 last:border-b-0 cursor-none"
    >
      {/* Narrative Section */}
      <div className="w-full md:w-5/12 flex flex-col items-start text-left z-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }}></span>
          <span className="font-mono text-xs uppercase tracking-widest text-white/50">{category}</span>
        </div>
        <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl leading-tight mb-6 tracking-tight text-cream">
          {title}
        </h2>
        <p className="font-body text-base md:text-lg leading-relaxed text-white/60 max-w-md">
          {description}
        </p>
      </div>

      {/* Visual Content Block */}
      <div className="w-full md:w-6/12 relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 group shadow-2xl">
        <motion.div style={{ y }} className="absolute -top-[15%] left-0 w-full h-[130%]">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 ease-out dither-effect"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-dark/60 via-transparent to-transparent pointer-events-none"></div>
      </div>
    </motion.div>
  );
}

// Motion Design Horizontal Grid Card (Unified 16:9 Aspect Video)
function MotionCard({ title, videoSrc, setCursorText, setCursorHovered }) {
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef(null);

  return (
    <div
      onMouseEnter={(e) => {
        e.stopPropagation(); // Stop propagation so the parent scrolltrack hover text doesn't override this
        setCursorText("Play ▷");
        setCursorHovered(true);
        setHovered(true);
      }}
      onMouseLeave={() => {
        setCursorText("Scroll ↔");
        setHovered(false);
      }}
      className="w-[280px] md:w-[440px] aspect-video relative rounded-2xl overflow-hidden border border-black/5 bg-[#0D0D0D] group shadow-md hover:shadow-xl transition-all duration-700 ease-out flex-shrink-0 cursor-none"
    >
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover opacity-85 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 ease-out dither-effect"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      
      {/* Detail Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 text-left">
        <span className="font-mono text-[9px] uppercase tracking-wider text-peach mb-1">Concept Video</span>
        <h4 className="font-heading text-lg text-cream leading-tight">{title}</h4>
      </div>
    </div>
  );
}

// YouTube Video Card component with dynamic thumbnail error fallback
function YoutubeCard({ title, videoId, setCursorText, setCursorHovered, onClick }) {
  const [imgSrc, setImgSrc] = useState(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);

  const handleImageError = () => {
    setImgSrc(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={(e) => {
        e.stopPropagation();
        setCursorText("Play ▷");
        setCursorHovered(true);
      }}
      onMouseLeave={() => {
        setCursorText("Scroll ↔");
      }}
      className="w-[280px] md:w-[440px] aspect-video relative rounded-2xl overflow-hidden border border-black/5 bg-[#0D0D0D] group shadow-md hover:shadow-xl transition-all duration-700 ease-out flex-shrink-0 cursor-pointer cursor-none"
    >
      <img
        src={imgSrc}
        onError={handleImageError}
        alt={title}
        className="w-full h-full object-cover opacity-85 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 ease-out dither-effect"
      />
      
      {/* Play Icon Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white ml-1"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
      
      {/* Detail Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 text-left">
        <span className="font-mono text-[9px] uppercase tracking-wider text-peach mb-1">YouTube Work</span>
        <h4 className="font-heading text-lg text-cream leading-tight">{title}</h4>
      </div>
    </div>
  );
}

// ==========================================================================
// 2. MAIN APPLICATION COMPONENT
// ==========================================================================

function App() {
  const [theme, setTheme] = useState("dark"); // "dark" | "light"
  const [cursorText, setCursorText] = useState("");
  const [cursorHovered, setCursorHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [copied, setCopied] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState(null);
  
  const aboutRef = useRef(null);
  const splineCanvasRef = useRef(null);
  const splineCanvasRef2 = useRef(null);
  
  // Branding section refs
  const brandingSectionRef = useRef(null);
  const brandingMobileRef = useRef(null);
  const brandingTrackRef = useRef(null);
  
  // Documentary section refs
  const docSectionRef = useRef(null);
  const docMobileRef = useRef(null);
  const docTrackRef = useRef(null);

  // Motion graphics section refs
  const motionSectionRef = useRef(null);
  const motionMobileRef = useRef(null);
  const horizontalTrackRef = useRef(null);

  // Global mouse position tracking for spring cursor follow
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // IntersectionObserver to dynamically transition background theme
  useEffect(() => {
    const activeSections = new Set();
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const id = entry.target.id;
          if (entry.isIntersecting) {
            activeSections.add(id);
          } else {
            activeSections.delete(id);
          }
        });
        
        if (activeSections.size > 0) {
          setTheme("light");
        } else {
          setTheme("dark");
        }
      },
      { threshold: 0.02, rootMargin: "-10% 0px -20% 0px" }
    );

    if (aboutRef.current) observer.observe(aboutRef.current);
    if (docSectionRef.current) observer.observe(docSectionRef.current);
    if (docMobileRef.current) observer.observe(docMobileRef.current);

    return () => observer.disconnect();
  }, []);

  // Load Spline 3D Scenes for the Hero section background
  useEffect(() => {
    let splineApp = null;
    let splineApp2 = null;
    
    import('@splinetool/runtime').then(({ Application }) => {
      if (splineCanvasRef.current) {
        splineApp = new Application(splineCanvasRef.current);
        splineApp.load('https://prod.spline.design/wLNPW-u0PmeBQRYy/scene.splinecode').then(() => {
          window.splineApp = splineApp;
          console.log("Foreground Spline 3D scene loaded successfully.");
          try {
            const textObj = splineApp.findObjectByName('Text');
            if (textObj) {
              // Center the text to the middle
              textObj.position.x = 0;
              textObj.position.y = 0;
              textObj.position.z = 0;
            }
          } catch (e) {
            console.error(e);
          }
        });
      }
      if (splineCanvasRef2.current) {
        splineApp2 = new Application(splineCanvasRef2.current);
        splineApp2.load('https://prod.spline.design/X7k2VeUpaeQgO-v6/scene.splinecode').then(() => {
          window.splineApp2 = splineApp2;
          console.log("Background Spline 3D scene loaded successfully.");
          try {
            const sphereObj = splineApp2.findObjectByName('Sphere');
            if (sphereObj) {
              // Make the bubble a bit smaller (approx 70% of original scale)
              sphereObj.scale.x = 4.31;
              sphereObj.scale.y = 4.31;
              sphereObj.scale.z = 5.21;
            }
          } catch (e) {
            console.error(e);
          }
        });
      }
    }).catch(err => {
      console.error("Failed to load Spline 3D Scenes:", err);
    });
  }, []);

  // 1. Branding Sticky Scroll
  const { scrollYProgress: scrollYBranding } = useScroll({
    target: brandingSectionRef,
    offset: ["start start", "end end"]
  });
  const [xTranslationBranding, setXTranslationBranding] = useState(0);
  useEffect(() => {
    const calculateScroll = () => {
      if (brandingTrackRef.current) {
        const trackWidth = brandingTrackRef.current.scrollWidth;
        const viewportWidth = window.innerWidth;
        setXTranslationBranding(-(trackWidth - viewportWidth));
      }
    };
    const timer = setTimeout(calculateScroll, 600);
    window.addEventListener('resize', calculateScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateScroll);
    };
  }, []);
  const xTransformBranding = useTransform(scrollYBranding, [0, 1], [0, xTranslationBranding]);
  const xBranding = useSpring(xTransformBranding, { stiffness: 60, damping: 15, mass: 0.2 });

  // 2. Documentary Sticky Scroll
  const { scrollYProgress: scrollYDoc } = useScroll({
    target: docSectionRef,
    offset: ["start start", "end end"]
  });
  const [xTranslationDoc, setXTranslationDoc] = useState(0);
  useEffect(() => {
    const calculateScroll = () => {
      if (docTrackRef.current) {
        const trackWidth = docTrackRef.current.scrollWidth;
        const viewportWidth = window.innerWidth;
        setXTranslationDoc(-(trackWidth - viewportWidth));
      }
    };
    const timer = setTimeout(calculateScroll, 600);
    window.addEventListener('resize', calculateScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateScroll);
    };
  }, []);
  const xTransformDoc = useTransform(scrollYDoc, [0, 1], [0, xTranslationDoc]);
  const xDoc = useSpring(xTransformDoc, { stiffness: 60, damping: 15, mass: 0.2 });

  // 3. Motion Design Sticky Scroll
  const { scrollYProgress: scrollYMotion } = useScroll({
    target: motionSectionRef,
    offset: ["start start", "end end"]
  });
  const [xTranslationMotion, setXTranslationMotion] = useState(0);
  useEffect(() => {
    const calculateScroll = () => {
      if (horizontalTrackRef.current) {
        const trackWidth = horizontalTrackRef.current.scrollWidth;
        const viewportWidth = window.innerWidth;
        setXTranslationMotion(-(trackWidth - viewportWidth));
      }
    };
    const timer = setTimeout(calculateScroll, 600);
    window.addEventListener('resize', calculateScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateScroll);
    };
  }, []);
  const xTransformMotion = useTransform(scrollYMotion, [0, 1], [0, xTranslationMotion]);
  const x = useSpring(xTransformMotion, { stiffness: 60, damping: 15, mass: 0.2 });

  // Trigger Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  // Handle email click copy-to-clipboard
  const handleEmailCopy = (e) => {
    e.preventDefault();
    const email = "adityamedia317@gmail.com";
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setCursorText("Copied!");
      setTimeout(() => {
        setCopied(false);
        setCursorText("Copy Email");
      }, 2000);
    });
  };

  // Theme transitions helper classes
  const themeContainerClass = theme === "light" 
    ? "bg-cream text-dark transition-all duration-1000 ease-in-out" 
    : "bg-dark text-cream transition-all duration-1000 ease-in-out";

  return (
    <div className={`relative min-h-screen select-none ${themeContainerClass}`}>
      
      {/* Viewport Framing (12px border) */}
      <div className="fixed inset-0 border-[12px] border-dark pointer-events-none z-50 transition-colors duration-1000"></div>

      {/* Cinematic Vignette Overlay */}
      <div className="vignette-overlay"></div>

      {/* Dynamic unified custom cursor */}
      <motion.div
        className="fixed z-40 top-0 left-0 pointer-events-none flex items-center justify-center text-center mix-blend-difference"
        animate={{ 
          x: mousePos.x - (cursorHovered ? 48 : 12), 
          y: mousePos.y - (cursorHovered ? 48 : 12),
          width: cursorHovered ? 96 : 24,
          height: cursorHovered ? 96 : 24,
        }}
        transition={{ type: "spring", stiffness: 350, damping: 26, mass: 0.15 }}
      >
        <div className={`w-full h-full rounded-full border border-white/60 bg-white/5 backdrop-blur-[1px] flex items-center justify-center transition-all duration-300`}>
          {cursorHovered && cursorText && (
            <span className="font-mono text-[9px] uppercase tracking-wider text-white select-none whitespace-normal px-2">
              {cursorText}
            </span>
          )}
        </div>
      </motion.div>

      {/* ==========================================================================
         A. HEADER / NAVIGATION BAR
         ========================================================================== */}
      <header className="fixed top-8 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-4xl flex items-center justify-between px-8 py-4 bg-dark/30 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
        <Magnetic>
          <a 
            href="#" 
            onMouseEnter={() => { setCursorText("Home"); setCursorHovered(true); }}
            onMouseLeave={() => setCursorHovered(false)}
            className="font-heading text-xl uppercase tracking-tighter text-cream flex items-center gap-1"
          >
            AJcreatives<span className="text-electric font-mono">.</span>
          </a>
        </Magnetic>

        <nav className="hidden md:flex items-center gap-8 font-mono text-xs tracking-widest uppercase">
          <Magnetic>
            <a 
              href="#about" 
              onMouseEnter={() => { setCursorText("Go ➔"); setCursorHovered(true); }}
              onMouseLeave={() => setCursorHovered(false)}
              className="hover:text-electric transition-colors"
            >
              About
            </a>
          </Magnetic>
          <Magnetic>
            <a 
              href="#branding" 
              onMouseEnter={() => { setCursorText("Go ➔"); setCursorHovered(true); }}
              onMouseLeave={() => setCursorHovered(false)}
              className="hover:text-electric transition-colors"
            >
              Branding
            </a>
          </Magnetic>
          <Magnetic>
            <a 
              href="#documentaries" 
              onMouseEnter={() => { setCursorText("Go ➔"); setCursorHovered(true); }}
              onMouseLeave={() => setCursorHovered(false)}
              className="hover:text-electric transition-colors"
            >
              Documentary
            </a>
          </Magnetic>
          <Magnetic>
            <a 
              href="#motion-design" 
              onMouseEnter={() => { setCursorText("Go ➔"); setCursorHovered(true); }}
              onMouseLeave={() => setCursorHovered(false)}
              className="hover:text-electric transition-colors"
            >
              Motion
            </a>
          </Magnetic>
          <Magnetic>
            <a 
              href="#testimonials" 
              onMouseEnter={() => { setCursorText("Go ➔"); setCursorHovered(true); }}
              onMouseLeave={() => setCursorHovered(false)}
              className="hover:text-electric transition-colors"
            >
              Reviews
            </a>
          </Magnetic>
        </nav>

        <Magnetic>
          <a
            href="#contact"
            onMouseEnter={() => { setCursorText("Talk!"); setCursorHovered(true); }}
            onMouseLeave={() => setCursorHovered(false)}
            className="px-5 py-2 bg-cream text-dark hover:bg-electric hover:text-cream rounded-full font-mono text-xs uppercase tracking-widest transition-colors duration-300 shadow-md"
          >
            Let's Talk
          </a>
        </Magnetic>
      </header>

      {/* ==========================================================================
         B. HERO SECTION
         ========================================================================== */}
      <section className="relative w-full h-screen flex flex-col items-center justify-between py-24 text-center px-4 overflow-hidden bg-dark">
        {/* Silk Background Layer with Ken Burns Animation */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat hero-silk-bg opacity-35 pointer-events-none"
          style={{ backgroundImage: "url('silk_bg.png')" }}
        />

        {/* Interactive Spline 3D Background Canvas 2 (Behind) */}
        <div className="absolute z-5 select-none" style={{ top: '-15%', left: '-15%', right: '-15%', bottom: '-15%' }}>
          <canvas 
            ref={splineCanvasRef2} 
            id="canvas3d-bg" 
            className="w-full h-full object-cover opacity-100" 
            style={{ 
              mixBlendMode: 'screen',
              filter: 'brightness(2.0) contrast(1.2) saturate(1.3)'
            }} 
          />
        </div>

        {/* Interactive Spline 3D Background Canvas 1 (Foreground / Distorting Typography) */}
        <div className="absolute z-10 select-none" style={{ top: '-15%', left: '-15%', right: '-15%', bottom: '-15%' }}>
          <canvas 
            ref={splineCanvasRef} 
            id="canvas3d" 
            className="w-full h-full object-cover opacity-95" 
            style={{ 
              mixBlendMode: 'screen'
            }} 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark/40 via-dark/10 to-dark pointer-events-none"></div>
        </div>

        {/* Empty top spacer to balance layout */}
        <div className="h-12 w-full"></div>

        {/* Action Button positioned at the bottom, clear of the 3D central typography */}
        <div className="relative z-20 mb-8 pointer-events-auto select-none">
          <Magnetic>
            <a
              href="#branding"
              onMouseEnter={() => { setCursorText("View Work"); setCursorHovered(true); }}
              onMouseLeave={() => setCursorHovered(false)}
              className="inline-flex items-center gap-3 px-8 py-4 bg-electric text-cream font-mono text-xs uppercase tracking-widest rounded-full hover:bg-peach hover:text-dark transition-all duration-300 shadow-lg hover:shadow-peach/20 cursor-none"
            >
              <span>View Portfolio</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>
          </Magnetic>
        </div>

        {/* Scroll Mouse micro-animation helper */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-white/40 pointer-events-none">
          <span>Scroll to Explore</span>
          <div className="w-[18px] h-[30px] rounded-full border border-white/20 p-1 flex justify-center">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="w-1 h-1.5 bg-electric rounded-full"
            />
          </div>
        </div>
      </section>

      {/* ==========================================================================
         C. INTERACTIVE ABOUT SECTION (THEME SWAPS TO LIGHT)
         ========================================================================== */}
      <section
        ref={aboutRef}
        id="about"
        className="relative w-full py-32 px-[5%] flex flex-col justify-center items-center text-center overflow-hidden"
      >
        <div className="max-w-5xl mx-auto z-10">
          <span className="font-mono text-xs uppercase tracking-widest text-electric mb-6 block">Attention Design</span>
          
          <h2 className="font-heading text-3xl md:text-5xl lg:text-7xl leading-tight tracking-tight uppercase max-w-4xl mx-auto">
            Position your content within the <span className="text-electric">top 1%</span>
          </h2>
          
          <p className="mt-8 font-body text-lg md:text-2xl text-current opacity-70 max-w-3xl mx-auto leading-relaxed">
            We engineer high-retention video edits and custom motion designs that keep your audience hooked, drive massive engagement, and scale your brand authority.
          </p>

          {/* Scrolling metrics countups inside the light section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
            <div className="p-8 rounded-2xl bg-white/5 border border-black/5 backdrop-blur-sm shadow-xl flex flex-col items-center">
              <span className="font-heading text-6xl md:text-7xl text-electric mb-3">
                <AnimatedCounter value="16M+" />
              </span>
              <span className="font-mono text-xs uppercase tracking-widest opacity-60">Total Views Generated</span>
            </div>

            <div className="p-8 rounded-2xl bg-white/5 border border-black/5 backdrop-blur-sm shadow-xl flex flex-col items-center">
              <span className="font-heading text-6xl md:text-7xl text-electric mb-3">
                <AnimatedCounter value="400K+" />
              </span>
              <span className="font-mono text-xs uppercase tracking-widest opacity-60">Active Likes Gained</span>
            </div>

            <div className="p-8 rounded-2xl bg-white/5 border border-black/5 backdrop-blur-sm shadow-xl flex flex-col items-center">
              <span className="font-heading text-6xl md:text-7xl text-electric mb-3">
                <AnimatedCounter value="26" />
              </span>
              <span className="font-mono text-xs uppercase tracking-widest opacity-60">High-Impact Projects</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
         D1. BUSINESS & PERSONAL BRANDING (DARK THEME STICKY SCROLL)
         ========================================================================== */}
      {/* Desktop Sticky Scroll Section (md and up) */}
      <div
        ref={brandingSectionRef}
        id="branding"
        className="relative hidden md:block w-full h-[250vh] transition-colors duration-1000 bg-dark text-cream"
      >
        <div className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden z-10 bg-dark text-cream">
          
          {/* Section Heading */}
          <div className="max-w-7xl mx-auto text-center mb-10 px-[5%]">
            <span className="font-mono text-xs uppercase tracking-widest text-electric mb-3 block">Production Track</span>
            <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tighter text-current">
              Business & Personal Branding
            </h1>
            <p className="mt-2 font-body text-base md:text-lg text-white/60 max-w-2xl mx-auto">
              Crafting premium visual styles, attention-grabbing hooks, and structures designed to build commercial impact.
            </p>
          </div>

          {/* Horizontal Track container */}
          <div className="w-full relative">
            <motion.div 
              ref={brandingTrackRef}
              style={{ x: xBranding }}
              className="flex flex-row gap-8 px-24 w-max cursor-none"
              onMouseEnter={() => {
                setCursorText("Scroll ↔");
                setCursorHovered(true);
              }}
              onMouseLeave={() => {
                setCursorHovered(false);
              }}
            >
              <YoutubeCard
                title="The Morning Routine That Changed My Life | Get Ahead of 99% of People"
                videoId="Low5siEiFWg"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("Low5siEiFWg")}
              />
              <YoutubeCard
                title="Beginner's Guide to Smartlead in 2026"
                videoId="RD_HGgP9xfc"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("RD_HGgP9xfc")}
              />
              <YoutubeCard
                title="How to Get Your First Recruitment Client in 7 Days"
                videoId="BVwKPnyN1HY"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("BVwKPnyN1HY")}
              />
              <YoutubeCard
                title="If You Use Clay.com You NEED To Do This Now!"
                videoId="280ctlUOSWQ"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("280ctlUOSWQ")}
              />
              <YoutubeCard
                title="Step-By-Step How I Get $35k Recruiting Placements!"
                videoId="5apeEjtxhsQ"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("5apeEjtxhsQ")}
              />
              <YoutubeCard
                title="The Best Cold Email Strategy Nobody Is Talking About"
                videoId="zkxtx45UUEQ"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("zkxtx45UUEQ")}
              />
              <YoutubeCard
                title="I Ranked Every Website Builder [TIER LIST]"
                videoId="I16w2xV4KTM"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("I16w2xV4KTM")}
              />
              <YoutubeCard
                title="Branding Case Study: Scaling Client Acquisition"
                videoId="eX20Q7MIa2s"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("eX20Q7MIa2s")}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile Swipe Section (sm and down) */}
      <section
        ref={brandingMobileRef}
        id="branding-mobile"
        className="relative md:hidden w-full py-24 px-0 overflow-hidden bg-dark text-cream"
      >
        <div className="max-w-7xl mx-auto text-center mb-10 px-[5%]">
          <span className="font-mono text-xs uppercase tracking-widest text-electric mb-3 block">Production Track</span>
          <h1 className="font-heading text-3xl uppercase tracking-tighter text-current">
            Business & Branding
          </h1>
          <p className="mt-2 font-body text-sm text-white/60 max-w-xl mx-auto">
            Crafting premium visual styles, attention-grabbing hooks, and structures designed to build commercial impact.
          </p>
        </div>

        {/* Swipe-friendly horizontal scroll track for mobile */}
        <div className="w-full overflow-x-auto pb-8 flex justify-start scrollbar-none snap-x snap-mandatory">
          <div className="flex flex-row gap-6 px-6 w-max">
            <div className="snap-center">
              <YoutubeCard
                title="The Morning Routine That Changed My Life | Get Ahead of 99% of People"
                videoId="Low5siEiFWg"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("Low5siEiFWg")}
              />
            </div>
            <div className="snap-center">
              <YoutubeCard
                title="Beginner's Guide to Smartlead in 2026"
                videoId="RD_HGgP9xfc"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("RD_HGgP9xfc")}
              />
            </div>
            <div className="snap-center">
              <YoutubeCard
                title="How to Get Your First Recruitment Client in 7 Days"
                videoId="BVwKPnyN1HY"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("BVwKPnyN1HY")}
              />
            </div>
            <div className="snap-center">
              <YoutubeCard
                title="If You Use Clay.com You NEED To Do This Now!"
                videoId="280ctlUOSWQ"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("280ctlUOSWQ")}
              />
            </div>
            <div className="snap-center">
              <YoutubeCard
                title="Step-By-Step How I Get $35k Recruiting Placements!"
                videoId="5apeEjtxhsQ"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("5apeEjtxhsQ")}
              />
            </div>
            <div className="snap-center">
              <YoutubeCard
                title="The Best Cold Email Strategy Nobody Is Talking About"
                videoId="zkxtx45UUEQ"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("zkxtx45UUEQ")}
              />
            </div>
            <div className="snap-center">
              <YoutubeCard
                title="I Ranked Every Website Builder [TIER LIST]"
                videoId="I16w2xV4KTM"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("I16w2xV4KTM")}
              />
            </div>
            <div className="snap-center">
              <YoutubeCard
                title="Branding Case Study: Scaling Client Acquisition"
                videoId="eX20Q7MIa2s"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("eX20Q7MIa2s")}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
         D2. DOCUMENTARY PRODUCTION (LIGHT CREAM THEME STICKY SCROLL)
         ========================================================================== */}
      {/* Desktop Sticky Scroll Section (md and up) */}
      <div
        ref={docSectionRef}
        id="documentaries"
        className="relative hidden md:block w-full h-[250vh] transition-colors duration-1000 bg-cream text-dark"
      >
        <div className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden z-10 bg-cream text-dark">
          
          {/* Section Heading */}
          <div className="max-w-7xl mx-auto text-center mb-10 px-[5%]">
            <span className="font-mono text-xs uppercase tracking-widest text-electric mb-3 block">Production Track</span>
            <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tighter text-current">
              Documentary Production
            </h1>
            <p className="mt-2 font-body text-base md:text-lg text-dark/60 max-w-2xl mx-auto">
              Cinematic-grade storytelling, narrative retention pacing, and sound designs built for maximum audience retention.
            </p>
          </div>

          {/* Horizontal Track container */}
          <div className="w-full relative">
            <motion.div 
              ref={docTrackRef}
              style={{ x: xDoc }}
              className="flex flex-row gap-8 px-24 w-max cursor-none"
              onMouseEnter={() => {
                setCursorText("Scroll ↔");
                setCursorHovered(true);
              }}
              onMouseLeave={() => {
                setCursorHovered(false);
              }}
            >
              <YoutubeCard
                title="Stupid YouTubers Who'd Do Anything for Views"
                videoId="7eks3taAtZY"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("7eks3taAtZY")}
              />
              <YoutubeCard
                title="The Dark Side of YouTube Fame"
                videoId="8OA24QZYato"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("8OA24QZYato")}
              />
              <YoutubeCard
                title="When Penguinz0 'Cancels' Dumb People"
                videoId="_Z3wAG2GcGM"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("_Z3wAG2GcGM")}
              />
              <YoutubeCard
                title="The Only Island Where Evolution Glitched"
                videoId="tPgJcDizKMY"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("tPgJcDizKMY")}
              />
              <YoutubeCard
                title="5 Most BRUTAL Dinosaur Deaths Ever Discovered"
                videoId="GM8HJ53UD20"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("GM8HJ53UD20")}
              />
              <YoutubeCard
                title="Where Are MrBeast Giveaway Winners Today?"
                videoId="Cuf1ybOLgGc"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("Cuf1ybOLgGc")}
              />
              <YoutubeCard
                title="Most BRUTAL Dinosaur Fights Ever Discovered!"
                videoId="8GIu0cMe3yQ"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("8GIu0cMe3yQ")}
              />
              <YoutubeCard
                title="Strangest Ancient Bodies Ever Found!"
                videoId="010G9AWaF1c"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("010G9AWaF1c")}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile Swipe Section (sm and down) */}
      <section
        ref={docMobileRef}
        id="documentaries-mobile"
        className="relative md:hidden w-full py-24 px-0 overflow-hidden bg-cream text-dark"
      >
        <div className="max-w-7xl mx-auto text-center mb-10 px-[5%]">
          <span className="font-mono text-xs uppercase tracking-widest text-electric mb-3 block">Production Track</span>
          <h1 className="font-heading text-3xl uppercase tracking-tighter text-current">
            Documentaries
          </h1>
          <p className="mt-2 font-body text-sm text-dark/60 max-w-xl mx-auto">
            Cinematic-grade storytelling, narrative retention pacing, and sound designs built for maximum audience retention.
          </p>
        </div>

        {/* Swipe-friendly horizontal scroll track for mobile */}
        <div className="w-full overflow-x-auto pb-8 flex justify-start scrollbar-none snap-x snap-mandatory">
          <div className="flex flex-row gap-6 px-6 w-max">
            <div className="snap-center">
              <YoutubeCard
                title="Stupid YouTubers Who'd Do Anything for Views"
                videoId="7eks3taAtZY"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("7eks3taAtZY")}
              />
            </div>
            <div className="snap-center">
              <YoutubeCard
                title="The Dark Side of YouTube Fame"
                videoId="8OA24QZYato"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("8OA24QZYato")}
              />
            </div>
            <div className="snap-center">
              <YoutubeCard
                title="When Penguinz0 'Cancels' Dumb People"
                videoId="_Z3wAG2GcGM"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("_Z3wAG2GcGM")}
              />
            </div>
            <div className="snap-center">
              <YoutubeCard
                title="The Only Island Where Evolution Glitched"
                videoId="tPgJcDizKMY"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("tPgJcDizKMY")}
              />
            </div>
            <div className="snap-center">
              <YoutubeCard
                title="5 Most BRUTAL Dinosaur Deaths Ever Discovered"
                videoId="GM8HJ53UD20"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("GM8HJ53UD20")}
              />
            </div>
            <div className="snap-center">
              <YoutubeCard
                title="Where Are MrBeast Giveaway Winners Today?"
                videoId="Cuf1ybOLgGc"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("Cuf1ybOLgGc")}
              />
            </div>
            <div className="snap-center">
              <YoutubeCard
                title="Most BRUTAL Dinosaur Fights Ever Discovered!"
                videoId="8GIu0cMe3yQ"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("8GIu0cMe3yQ")}
              />
            </div>
            <div className="snap-center">
              <YoutubeCard
                title="Strangest Ancient Bodies Ever Found!"
                videoId="010G9AWaF1c"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
                onClick={() => setActiveVideoId("010G9AWaF1c")}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
         E. MOTION DESIGN & VISUAL ART (THEME SWAPS TO LIGHT)
         ========================================================================== */}
      {/* Desktop Sticky Scroll Section (md and up) */}
      <div
        ref={motionSectionRef}
        id="motion-design"
        className="relative hidden md:block w-full h-[250vh] transition-colors duration-1000"
      >
        <div className={`sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden z-10 transition-colors duration-1000 ${
          theme === "light" ? "bg-cream text-dark" : "bg-dark text-cream"
        }`}>
          
          {/* Section Heading inside sticky wrapper */}
          <div className="max-w-7xl mx-auto text-center mb-10 px-[5%]">
            <span className="font-mono text-xs uppercase tracking-widest text-electric mb-3 block">Design Concepts</span>
            <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tighter text-current">
              Motion Design & Art
            </h1>
            <p className="mt-2 font-body text-base md:text-lg text-current opacity-60 max-w-2xl mx-auto">
              Creating premium motion graphics and dynamic concept videos designed to hook viewers and optimize visual authority.
            </p>
          </div>

          {/* Horizontal Track container */}
          <div className="w-full relative">
            <motion.div 
              ref={horizontalTrackRef}
              style={{ x }}
              className="flex flex-row gap-8 px-24 w-max cursor-none"
              onMouseEnter={() => {
                setCursorText("Scroll ↔");
                setCursorHovered(true);
              }}
              onMouseLeave={() => {
                setCursorHovered(false);
              }}
            >
              <MotionCard
                title="Apple Calendar Concept"
                videoSrc="apple cal motion graphic.mp4"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
              />
              <MotionCard
                title="Apple Intel Architecture"
                videoSrc="apple intel motion graphic.mp4"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
              />
              <MotionCard
                title="Google Workspace Dynamic"
                videoSrc="google motion graphic.mp4"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
              />
              <MotionCard
                title="PayPal Transactions Flow"
                videoSrc="paypal motion graphics.mp4"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
              />
              <MotionCard
                title="Spotify UI Kinetics"
                videoSrc="spotify concept video.mp4"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile Swipe Section (sm and down) */}
      <section
        ref={motionMobileRef}
        id="motion-design-mobile"
        className="relative md:hidden w-full py-24 px-0 overflow-hidden transition-colors duration-1000"
      >
        <div className="max-w-7xl mx-auto text-center mb-10 px-[5%]">
          <span className="font-mono text-xs uppercase tracking-widest text-electric mb-3 block">Design Concepts</span>
          <h1 className="font-heading text-3xl uppercase tracking-tighter text-current">
            Motion Design & Art
          </h1>
          <p className="mt-2 font-body text-sm text-current opacity-60 max-w-xl mx-auto">
            Creating premium motion graphics and dynamic concept videos designed to hook viewers and optimize visual authority.
          </p>
        </div>

        {/* Swipe-friendly horizontal scroll track for mobile */}
        <div className="w-full overflow-x-auto pb-8 flex justify-start scrollbar-none snap-x snap-mandatory">
          <div className="flex flex-row gap-6 px-6 w-max">
            <div className="snap-center">
              <MotionCard
                title="Apple Calendar Concept"
                videoSrc="apple cal motion graphic.mp4"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
              />
            </div>
            <div className="snap-center">
              <MotionCard
                title="Apple Intel Architecture"
                videoSrc="apple intel motion graphic.mp4"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
              />
            </div>
            <div className="snap-center">
              <MotionCard
                title="Google Workspace Dynamic"
                videoSrc="google motion graphic.mp4"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
              />
            </div>
            <div className="snap-center">
              <MotionCard
                title="PayPal Transactions Flow"
                videoSrc="paypal motion graphics.mp4"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
              />
            </div>
            <div className="snap-center">
              <MotionCard
                title="Spotify UI Kinetics"
                videoSrc="spotify concept video.mp4"
                setCursorText={setCursorText}
                setCursorHovered={setCursorHovered}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
         F. VERIFIED TESTIMONIALS
         ========================================================================== */}
      <section id="testimonials" className="relative w-full py-32 px-[5%] bg-dark/95 text-cream border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="font-mono text-xs uppercase tracking-widest text-peach mb-4 block">Social Proof</span>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl uppercase tracking-tight">Client Endorsements</h1>
            <p className="mt-4 font-mono text-xs opacity-40">Sourced &amp; verified directly from YTJobs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="relative p-8 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between group hover:border-peach/20 transition-colors duration-500 shadow-xl">
              <span className="absolute top-6 right-6 font-mono text-[9px] bg-sky-500/10 text-sky-400 px-3 py-1 rounded-full uppercase">✓ Verified</span>
              <div className="mt-6">
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src="https://yt3.googleusercontent.com/N_KKx1FWlzq7EtllJDyRgJIEX1iJbn-fmW2wJTg9d-8ye_wa4k0RDUkjg8ns2FNcg-rOSZhU-mA=s240-c-k-c0x00ffffff-no-rj" 
                    alt="Ryan Pictures" 
                    className="w-12 h-12 rounded-full border border-peach object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="flex flex-col text-left">
                    <span className="font-heading text-lg text-cream">Ryan Pictures</span>
                    <span className="font-mono text-xs text-white/40">487K Subscribers</span>
                  </div>
                </div>
                <p className="font-body text-sm leading-relaxed text-white/60 italic text-left">
                  "Aditya is a very talented editor. He is very creative with his edits and always delivers top notch quality. I've never been disappointed with the creativity and effort that goes into my videos."
                </p>
              </div>
            </div>

            {/* Review 2 */}
            <div className="relative p-8 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between group hover:border-peach/20 transition-colors duration-500 shadow-xl">
              <span className="absolute top-6 right-6 font-mono text-[9px] bg-sky-500/10 text-sky-400 px-3 py-1 rounded-full uppercase">✓ Verified</span>
              <div className="mt-6">
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src="https://yt3.googleusercontent.com/8zVZZb1MwerjF4Kj6qybx87Yx0N5FZ44CIXuPtocFEtkZ7gRYfD856A2JPkrfV4kwEs6D_PfUg=s240-c-k-c0x00ffffff-no-rj" 
                    alt="HRK Studio" 
                    className="w-12 h-12 rounded-full border border-peach object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="flex flex-col text-left">
                    <span className="font-heading text-lg text-cream">HRK Studio</span>
                    <span className="font-mono text-xs text-white/40">41.6K Subscribers</span>
                  </div>
                </div>
                <p className="font-body text-sm leading-relaxed text-white/60 italic text-left">
                  "He's one of the best editors out there—highly recommend him with exceptional editing skills. I highly recommend him to others!"
                </p>
              </div>
            </div>

            {/* Review 3 */}
            <div className="relative p-8 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between group hover:border-peach/20 transition-colors duration-500 shadow-xl">
              <span className="absolute top-6 right-6 font-mono text-[9px] bg-sky-500/10 text-sky-400 px-3 py-1 rounded-full uppercase">✓ Verified</span>
              <div className="mt-6">
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src="https://yt3.googleusercontent.com/GMIVEOx9OdNLr1AnskheSNzjg3HS6hpf6O9-OJMcpxx-gf0kJHHJ0HdlQfLzmGIIyy1-L5LW9Q=s240-c-k-c0x00ffffff-no-rj" 
                    alt="Buried Earth" 
                    className="w-12 h-12 rounded-full border border-peach object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="flex flex-col text-left">
                    <span className="font-heading text-lg text-cream">Buried Earth</span>
                    <span className="font-mono text-xs text-white/40">28K Subscribers</span>
                  </div>
                </div>
                <p className="font-body text-sm leading-relaxed text-white/60 italic text-left">
                  "Adi is a great Editor, worked together for a long time."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
         F. HORIZONTAL COMMENTS TRACK (MARQUEE)
         ========================================================================== */}
      <section className="relative w-full py-16 bg-dark border-t border-b border-white/10 overflow-hidden">
        <div className="engagement-marquee-container">
          <div className="marquee-track flex gap-8 whitespace-nowrap">
            <div className="flex gap-8 items-center">
              <div className="comment-bubble bg-white/[0.02] border border-white/5 px-8 py-4 rounded-full flex gap-3 items-center">
                <span className="font-mono text-xs text-peach">@anidiotontheinternet8751</span>
                <span className="font-body text-sm text-cream opacity-80">yo the editing on this is 🔥 Do you mind letting me know what you edit on?</span>
              </div>
              <div className="comment-bubble bg-white/[0.02] border border-white/5 px-8 py-4 rounded-full flex gap-3 items-center">
                <span className="font-mono text-xs text-peach">@yoimbeamed</span>
                <span className="font-body text-sm text-cream opacity-80">your editing skills are crazy good</span>
              </div>
              <div className="comment-bubble bg-white/[0.02] border border-white/5 px-8 py-4 rounded-full flex gap-3 items-center">
                <span className="font-mono text-xs text-peach">@seancourtney3680</span>
                <span className="font-body text-sm text-cream opacity-80">I'm impressed by the high level of editing, you deserve a lot more subscribers</span>
              </div>
              <div className="comment-bubble bg-white/[0.02] border border-white/5 px-8 py-4 rounded-full flex gap-3 items-center">
                <span className="font-mono text-xs text-peach">@dhirajchapke1296</span>
                <span className="font-body text-sm text-cream opacity-80">Who edits his video man</span>
              </div>
              <div className="comment-bubble bg-white/[0.02] border border-white/5 px-8 py-4 rounded-full flex gap-3 items-center">
                <span className="font-mono text-xs text-peach">@Slowbenson</span>
                <span className="font-body text-sm text-cream opacity-80">the editing is awesome! Keep it up</span>
              </div>
            </div>
            {/* Duplicate track for seamless infinite marquee loop */}
            <div className="flex gap-8 items-center" aria-hidden="true">
              <div className="comment-bubble bg-white/[0.02] border border-white/5 px-8 py-4 rounded-full flex gap-3 items-center">
                <span className="font-mono text-xs text-peach">@anidiotontheinternet8751</span>
                <span className="font-body text-sm text-cream opacity-80">yo the editing on this is 🔥 Do you mind letting me know what you edit on?</span>
              </div>
              <div className="comment-bubble bg-white/[0.02] border border-white/5 px-8 py-4 rounded-full flex gap-3 items-center">
                <span className="font-mono text-xs text-peach">@yoimbeamed</span>
                <span className="font-body text-sm text-cream opacity-80">your editing skills are crazy good</span>
              </div>
              <div className="comment-bubble bg-white/[0.02] border border-white/5 px-8 py-4 rounded-full flex gap-3 items-center">
                <span className="font-mono text-xs text-peach">@seancourtney3680</span>
                <span className="font-body text-sm text-cream opacity-80">I'm impressed by the high level of editing, you deserve a lot more subscribers</span>
              </div>
              <div className="comment-bubble bg-white/[0.02] border border-white/5 px-8 py-4 rounded-full flex gap-3 items-center">
                <span className="font-mono text-xs text-peach">@dhirajchapke1296</span>
                <span className="font-body text-sm text-cream opacity-80">Who edits his video man</span>
              </div>
              <div className="comment-bubble bg-white/[0.02] border border-white/5 px-8 py-4 rounded-full flex gap-3 items-center">
                <span className="font-mono text-xs text-peach">@Slowbenson</span>
                <span className="font-body text-sm text-cream opacity-80">the editing is awesome! Keep it up</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
         G. CALL TO ACTION & FOOTER
         ========================================================================== */}
      <section id="contact" className="relative w-full py-32 px-[5%] bg-dark/95 text-cream flex flex-col items-center">
        <div className="w-full max-w-5xl text-center flex flex-col items-center">
          
          <h2 className="font-heading text-4xl md:text-7xl uppercase tracking-tighter leading-none mb-4 max-w-3xl">
            Let’s build something people remember
          </h2>
          <p className="font-mono text-xs uppercase tracking-widest text-peach mb-12">
            Ready to position your channels within the top 1%?
          </p>

          <Magnetic strength={0.25}>
            <a
              href="#"
              onClick={handleEmailCopy}
              onMouseEnter={() => {
                setCursorText("Copy");
                setCursorHovered(true);
              }}
              onMouseLeave={() => {
                setCursorHovered(false);
              }}
              className="group relative flex flex-col items-center justify-center p-12 border border-white/10 rounded-3xl bg-white/[0.01] hover:bg-peach/10 hover:border-peach/30 transition-all duration-500 max-w-xl shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full border border-white/20 flex justify-center items-center mb-6 group-hover:bg-peach group-hover:border-peach group-hover:scale-110 transition-all duration-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-cream group-hover:text-dark -rotate-45 group-hover:rotate-0 transition-all duration-500">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </div>
              
              <h3 className="font-heading text-2xl uppercase tracking-tighter mb-2">Get In Touch</h3>
              <p className="font-mono text-sm tracking-wider text-peach group-hover:text-cream transition-colors duration-300">
                adityamedia317@gmail.com
              </p>
            </a>
          </Magnetic>
        </div>

        {/* Footer info mapping links */}
        <div className="w-full max-w-5xl mt-32 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 font-mono text-xs uppercase">
          <div className="flex gap-12 text-left">
            <div className="flex flex-col">
              <span className="text-white/30 mb-3 tracking-wider">Capabilities:</span>
              <span className="opacity-80">Adobe Premiere</span>
              <span className="opacity-80 mt-1">After Effects</span>
              <span className="opacity-80 mt-1">DaVinci Resolve</span>
              <span className="opacity-80 mt-1">Framer Motion</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-white/30 mb-3 tracking-wider">Social:</span>
              <a href="https://linkedin.com" target="_blank" className="hover:text-peach transition-colors">Linkedin</a>
              <a href="https://x.com" target="_blank" className="hover:text-peach mt-1 transition-colors">Twitter / X</a>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-heading text-lg">AJcreatives</span>
            <span className="text-electric">●</span>
            <span className="opacity-50">Creative Video Editor © 2026</span>
          </div>
        </div>
      </section>

      {/* Cinematic YouTube Video Lightbox Modal */}
      <AnimatePresence>
        {activeVideoId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8 cursor-none"
            onClick={() => setActiveVideoId(null)}
          >
            {/* Close Button cursor wrapper */}
            <div 
              onMouseEnter={() => { setCursorText("Close"); setCursorHovered(true); }}
              onMouseLeave={() => setCursorHovered(false)}
              className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors p-3 bg-white/5 rounded-full border border-white/10 cursor-none"
              onClick={(e) => { e.stopPropagation(); setActiveVideoId(null); }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            
            {/* Responsive Iframe Container */}
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 150 }}
              className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0`}
                title="YouTube Video Player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              ></iframe>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Render the application to the root container
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);