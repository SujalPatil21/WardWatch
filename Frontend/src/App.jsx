import React, { useEffect, useState } from 'react';
import './index.css';

// Hook to detect when an element enters the viewport vertically
function useInView(options = {}) {
  const [ref, setRef] = useState(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
      } else if (entry.boundingClientRect.y > 0) {
        setInView(false);
      }
    }, { threshold: 0.4, ...options });
    
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, options]);

  return [setRef, inView];
}

export default function App() {
  const [scrollY, setScrollY] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);

  // Exact Native Scroll Tracking
  useEffect(() => {
    let animationFrame;
    const onScroll = () => {
      animationFrame = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    setScrollY(window.scrollY);
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  
  // Progressive Transition Logic mapped strictly to Scroll Position
  const progress = Math.max(0, scrollY / windowHeight); 
  
  // SLIDE 1 (0 -> 1): 0 to 0.45 opacity, 0 to 10px blur
  // SLIDE 2 -> 3 (1 -> 2): 0.45 to 0.6 opacity, 10 to 12px global blur
  let overlayOpacity = 0;
  let overlayBlur = 0;

  if (progress <= 1) {
    overlayOpacity = progress * 0.45;
    overlayBlur = progress * 10;
  } else {
    const p2 = Math.min((progress - 1), 1);
    overlayOpacity = 0.45 + (p2 * 0.15); // max 0.6
    overlayBlur = 10 + (p2 * 2); // max 12
  }

  // Observers for animating content entry
  const [brandRef, brandInView] = useInView({ threshold: 0.5 });
  const [loginRef, loginInView] = useInView({ threshold: 0.3 });

  return (
    <div className="relative w-full bg-[#0a0f1d] text-white selection:bg-[color:var(--color-teal)] selection:text-white">
      
      {/* 🔴 FIXED BACKGROUND VIDEO LAYER */}
      {/* Pure video. No initial darkening. Full Brightness. */}
      <div className="fixed top-0 left-0 w-full h-[100vh] pointer-events-none z-0">
         <video 
            src="/animation.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={(e) => {
              e.target.currentTime = 5;
              e.target.play();
            }}
            className="w-full h-full object-cover"
         />
      </div>

      {/* 🔴 DYNAMIC OVERLAY LAYER */}
      {/* Generates Depth. Fades and blurs dynamically via explicit scroll tracking. */}
      <div 
         className="fixed top-0 left-0 w-full h-[100vh] pointer-events-none z-0 bg-[#0f1423]"
         style={{ 
            opacity: overlayOpacity,
            backdropFilter: `blur(${overlayBlur}px)`,
            WebkitBackdropFilter: `blur(${overlayBlur}px)`
         }}
      />

      {/* 🔹 SCROLLING CONTENT STACK */}
      <main className="relative w-full z-10">

        {/* SECTION 1 — HERO (Pure Cinematic Video) */}
        <section className="w-full h-[100vh] flex flex-col items-center justify-end pb-[10vh]">
           {/* Section is entirely transparent to let the full brightness video shine. */}
        </section>

        {/* SECTION 2 — BRAND REVEAL */}
        <section ref={brandRef} className="w-full h-[100vh] flex items-center justify-center relative">
           {/* Title Section Fix: Subtle dark radial gradient behind text to anchor the layer in 3D space */}
           <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(10,15,29,0.7)_0%,transparent_60%)] transition-opacity duration-[1s] ease-apple ${brandInView ? 'opacity-100' : 'opacity-0'}`} />

           <h1 className="text-[14vw] md:text-[9vw] font-bold tracking-tighter flex items-center justify-center -space-x-[1vw] relative z-10">
              <span className={`text-white drop-shadow-[0_15px_40px_rgba(0,0,0,0.8)] transition-all duration-[1.2s] ease-apple will-change-transform
                           ${brandInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
                 WardWa
              </span>
              
              <span 
                 className={`inline-block bg-clip-text text-transparent bg-gradient-to-br from-[color:var(--color-teal)] to-[color:var(--color-purple-light)] transition-all duration-[1.5s] ease-apple delay-150 will-change-transform drop-shadow-[0_15px_30px_rgba(61,189,170,0.2)]
                            ${brandInView ? 'opacity-100 -translate-y-[0.8rem] md:-translate-y-[1.2rem]' : 'opacity-0 translate-y-16'}`}
              >
                 tch
              </span>
           </h1>
        </section>

        {/* SECTION 3 — LOGIN PANEL */}
        <section ref={loginRef} className="w-full h-[100vh] flex items-center justify-center px-6 relative">
           {/* Very faint ambient glow to integrate the bottom UI layer conceptually */}
           <div className={`absolute inset-0 bg-gradient-to-t from-[#0a0f1d] via-transparent to-transparent transition-opacity duration-1000 ${loginInView ? 'opacity-100' : 'opacity-0'}`} />

           <div className={`w-full max-w-md transition-all duration-[1s] ease-apple delay-100 will-change-transform relative z-10
                        ${loginInView ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-16 scale-[0.98]'}`}>
              <LoginPanel />
           </div>
        </section>

      </main>
    </div>
  );
}

// Extracted Glassmorphism Login Component
function LoginPanel() {
  const [role, setRole] = useState('admin');
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    const endpoint = isRegistering ? '/auth/register' : '/auth/login';

    try {
      const res = await fetch(endpoint, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ role, username, password })
      });
      
      const data = await res.json().catch(() => null);

      if (!res.ok) {
         throw new Error(data?.message || (isRegistering ? 'Registration failed' : 'Invalid credentials'));
      }
      
      if (isRegistering) {
         setSuccess('Registration successful. Please log in.');
         setIsRegistering(false);
         setLoading(false);
      } else {
         window.location.href = '/corridor'; // Proceed to next page on success
      }

    } catch (err) {
      setLoading(false);
      // Fallback for demo purposes if backend isn't actively running
      if (err.message.includes('Failed to fetch') || err.message.includes('JSON')) {
          if (!isRegistering) {
             alert(`Simulated Login Success for [ ${role.toUpperCase()} ]\nRouting to internal environment.`);
             // window.location.href = '/corridor';
          }
      } else {
        setError(err.message || 'System error. Please verify input.');
      }
    }
  };

  return (
    <div 
      className="p-8 md:p-10 rounded-3xl relative overflow-hidden group transition-all duration-500"
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(20, 25, 45, 0.75)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        fontFamily: "'Inter', 'Poppins', sans-serif"
      }}
    >
        
        {/* Soft UI environmental glow matching animation teal/purple tones directly */}
        <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--color-teal)]/10 to-[color:var(--color-purple-dark)]/10 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-[1.5s] ease-out" />

        {/* Centered Header Layout */}
        <div className="mb-8 opacity-100 relative z-10 text-center">
           <div className="text-[color:var(--color-teal)] text-3xl mb-1 drop-shadow-[0_0_15px_var(--color-teal-glow)]">+</div>
           <h2 className="text-2xl font-semibold tracking-tight text-[#ffffff] drop-shadow-md">
              {isRegistering ? 'System Registration' : 'System Access'}
           </h2>
           <p className="text-[10px] text-[color:var(--color-purple-light)] mt-2 font-medium tracking-[0.2em] uppercase opacity-80">
              Identity Verification
           </p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5 mb-6 relative z-10 backdrop-blur-md">
           <div 
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white/10 rounded-lg shadow-sm border border-[color:var(--color-teal)]/20 transition-transform duration-500 ease-apple pointer-events-none ${role === 'staff' ? 'translate-x-full left-[2px]' : 'translate-x-0 left-1.5'}`} 
           />
           {['admin', 'staff'].map((r) => (
              <button
                 key={r}
                 type="button"
                 onClick={() => {
                   setRole(r);
                   if (r === 'admin') setIsRegistering(false);
                   setError('');
                   setSuccess('');
                 }}
                 className={`flex-1 py-3 text-[11px] font-semibold tracking-[0.15em] uppercase rounded-lg transition-colors duration-300 relative z-10 ${role === r ? 'text-[#ffffff] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]' : 'text-white/40 hover:text-white/80'}`}
              >
                 {r}
              </button>
           ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
           <div className="space-y-1.5 relative text-left">
             <label className="text-[11px] font-medium tracking-wider" style={{ color: 'rgba(255,255,255,0.7)' }}>Terminal ID</label>
             <input 
                 type="text" 
                 value={username}
                 onChange={e => setUsername(e.target.value)}
                 className="w-full rounded-xl px-4 py-3.5 text-sm placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[color:var(--color-teal)]/60 transition-all duration-300 shadow-inner ease-apple backdrop-blur-md"
                 style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff' }}
                 placeholder="Enter username"
                 required
             />
           </div>

           <div className="space-y-1.5 relative text-left">
             <label className="text-[11px] font-medium tracking-wider" style={{ color: 'rgba(255,255,255,0.7)' }}>Access Code</label>
             <input 
                 type="password" 
                 value={password}
                 onChange={e => setPassword(e.target.value)}
                 className="w-full rounded-xl px-4 py-3.5 text-sm placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[color:var(--color-teal)]/60 transition-all duration-300 shadow-inner ease-apple backdrop-blur-md"
                 style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff' }}
                 placeholder="Enter password"
                 required
             />
           </div>

           {error && (
             <div className="text-[11px] text-red-400 font-medium tracking-wide pt-1 text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
               {error}
             </div>
           )}
           {success && (
             <div className="text-[11px] text-[color:var(--color-teal)] font-medium tracking-wide pt-1 text-center bg-[color:var(--color-teal)]/10 py-2 rounded-lg border border-[color:var(--color-teal)]/20">
               {success}
             </div>
           )}

           <div className="pt-4">
              <button 
                 type="submit"
                 disabled={loading}
                 className="w-full relative group/btn overflow-hidden bg-gradient-to-r from-[color:var(--color-teal)] to-[color:var(--color-purple-light)] text-[#ffffff] font-bold tracking-widest text-[11px] py-4 rounded-xl transition-all duration-500 ease-apple disabled:opacity-50 hover:shadow-[0_0_20px_var(--color-teal-glow)] hover:scale-[1.02] border border-white/20"
              >
                 <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] uppercase">
                    {loading ? 'Processing...' : (isRegistering ? 'Register Access' : 'Secure Login')}
                 </span>
                 <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 pointer-events-none bg-white/20" />
              </button>
           </div>
        </form>

        {/* Request Access Link (Hidden entirely for Admin) */}
        <div className={`text-center transition-all duration-500 overflow-hidden ${role === 'admin' ? 'opacity-0 h-0 pt-0' : 'opacity-100 pt-6 pb-1 relative z-10'}`}>
           <button 
              type="button"
              onClick={() => {
                 setIsRegistering(!isRegistering);
                 setError('');
                 setSuccess('');
              }}
              className="text-[11px] font-medium text-white/70 hover:text-[color:var(--color-teal)] transition-colors duration-[0.6s] uppercase tracking-widest inline-block group/link"
           >
              {isRegistering ? 'Return to Login' : 'Request Access'}
              <div className="h-[1px] w-0 bg-[color:var(--color-teal)] group-hover/link:w-full transition-all duration-500 ease-apple mt-1" />
           </button>
        </div>

    </div>
  );
}
