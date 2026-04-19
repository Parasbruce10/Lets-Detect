const { useState, useEffect, useRef, useCallback } = React;

// ============================================================
// TESSERACT.JS — Auto-loaded from CDN (no import needed)
// ============================================================
const loadTesseract = () => new Promise((resolve, reject) => {
    if (window.Tesseract) return resolve(window.Tesseract);
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.onload = () => resolve(window.Tesseract);
    script.onerror = () => reject(new Error('Failed to load Tesseract.js. Please check your internet connection.'));
    document.head.appendChild(script);
});

const EyeOpenSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.67 8.243 7.484 6 12 6c4.516 0 8.33 2.243 9.964 5.678a1.012 1.012 0 010 .644C20.33 15.757 16.516 18 12 18c-4.516 0-8.33-2.243-9.964-5.678z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`;
const EyeSlashSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.822 7.822L21 21m-2.278-2.278L15.07 15.07m-5.14-5.14l-2.07-2.07M10.5 10.5a3.5 3.5 0 115 5l-5-5z" /></svg>`;

const API_BASE_URL = "https://hamzaparas-lets-detect.hf.space/api";

const safe = (val, fallback = 'N/A') => {
    if (val === null || val === undefined || val === '') return fallback;
    return val;
};
const safeNum = (val, fallback = 0) => {
    const n = Number(val);
    return isNaN(n) ? fallback : n;
};

// ============================================================
// SMART VISUAL DETECTOR — Maps search terms to emoji + gradient
// ============================================================
const getSearchVisual = (term) => {
    const t = (term || '').toLowerCase();
    if (t.match(/politic|govt|government|minister|parliament|election|vote|modi|imran|nawaz|biden|trump|president|pm |chief/)) return { emoji: '🏛️', gradient: 'from-blue-600 to-indigo-700' };
    if (t.match(/cricket|icc|pcb|match|world cup|t20|odi|football|fifa|sport|player|goal|league|team|champion/)) return { emoji: '🏏', gradient: 'from-green-500 to-emerald-700' };
    if (t.match(/health|covid|virus|hospital|doctor|medical|disease|vaccine|who|death|patient|medicine|cancer/)) return { emoji: '🏥', gradient: 'from-red-500 to-rose-700' };
    if (t.match(/tech|ai |artificial|software|google|apple|microsoft|computer|phone|digital|robot|chatgpt|openai|hack|app|internet/)) return { emoji: '💻', gradient: 'from-cyan-500 to-blue-700' };
    if (t.match(/army|military|war|attack|bomb|missile|drone|terror|soldier|weapon|defense|navy|force|kill/)) return { emoji: '⚔️', gradient: 'from-slate-600 to-slate-900' };
    if (t.match(/weather|rain|flood|earthquake|storm|climate|temperature|heat|cold|cyclone|drought/)) return { emoji: '🌦️', gradient: 'from-sky-400 to-blue-600' };
    if (t.match(/crime|police|murder|arrest|theft|court|jail|prison|law|judge|case|suspect|accused/)) return { emoji: '🚨', gradient: 'from-red-600 to-red-900' };
    if (t.match(/school|university|education|student|exam|teacher|degree|college|board|result/)) return { emoji: '📚', gradient: 'from-amber-500 to-orange-700' };
    if (t.match(/money|economy|bank|dollar|rupee|stock|market|business|trade|tax|gdp|inflation|price|loan/)) return { emoji: '💰', gradient: 'from-yellow-500 to-amber-700' };
    if (t.match(/movie|film|drama|actor|actress|bollywood|hollywood|lollywood|song|music|singer|album|concert/)) return { emoji: '🎬', gradient: 'from-purple-500 to-pink-700' };
    if (t.match(/science|space|nasa|research|study|discover|planet|mars|moon|satellite|lab/)) return { emoji: '🔬', gradient: 'from-violet-500 to-purple-800' };
    if (t.match(/food|restaurant|recipe|cook|eat|meal|diet|kitchen/)) return { emoji: '🍽️', gradient: 'from-orange-400 to-red-600' };
    if (t.match(/islam|muslim|mosque|temple|church|hindu|christian|prayer|eid|ramadan|christmas|religion/)) return { emoji: '🕌', gradient: 'from-emerald-500 to-teal-800' };
    if (t.match(/travel|tour|flight|airport|hotel|visa|passport|country|visit|trip/)) return { emoji: '✈️', gradient: 'from-sky-500 to-indigo-600' };
    if (t.match(/fake|scam|fraud|hoax|rumor|misinformation|lie|false|deepfake/)) return { emoji: '🚫', gradient: 'from-red-500 to-orange-600' };
    if (t.match(/news|breaking|headline|report|media|press|journalist|anchor/)) return { emoji: '📰', gradient: 'from-slate-500 to-slate-800' };
    if (t.match(/pakistan|india|china|america|russia|iran|afghanistan|kashmir|palestine|israel/)) return { emoji: '🌍', gradient: 'from-teal-500 to-cyan-700' };
    return { emoji: '🔍', gradient: 'from-blue-500 to-blue-700' };
};
// ============================================================
// SOURCE NAME BADGE COMPONENT
// ============================================================
const SourceNameBadges = ({ names = [], isDark }) => {
    if (!names || names.length === 0) return null;
    const getBadgeStyle = (name) => {
        const n = name.toLowerCase();
        if (n.includes('dawn') || n.includes('geo') || n.includes('ary') || n.includes('dunya') || n.includes('express') || n.includes('samaa') || n.includes('bol') || n.includes('nation'))
            return isDark ? { background: '#1e3a5f', color: '#60a5fa', border: '1px solid #2563eb' } : { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' };
        if (n.includes('bbc') || n.includes('reuters') || n.includes('ap') || n.includes('cnn') || n.includes('guardian') || n.includes('nytimes') || n.includes('washington') || n.includes('al jazeera'))
            return isDark ? { background: '#1e1b4b', color: '#a5b4fc', border: '1px solid #4f46e5' } : { background: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' };
        if (n.includes('factcheck') || n.includes('snopes') || n.includes('politifact') || n.includes('soch') || n.includes('boom') || n.includes('altnews') || n.includes('google'))
            return isDark ? { background: '#052e16', color: '#4ade80', border: '1px solid #16a34a' } : { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' };
        if (n.includes('icc') || n.includes('cricket') || n.includes('pcb') || n.includes('fifa') || n.includes('olympics') || n.includes('who') || n.includes('united nations') || n.includes('world bank') || n.includes('imf') || n.includes('cdc') || n.includes('nih') || n.includes('government') || n.includes('ministry') || n.includes('state bank'))
            return isDark ? { background: '#2e1065', color: '#c4b5fd', border: '1px solid #7c3aed' } : { background: '#faf5ff', color: '#6d28d9', border: '1px solid #ddd6fe' };
        if (n.includes('wikipedia'))
            return isDark ? { background: '#1c1917', color: '#a8a29e', border: '1px solid #57534e' } : { background: '#fafaf9', color: '#44403c', border: '1px solid #d6d3d1' };
        return isDark ? { background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' } : { background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' };
    };
    return (
        <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: isDark ? '#64748b' : '#94a3b8', flexShrink: 0 }}>Sources:</span>
            {names.map((name, i) => (
                <span key={i} style={{ ...getBadgeStyle(name), fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '9px' }}>&#9679;</span>{name}
                </span>
            ))}
        </div>
    );
};

// ============================================================
// TESSERACT.JS OCR — Auto-loaded from CDN, no API key needed
// Supports both English and Urdu
// ============================================================
const extractTextFromImage = async (file, onProgress) => {
    const Tess = await loadTesseract();
    const imageUrl = URL.createObjectURL(file);
    try {
        const result = await Tess.recognize(imageUrl, 'eng+urd', {
            logger: (m) => {
                if (m.status === 'recognizing text' && onProgress) {
                    onProgress(Math.round(m.progress * 100));
                }
            }
        });
        URL.revokeObjectURL(imageUrl);
        const text = result.data.text?.trim() || '';
        return text || null;
    } catch (err) {
        URL.revokeObjectURL(imageUrl);
        throw err;
    }
};
const Footer = ({ isDark }) => (
    <footer className={`ld-footer ${isDark ? 'text-white' : 'text-slate-900'}`}>
        <div className="footer-brand">
            Lets <span>Detect</span>
        </div>
        <p className="footer-credit">
            Created with <span>❤</span> by Paras
        </p>
        <div className="footer-copyright">
            © {new Date().getFullYear()} All Rights Reserved
        </div>
    </footer>
);

const PrivacyPolicyPage = () => (
    <div className="max-w-6xl mx-auto px-6 py-24 min-h-screen relative overflow-hidden">
        {/* Modern Aura Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 opacity-20 pointer-events-none">
            <div className="w-[800px] h-[400px] bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full blur-[140px]"></div>
        </div>
        
        {/* Main Header */}
        <div className="text-center mb-28">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white shadow-sm border border-slate-100 rounded-2xl mb-8">
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse delay-150"></div>
                </div>
                <span className="text-slate-900 text-[11px] font-black tracking-[0.25em] uppercase">
                    Security Standard v4.2.0
                </span>
            </div>
            <h1 className="text-8xl font-black text-slate-900 mb-8 tracking-tighter leading-none">
                Privacy <span className="text-blue-600">Policy</span>
            </h1>
            <p className="text-slate-500 font-medium text-2xl max-w-4xl mx-auto leading-relaxed">
                At Lets Detect, our forensic framework is built on the principle of absolute privacy. 
                We don't just detect fake news; we protect your digital footprint.
            </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
            {/* Clause 1: Engine Logic */}
            <div className="md:col-span-2 bg-white/60 backdrop-blur-3xl p-12 rounded-[4rem] border border-white shadow-xl shadow-slate-200/50 group transition-all duration-500 hover:shadow-2xl">
                <h3 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">The 8-Layer Safeguard</h3>
                <div className="space-y-6 text-slate-600 text-lg leading-relaxed font-medium">
                    <p>
                        Our proprietary <strong>8-Layer AI Engine</strong> processes information across multiple forensic dimensions including Semantic Coherence, Pattern Recognition, and Source Identification. 
                    </p>
                    <p>
                        Every query submitted—whether text-based or extracted via <strong>Tesseract OCR</strong> from images—is held in a temporary state. Our system is designed to analyze and then immediately discard raw content after the verification report is generated.
                    </p>
                </div>
            </div>

            {/* Clause 2: Authentication Privacy */}
            <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl flex flex-col justify-between group hover:scale-[1.02] transition-transform duration-500">
                <div>
                    <h3 className="text-3xl font-black mb-6 tracking-tight">Access Security</h3>
                    <p className="opacity-70 leading-relaxed text-lg font-medium">
                        User authentication is managed via encrypted <strong>OTP verification</strong>. Your email is used strictly for account security and forensic history access, protected by high-level SMTP encryption protocols.
                    </p>
                </div>
                <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    </div>
                    <span className="text-[10px] font-black tracking-widest uppercase">AES-256 Encrypted</span>
                </div>
            </div>

            {/* Clause 3: Regional Dialects */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-12 rounded-[4rem] border border-blue-100 group transition-all duration-500 hover:bg-white hover:shadow-xl">
                <h3 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Linguistic Privacy</h3>
                <p className="text-slate-600 leading-relaxed text-lg font-medium">
                    Specialized in <strong>Urdu and Regional dialects</strong>, our engine uses localized data models. Feedback submitted to improve accuracy is <strong>fully anonymized</strong> and stripped of all metadata before being recorded in our forensic database.
                </p>
            </div>

            {/* Clause 4: Transience Policy (Added to fill the grid beautifully) */}
            <div className="md:col-span-2 bg-white/40 backdrop-blur-md p-12 rounded-[4rem] border border-slate-100 flex flex-col md:flex-row items-center gap-10">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center shrink-0">
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </div>
                <div>
                    <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Transient Data Protocol</h3>
                   <p className="text-slate-900 dark:text-white text-lg font-medium leading-relaxed">
    We maintain a strict <strong>zero-persistence</strong> policy. Beyond essential account metadata, no original text or image data is stored on our servers post-analysis.
</p>
                </div>
            </div>
        </div>

        {/* Legal Footer Section */}
        <div className="mt-32 pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
            <div className="flex flex-wrap justify-center gap-6 text-slate-400 font-black text-[10px] tracking-[0.3em] uppercase">
                <span>SQLite Secured</span>
                <span>•</span>
                <span>Tesseract Certified</span>
                <span>•</span>
                <span>No Third-Party Cookies</span>
            </div>
            <p className="text-slate-400 font-bold text-sm tracking-tight">
                © 2026 Lets Detect Security Labs. Forensic Transparency.
            </p>
        </div>
    </div>
);

const TermsConditionsPage = ({ onContactClick }) => (
    <div className="max-w-5xl mx-auto px-6 py-20 min-h-screen relative overflow-hidden">
        {/* Background Blur Elements for Depth */}
        <div className="absolute top-0 right-0 -z-10 w-64 h-64 bg-blue-100 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-0 left-0 -z-10 w-64 h-64 bg-indigo-100 rounded-full blur-[120px] opacity-60"></div>

        <div className="text-center mb-20">
            <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block shadow-sm border border-blue-100">
                Legal Framework
            </span>
            <h1 className="text-6xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter">
                Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Standards</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">
                Read our terms carefully to understand how we maintain a secure and reliable platform for digital forensic analysis.
            </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            {/* Card 1 */}
            <div className="group bg-white/40 backdrop-blur-xl p-10 rounded-[3.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/80 transition-all duration-500 hover:-translate-y-2">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl rotate-3 flex items-center justify-center text-white text-2xl font-black mb-8 group-hover:rotate-0 transition-transform">
                    01
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">Acceptance</h3>
                <p className="text-slate-600 leading-relaxed font-medium opacity-80">
                    By accessing Lets Detect, you acknowledge that you have read and understood our high-standard security protocols.
                </p>
            </div>

            {/* Card 2 */}
            <div className="group bg-white/40 backdrop-blur-xl p-10 rounded-[3.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/80 transition-all duration-500 hover:-translate-y-2">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl -rotate-3 flex items-center justify-center text-white text-2xl font-black mb-8 group-hover:rotate-0 transition-transform">
                    02
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">Usage Limits</h3>
                <p className="text-slate-600 leading-relaxed font-medium opacity-80">
                    Our OCR engine is designed for media authenticity. Commercial scraping or reverse-engineering our logic is strictly prohibited.
                </p>
            </div>

            {/* Card 3 */}
            <div className="group bg-white/40 backdrop-blur-xl p-10 rounded-[3.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/80 transition-all duration-500 hover:-translate-y-2">
                <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl rotate-6 flex items-center justify-center text-white text-2xl font-black mb-8 group-hover:rotate-0 transition-transform">
                    03
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">Liability</h3>
                <p className="text-slate-600 leading-relaxed font-medium opacity-80">
                    Analysis results are supportive evidence. We provide the tools, but the final interpretation rests with the user's judgment.
                </p>
            </div>

            {/* Card 4 */}
            <div className="group bg-white/40 backdrop-blur-xl p-10 rounded-[3.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/80 transition-all duration-500 hover:-translate-y-2">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl -rotate-6 flex items-center justify-center text-white text-2xl font-black mb-8 group-hover:rotate-0 transition-transform">
                    04
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">Privacy</h3>
                <p className="text-slate-600 leading-relaxed font-medium opacity-80">
                    Your files are your own. We use volatile memory for processing, ensuring that no traces remain after your session ends.
                </p>
            </div>
        </div>

        {/* Floating Contact Banner */}
        <div className="mt-20 relative p-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-[3rem] overflow-hidden">
            <div className="bg-slate-950 rounded-[2.9rem] p-12 text-center">
                <h3 className="text-3xl font-black text-white mb-4 italic tracking-tighter">Need more clarity?</h3>
                <p className="text-slate-400 mb-8 max-w-lg mx-auto font-medium">If you have specific questions about our legal framework, our team is ready to help.</p>
                <button onClick={onContactClick} className="px-10 py-4 bg-white text-slate-950 font-black rounded-2xl hover:bg-blue-500 hover:text-white transition-all transform hover:scale-105 shadow-xl">
                    Contact Us
                </button>
            </div>
        </div>
    </div>
);

const AboutPage = () => (
    <div className="max-w-6xl mx-auto px-6 py-24 min-h-screen relative overflow-hidden">
        {/* Modern Aura Background (Same as Privacy Policy) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 opacity-20 pointer-events-none">
            <div className="w-[800px] h-[400px] bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full blur-[140px]"></div>
        </div>
        
        {/* Main Header */}
        <div className="text-center mb-28">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white shadow-sm border border-slate-100 rounded-2xl mb-8">
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse delay-150"></div>
                </div>
                <span className="text-slate-900 text-[11px] font-black tracking-[0.25em] uppercase">
                    Our Story & Vision
                </span>
            </div>
            <h1 className="text-8xl font-black text-slate-900 mb-8 tracking-tighter leading-none">
                About <span className="text-blue-600">Us</span>
            </h1>
            <p className="text-slate-500 font-medium text-2xl max-w-4xl mx-auto leading-relaxed">
                We are on a mission to combat misinformation, fake news, and deepfakes using advanced forensic analysis and intelligent algorithms.
            </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1: Our Mission */}
            <div className="md:col-span-2 bg-white/60 backdrop-blur-3xl p-12 rounded-[4rem] border border-white shadow-xl shadow-slate-200/50 group transition-all duration-500 hover:shadow-2xl">
                <h3 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Our Mission</h3>
                <div className="space-y-6 text-slate-600 text-lg leading-relaxed font-medium">
                    <p>
                        In an era of digital manipulation, distinguishing truth from fabrication is harder than ever. <strong>Lets Detect</strong> was built to empower individuals and organizations with the tools they need to verify content instantly.
                    </p>
                    <p>
                        Whether it's an edited screenshot, a misleading headline, or sophisticated propaganda, our goal is to bring transparency back to the internet and protect digital integrity.
                    </p>
                </div>
            </div>

            {/* Card 2: Technology */}
            <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl flex flex-col justify-between group hover:scale-[1.02] transition-transform duration-500">
                <div>
                    <h3 className="text-3xl font-black mb-6 tracking-tight">The Technology</h3>
                    <p className="opacity-70 leading-relaxed text-lg font-medium">
                        Powered by our proprietary <strong>8-Layer AI Engine</strong> and intelligent <strong>OCR technology</strong>, we extract, analyze, and cross-reference data against reliable sources globally.
                    </p>
                </div>
                <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <span className="text-[10px] font-black tracking-widest uppercase">Lightning Fast</span>
                </div>
            </div>
        </div>
    </div>
);

const App = () => {
    // Restore saved login session from localStorage
    const savedSession = (() => {
        try { return JSON.parse(localStorage.getItem('fc_session')) || {}; } catch { return {}; }
    })();
    const [page, setPage] = useState(() => {
        if (new URLSearchParams(window.location.search).get('sent') === 'true') return 'success';
        return savedSession.loggedIn ? 'search' : 'home';
    });
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDark, setIsDark] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showUploadMenu, setShowUploadMenu] = useState(false);
    const [analyzeInput, setAnalyzeInput] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(!!savedSession.loggedIn);
    const [userEmail, setUserEmail] = useState(savedSession.email || '');
    const [userPass, setUserPass] = useState('');
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPass, setRegPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [registerOtp, setRegisterOtp] = useState('');
    const [forgotOtp, setForgotOtp] = useState('');
    const [forgotEmail, setForgotEmail] = useState('');
    const [newPass, setNewPass] = useState('');
    const [forgotStep, setForgotStep] = useState(1);
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    // OCR States
    const [isOcrRunning, setIsOcrRunning] = useState(false);
    const [ocrMsg, setOcrMsg] = useState('');      // success / progress
    const [ocrErr, setOcrErr] = useState('');       // error message

    const [scanResult, setScanResult] = useState({
        score: 0, verdict: 'UNVERIFIED', explanation: 'No analysis has been run yet.',
        detected_language: 'English', author_name: 'N/A', source_link: '#',
        confidence: 'N/A', advice: '', source_names: [],
        source_website: { name: 'N/A', url: '#', tier: 'unknown' }, analysis_layers: {}
    });
    // Typewriter States
    const [typewriterText, setTypewriterText] = useState('');
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeUserName, setActiveUserName] = useState(savedSession.name || '');
    const [showOtpScreen, setShowOtpScreen] = useState(false);
    const [error, setError] = useState('');
    const [recentSearches, setRecentSearches] = useState(() => {
        try { const s = localStorage.getItem('recentSearches'); return s ? JSON.parse(s) : []; } catch { return []; }
    });

    // Detect FormSubmit redirect — show success page
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('sent') === 'true') {
            setPage('success');
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const handleToggle = (inputId, btn) => {
        const input = document.getElementById(inputId);
        if (!input) return;
        if (input.type === 'password') { input.type = 'text'; btn.innerHTML = EyeOpenSVG; }
        else { input.type = 'password'; btn.innerHTML = EyeSlashSVG; }
    };

const showError = useCallback((msg) => {
    setError(msg);
    setTimeout(() => setError(''), 5000);
}, []);

    // Typewriter Effect Logic
    useEffect(() => {
        // Yeh effect sirf 'search' page par chalega
        if (page !== 'search') return; 

        const phrases = [
            "Welcome", 
            "What Would You Like To Verify Today?", 
            "Just Tell Me"
        ];
        const currentPhrase = phrases[phraseIndex];

        let timeout;

        if (isDeleting) {
            // Text delete hone ki speed (50ms)
            timeout = setTimeout(() => {
                setTypewriterText(currentPhrase.substring(0, typewriterText.length - 1));
                if (typewriterText.length === 0) {
                    setIsDeleting(false);
                    setPhraseIndex((prev) => (prev + 1) % phrases.length);
                }
            }, 50);
        } else {
            // Text type hone ki speed (100ms)
            timeout = setTimeout(() => {
                setTypewriterText(currentPhrase.substring(0, typewriterText.length + 1));
                
                // Jab poora sentence type ho jaye, toh 1.5 second wait karein phir delete karna shuru karein
                if (typewriterText.length === currentPhrase.length) {
                    timeout = setTimeout(() => setIsDeleting(true), 1500); 
                }
            }, 100);
        }

        return () => clearTimeout(timeout);
    }, [typewriterText, isDeleting, phraseIndex, page]);
    // ============================================================
    // OCR MAIN HANDLER — Tesseract.js (offline, no API key needed)
    // ============================================================
    const handleImageOcr = async (file) => {
        if (!file || !file.type.startsWith('image/')) {
            setSelectedFile(file);
            setShowUploadMenu(false);
            return;
        }

        setSelectedFile(file);
        setShowUploadMenu(false);
        setIsOcrRunning(true);
        setOcrMsg('🔍 Extracting text from image (0%)...');
        setOcrErr('');

        try {
            const extracted = await extractTextFromImage(file, (pct) => {
                setOcrMsg(`🔍 Extracting text... ${pct}%`);
            });
            if (extracted) {
                setAnalyzeInput(extracted);
                setOcrMsg('✅ Text extracted successfully! Click the Analyze button now.');
                setTimeout(() => setOcrMsg(''), 5000);
            } else {
                setOcrErr('⚠️ No readable text found in the image.');
                setTimeout(() => setOcrErr(''), 5000);
            }
        } catch (err) {
            let msg = '❌ OCR failed. Please try again.';
            const errMsg = err.message || '';
            if (errMsg.includes('network') || errMsg.includes('Failed to fetch'))
                msg = '❌ Network error. Failed to load Tesseract language data.';
            else if (errMsg.includes('Image') || errMsg.includes('load'))
                msg = '❌ Image file is corrupted. Please try a different image.';
            else
                msg = `❌ Error: ${errMsg.slice(0, 120) || 'Unknown error'}`;
            setOcrErr(msg);
            setTimeout(() => setOcrErr(''), 7000);
        } finally {
            setIsOcrRunning(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // Reset input so same file can be re-selected
        e.target.value = '';
        if (file.type.startsWith('image/')) handleImageOcr(file);
    };

    // ---- UPDATE PASSWORD ----
    const handleUpdatePassword = async () => {
        if (!newPass) return showError("Please enter a new password.");
        if (newPass.length < 6) return showError("Password must be at least 6 characters.");
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/update-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: userEmail, new_password: newPass }) });
            if (res.ok) { alert("Password updated successfully!"); setShowUpdateModal(false); setNewPass(''); }
            else { const d = await res.json(); showError(d.error || "Update failed."); }
        } catch { showError("Server error."); }
        setLoading(false);
    };

    // ---- FORGOT PASSWORD ----
    const handleForgotSendOtp = async () => {
        if (!forgotEmail) return showError("Please enter your email address.");
        setLoading(true);
        try {
            const c = await fetch(`${API_BASE_URL}/verify-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail }) });
            if (!c.ok) { showError("This email is not registered."); setLoading(false); return; }
            const r = await fetch(`${API_BASE_URL}/send-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail, name: 'PasswordReset', password: '__reset__', user_data: { name: 'PasswordReset', password: '__reset__' } }) });
            if (r.ok) { alert("OTP sent! Please check your inbox and spam folder."); setForgotStep(2); setForgotOtp(''); }
            else { const d = await r.json(); showError(d.error || "Failed to send OTP."); }
        } catch { showError("Server error."); }
        setLoading(false);
    };
    const handleForgotVerifyOtp = async () => {
        if (!forgotOtp || forgotOtp.length !== 6) return showError("Please enter the 6-digit OTP.");
        setLoading(true);
        try {
            const r = await fetch(`${API_BASE_URL}/verify-forgot-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }) });
            if (r.ok) setForgotStep(3);
            else { const d = await r.json(); showError(d.error || "Incorrect OTP."); }
        } catch { showError("Server error."); }
        setLoading(false);
    };
    const handleResetPassword = async () => {
        if (!newPass || newPass.length < 6) return showError("Please enter a password with at least 6 characters.");
        setLoading(true);
        try {
            const r = await fetch(`${API_BASE_URL}/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail, new_password: newPass }) });
            if (r.ok) { alert("Password reset successful! Please login now."); setPage('login'); setForgotStep(1); setForgotEmail(''); setForgotOtp(''); setNewPass(''); }
            else showError("Reset failed. Please try again.");
        } catch { showError("Server error."); }
        setLoading(false);
    };

    // ---- REGISTER ----
    const handleSendOtp = async () => {
        if (!regEmail || !regPass || !regName) return showError("Please fill in all fields.");
        if (regPass !== confirmPass) return showError("Passwords do not match.");
        if (regPass.length < 6) return showError("Password must be at least 6 characters.");
        setLoading(true);
        try {
            const r = await fetch(`${API_BASE_URL}/send-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: regEmail, name: regName, password: regPass, user_data: { name: regName, password: regPass } }) });
            if (r.ok) { setShowOtpScreen(true); setRegisterOtp(''); alert("Verification code sent! Please check your inbox/spam folder."); }
            else { const d = await r.json(); showError(d.error || "Failed to send OTP."); }
        } catch { showError("Server is not running."); }
        setLoading(false);
    };
    const handleVerifyAndRegister = async () => {
        if (!registerOtp || registerOtp.length !== 6) return showError("Please enter the 6-digit OTP.");
        setLoading(true);
        try {
            const r = await fetch(`${API_BASE_URL}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: regEmail, otp: registerOtp }) });
            if (r.ok) { alert("Registration successful! Please login."); setPage('login'); setRegName(''); setRegEmail(''); setRegPass(''); setConfirmPass(''); setRegisterOtp(''); setShowOtpScreen(false); }
            else { const d = await r.json(); showError(d.error || "Incorrect OTP."); }
        } catch { showError("Connection error."); }
        setLoading(false);
    };

    // ---- LOGIN ----
    const handleLogin = async () => {
        if (!userEmail || !userPass) return showError("Please enter your email and password.");
        setLoading(true);
        try {
            const r = await fetch(`${API_BASE_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: userEmail, password: userPass }) });
            const d = await r.json();
            if (r.ok) {
                setIsLoggedIn(true);
                setActiveUserName(d.user_name || 'User');
                setUserEmail(d.email || userEmail);
                setPage('search');
                try { localStorage.setItem('fc_session', JSON.stringify({ loggedIn: true, name: d.user_name || 'User', email: d.email || userEmail })); } catch {}
            }
            else showError(d.error || "Incorrect email or password.");
        } catch { showError("Login failed. Please check if the server is running."); }
        setLoading(false);
    };

    const handleAnalyze = useCallback(async (manualInput = null) => {
    const q = manualInput || analyzeInput;
    if (!q.trim() && !selectedFile) {
        showError("Please enter some text or upload a file.");
        return;
    }

    setLoading(true);
    try {
        const r = await fetch(`${API_BASE_URL}/verify-news`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: q || 'media file analysis' })
        });

        if (!r.ok) {
            const e = await r.json().catch(() => ({}));
            showError(e.error || "Analysis failed.");
            return;
        }

        const d = await r.json();
        setScanResult({
            score: safeNum(d.score, 0),
            verdict: safe(d.verdict, 'UNVERIFIED'),
            explanation: safe(d.explanation, 'No explanation.'),
            detected_language: safe(d.detected_language, 'English'),
            author_name: safe(d.author_name, 'Unknown'),
            source_link: safe(d.source_link, '#'),
            confidence: safe(d.confidence, 'N/A'),
            advice: safe(d.advice, ''),
            source_names: Array.isArray(d.source_names) ? d.source_names : [],
            source_website: d.source_website || { name: 'Google Fact Check', url: '#', tier: 'factchecker' },
            analysis_layers: d.analysis_layers || {}
        });

        if (q.trim()) {
            const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 7);
            setRecentSearches(updated);
            try { localStorage.setItem('recentSearches', JSON.stringify(updated)); } catch {}
        }

        setPage('dashboard');
    } catch (err) {
        console.error('Analysis error:', err);
        showError("Could not connect to the server. Please try again.");
    } finally {
        setLoading(false);
    }
}, [analyzeInput, selectedFile, recentSearches, showError, setLoading, setScanResult, setPage, setRecentSearches]);

    const getVerdictColor = (v) => {
        const u = (v || '').toUpperCase();
        if (u.includes('AUTHENTIC')) return 'bg-green-600';
        if (u.includes('FAKE') || u.includes('MISLEADING') || u.includes('SUSPICIOUS')) return 'bg-red-600';
        if (u.includes('MIXED') || u.includes('CAUTION')) return 'bg-yellow-500';
        return 'bg-slate-600';
    };

    const bgMain  = isDark ? 'bg-slate-950 text-white' : 'bg-[#f0f7ff] text-slate-900';
    const cardBg  = isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-white shadow-sm';
    const inputBg = isDark ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-800 border-white';

    const ErrorToast = () => error ? (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-red-600 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm max-w-xs text-center">
            {error}
        </div>
    ) : null;

    // OCR Status Bar — shown below the search box during scanning
    const OcrBar = () => {
        const show = isOcrRunning || ocrMsg || ocrErr;
        if (!show) return null;
        const isError = !!ocrErr;
        return (
            <div className={`w-full max-w-4xl mt-3 px-5 py-3 rounded-2xl border flex items-center gap-3
                ${isError
                    ? (isDark ? 'bg-red-950/40 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700')
                    : (isDark ? 'bg-blue-950/40 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700')
                }`}>
                {isOcrRunning && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />}
                <span className="text-xs font-bold">{ocrErr || ocrMsg}</span>
            </div>
        );
    };

    if (loading) return (
        <div className={`h-screen flex flex-col items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className={`font-bold tracking-widest text-[10px] uppercase ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Forensic Analysis in Progress...</p>
        </div>
    );

    // ============================================================
    // HOME PAGE
    // ============================================================
    // ============================================================
    // HOME PAGE (Ultra-Premium & Mesmerizing Animations)
    // ============================================================
    if (page === 'home') return (
        <div className={`min-h-screen relative overflow-hidden transition-all duration-700 ${isDark ? 'bg-[#030712] text-white' : 'bg-[#f8fafc] text-slate-900'}`}>
            <ErrorToast />

            {/* Custom Keyframes for Premium Animations */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes float-slow { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(2deg); } }
                @keyframes float-fast { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(-3deg); } }
                @keyframes scan-laser { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 50% { top: 100%; } 90% { opacity: 1; } 100% { top: 0%; opacity: 0; } }
                @keyframes text-shine { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
                @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.3); opacity: 0; } }
            `}} />

            {/* 1. Dynamic Background Auras (Cinematic Lighting) */}
            <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px] pointer-events-none z-0" style={{ animation: 'float-slow 8s infinite ease-in-out' }}></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none z-0" style={{ animation: 'float-slow 10s infinite ease-in-out reverse' }}></div>
            <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-cyan-400/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

            {/* Floating Particles for Depth */}
            <div className="absolute top-[20%] left-[10%] w-2 h-2 rounded-full bg-blue-400/50 shadow-[0_0_10px_#60a5fa] blur-[1px]" style={{ animation: 'float-fast 4s infinite' }}></div>
            <div className="absolute bottom-[30%] right-[15%] w-3 h-3 rounded-full bg-purple-400/40 shadow-[0_0_15px_#c084fc] blur-[1px]" style={{ animation: 'float-slow 6s infinite' }}></div>
            <div className="absolute top-[60%] left-[50%] w-1.5 h-1.5 rounded-full bg-cyan-400/60 shadow-[0_0_8px_#22d3ee] blur-[1px]" style={{ animation: 'float-fast 5s infinite reverse' }}></div>

            {/* 2. Enhanced Header Logo (Glowing) */}
            <div className="flex flex-col items-center pt-10 relative z-10">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setPage('home')}>
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 rounded-2xl blur group-hover:blur-md transition-all duration-300 opacity-50 group-hover:opacity-100"></div>
                        <div className="w-14 h-14 relative bg-gradient-to-br from-blue-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-105 transition-all duration-300 border border-white/20">
                            <span className="text-white text-xl font-black">LD</span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight">
                        Lets <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">Detect</span>
                    </h1>
                </div>
            </div>

            {/* 3. Hero Section */}
            <div className="flex flex-col md:flex-row items-center justify-between px-6 md:px-16 py-16 md:py-24 relative z-10 max-w-7xl mx-auto min-h-[75vh] gap-12">
                
                {/* Left Side: Typography & CTA */}
                <div className="md:w-1/2 space-y-8 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border shadow-lg backdrop-blur-md transition-all hover:scale-105 cursor-default
                        ${isDark ? 'bg-slate-800/50 border-slate-700/50 text-blue-400' : 'bg-white/60 border-slate-200 text-blue-600'}">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Next-Gen Deepfake AI</span>
                    </div>

                    <h1 className="text-6xl md:text-[5rem] font-black leading-[1.1] tracking-tighter">
                        Uncover The <br />
                        <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400 bg-[length:200%_auto] pb-2" style={{ animation: 'text-shine 4s linear infinite' }}>
                            Hidden Truth.
                        </span>
                    </h1>
                    
                    <p className={`text-lg md:text-xl max-w-lg mx-auto md:mx-0 font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Upload an image or paste a news headline. Our 8-layer forensic engine scans metadata, syntax, and global databases to detect fakes in seconds.
                    </p>
                    
                    {/* Premium Shimmering Button */}
                    <div className="relative inline-block group pt-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-[2rem] blur opacity-60 group-hover:opacity-100 group-hover:blur-xl transition-all duration-500"></div>
                        <button 
                            onClick={() => setPage('search')} 
                            className="relative flex items-center justify-center px-10 py-5 font-black text-white bg-slate-950 rounded-[2rem] overflow-hidden border border-white/10 group-hover:border-white/30 transition-all duration-300 transform active:scale-95"
                        >
                            {/* Inner Shimmer */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform ease-in-out"></div>
                            
                            <span className="text-lg tracking-widest uppercase relative z-10">Start Scanning</span>
                            <svg className="w-6 h-6 ml-3 relative z-10 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </button>
                    </div>
                </div>

                {/* Right Side: The Premium "Glass Scanner" Graphic */}
                <div className="md:w-1/2 w-full flex justify-center perspective-[1000px]">
                    {/* Main Glass Card container with 3D float effect */}
                    <div className={`relative w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl backdrop-blur-2xl border transition-all duration-700
                        ${isDark ? 'bg-slate-900/40 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'bg-white/40 border-white shadow-[0_20px_50px_rgba(148,163,184,0.3)]'}`}
                        style={{ animation: 'float-slow 6s infinite ease-in-out' }}>
                        
                        {/* Fake News / Real News Floating Badges */}
                        <div className="absolute -top-5 -right-5 bg-red-500/90 backdrop-blur-md text-white px-5 py-2 rounded-xl font-black text-xs tracking-[0.2em] shadow-lg border border-red-400/50" style={{ animation: 'float-fast 4s infinite' }}>
                            <span className="mr-2">⚠️</span> DEEPFAKE
                        </div>
                        <div className="absolute -bottom-5 -left-5 bg-emerald-500/90 backdrop-blur-md text-white px-5 py-2 rounded-xl font-black text-xs tracking-[0.2em] shadow-lg border border-emerald-400/50" style={{ animation: 'float-slow 5s infinite reverse' }}>
                            <span className="mr-2">✅</span> VERIFIED
                        </div>

                        {/* Scanner Area */}
                        <div className={`relative w-full h-80 rounded-2xl overflow-hidden border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100/80 border-slate-200'}`}>
                            
                            {/* Scanning Laser Line (The Magic Part) */}
                            <div className="absolute left-0 right-0 h-[2px] bg-cyan-400 z-20 shadow-[0_0_20px_4px_#22d3ee] flex justify-center" style={{ animation: 'scan-laser 3s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}>
                                <div className="w-1/2 h-[100px] bg-gradient-to-b from-cyan-400/40 to-transparent -translate-y-full"></div>
                            </div>

                            {/* Mock Document UI inside the scanner */}
                            <div className="absolute inset-0 p-6 flex flex-col gap-4 opacity-50">
                                {/* Header Mock */}
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-slate-500/30"></div>
                                    <div className="space-y-2">
                                        <div className="w-24 h-2 rounded-full bg-slate-500/40"></div>
                                        <div className="w-16 h-2 rounded-full bg-slate-500/20"></div>
                                    </div>
                                </div>
                                {/* Image Mock */}
                                <div className="w-full h-24 rounded-xl bg-slate-500/20 flex items-center justify-center">
                                    <span className="text-3xl opacity-50">🖼️</span>
                                </div>
                                {/* Text Lines Mock */}
                                <div className="space-y-3 w-full mt-2">
                                    <div className="w-full h-2 rounded-full bg-slate-500/30"></div>
                                    <div className="w-5/6 h-2 rounded-full bg-slate-500/30"></div>
                                    <div className="w-4/6 h-2 rounded-full bg-slate-500/30"></div>
                                </div>
                            </div>
                            
                            {/* Target Center Reticle */}
                            <div className="absolute inset-0 flex items-center justify-center z-10 mix-blend-overlay">
                                <div className="w-32 h-32 border border-dashed border-cyan-500/50 rounded-full animate-[spin_10s_linear_infinite]"></div>
                                <div className="absolute w-16 h-16 border border-cyan-500/30 rounded-full animate-[spin_5s_linear_infinite_reverse]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="w-full relative z-10 mt-10">
                <Footer isDark={isDark} />
            </div>
        </div>
    );

    // ============================================================
    // SEARCH PAGE — OCR integrated (Image only)
    // ============================================================
    if (page === 'search') return (
        <div className={`min-h-screen ${bgMain} p-4 md:p-10 flex flex-col items-center relative`}>
            <ErrorToast />
            {showUpdateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
                    <div className={`w-full max-w-sm p-8 rounded-[2.5rem] border shadow-2xl relative ${cardBg}`}>
                        <button onClick={() => setShowUpdateModal(false)} className="absolute top-4 right-6 text-gray-400 text-2xl">x</button>
                        <h3 className="text-xl font-black mb-2 text-center">Update Password</h3>
                        <p className="text-xs opacity-50 text-center mb-6">Enter your new password below.</p>
                        <div className="space-y-4">
                            <div className="relative"><input id="upd-p" type="password" placeholder="New Password (min 6 chars)" value={newPass} onChange={e => setNewPass(e.target.value)} className={`w-full p-4 rounded-2xl border-2 outline-none text-sm ${inputBg}`} /><button type="button" onClick={e => handleToggle('upd-p', e.currentTarget)} className="absolute right-4 top-1/2 -translate-y-1/2" dangerouslySetInnerHTML={{ __html: EyeSlashSVG }} /></div>
                            <button onClick={handleUpdatePassword} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Confirm Update</button>
                        </div>
                    </div>
                </div>
            )}
    <header className="sticky top-0 z-50 w-full pt-4 pb-8"> 
    <div className="w-full flex items-center justify-between px-0">
        
        {/* Left Side: Logo */}
        <div className="flex items-center gap-2 cursor-pointer -ml-2 md:-ml-4" onClick={() => setPage('home')}>
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 shrink-0">
                <span className="text-white text-sm font-black">LD</span>
            </div>
            <span className={`text-2xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Lets <span className="text-blue-600">Detect</span>
            </span>
        </div>

        {/* Right Side: Navigation Buttons */}
        <div className="hidden md:flex items-center gap-1">
            <button 
        onClick={() => setPage('home')} 
        className="px-3 py-2 text-xs md:text-sm font-bold text-blue-600 hover:text-white hover:bg-blue-600 rounded-2xl transition-all duration-300 whitespace-nowrap"
    >
        Home
    </button>
            <button 
                onClick={() => setPage('privacy')} 
                className="px-3 py-2 text-xs md:text-sm font-bold text-blue-600 hover:text-white hover:bg-blue-600 rounded-2xl transition-all duration-300 whitespace-nowrap"
            >
                Privacy
            </button>
            <button 
                onClick={() => setPage('terms')} 
                className="px-3 py-2 text-xs md:text-sm font-bold text-blue-600 hover:text-white hover:bg-blue-600 rounded-2xl transition-all duration-300 whitespace-nowrap"
            >
                Terms
            </button>
            {/* Naya Contact Button */}
            <button 
                onClick={() => setPage('contact')} 
                className="ml-2 px-2 py-2 text-xs md:text-sm font-black text-blue-600 bg-transparent hover:bg-blue-600 hover:text-white hover:shadow-[0_0_20px_rgba(37,99,235,0.6)] rounded-2xl transition-all duration-300 whitespace-nowrap"
            >
                Contact Us
            </button>
            {/* Naya About Button */}
            <button 
                onClick={() => setPage('about')} 
                className="px-3 py-2 text-xs md:text-sm font-bold text-blue-600 hover:text-white hover:bg-blue-600 rounded-2xl transition-all duration-300 whitespace-nowrap"
            >
                About
            </button>
        </div>
        {/* Hamburger Icon (Mobile Only) */}
<div className="md:hidden flex items-center z-50">
    <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        className={`p-2 rounded-lg transition-all focus:outline-none ${isDark ? 'text-white' : 'text-slate-900'}`}
    >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
                // Close (X) Icon
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
                // Hamburger Menu Icon
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
        </svg>
    </button>
</div>
    </div>
    {/* Mobile Sidebar Overlay - Faqat Mobile ke liye */}
<div 
  className={`fixed inset-0 z-[100] md:hidden transition-all duration-500 ${
    isMobileMenuOpen ? 'visible' : 'invisible'
  }`}
>
  {/* Backdrop */}
  <div 
    className={`absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-500 ${
      isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
    }`}
    onClick={() => setIsMobileMenuOpen(false)}
  />

  {/* Sidebar Content */}
  <div 
    className={`absolute top-0 right-0 h-full w-72 bg-slate-900 border-l border-white/10 p-6 shadow-2xl transition-transform duration-500 transform ${
      isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
    }`}
  >
    <div className="flex flex-col h-full">
      {/* Brand Logo & Close Button */}
      <div className="flex justify-between items-center mb-10">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => { setPage('home'); setIsMobileMenuOpen(false); }}
        >
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-black text-base">LD</span>
          </div>
          <span className="text-white text-xl font-black tracking-tighter">
            Lets <span className="text-blue-600">Detect</span>
          </span>
        </div>
        
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="p-2 text-white/50 hover:text-white bg-white/5 rounded-lg transition-all active:scale-90"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
        <button 
          onClick={() => { setPage('home'); setIsMobileMenuOpen(false); }}
          className={`flex items-center gap-4 px-5 py-3 rounded-xl font-bold transition-all ${page === 'home' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
        >
          <span className="text-lg">🏠</span> Home
        </button>

        <button 
          onClick={() => { setPage('about'); setIsMobileMenuOpen(false); }}
          className={`flex items-center gap-4 px-5 py-3 rounded-xl font-bold transition-all ${page === 'about' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
        >
          <span className="text-lg">📖</span> About Us
        </button>

        <button 
          onClick={() => { setPage('contact'); setIsMobileMenuOpen(false); }}
          className={`flex items-center gap-4 px-5 py-3 rounded-xl font-bold transition-all ${page === 'contact' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
        >
          <span className="text-lg">📞</span> Contact Us
        </button>

        <button 
          onClick={() => { setPage('privacy'); setIsMobileMenuOpen(false); }}
          className={`flex items-center gap-4 px-5 py-3 rounded-xl font-bold transition-all ${page === 'privacy' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
        >
          <span className="text-lg">🛡️</span> Privacy
        </button>

        <button 
          onClick={() => { setPage('terms'); setIsMobileMenuOpen(false); }}
          className={`flex items-center gap-4 px-5 py-3 rounded-xl font-bold transition-all ${page === 'terms' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
        >
          <span className="text-lg">📜</span> Terms
        </button>
      </nav>

      {/* Scan Button - Positioned higher with mb-10 */}
      <div className="mt-auto mb-10 pt-6 border-t border-white/5">
        <button 
          onClick={() => { setPage('search'); setIsMobileMenuOpen(false); }}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <span className="text-xl">🔍</span> Scan Now
        </button>
        <p className="text-[10px] text-center text-slate-500 mt-4 font-bold uppercase tracking-[0.2em] opacity-40">
          Lets Detect v1.0
        </p>
      </div>
    </div>
  </div>
</div>
</header>

            <main className="w-full max-w-4xl flex flex-col items-center flex-grow">
                <h2 className="text-3xl md:text-4xl font-black mb-12 text-center tracking-tight opacity-90 min-h-[48px] flex items-center justify-center">
    <span>{typewriterText}</span>
    <span className="w-1 h-8 md:h-10 ml-1 bg-blue-600 animate-pulse"></span>
</h2>

                <div className={`w-full relative shadow-2xl rounded-[2.5rem] p-2 flex flex-col border-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-white'}`}>

                    {/* File chip — Image only */}
                    {selectedFile && (
                        <div className={`m-2 p-2 w-56 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className="text-xl">🖼️</span>
                                <div className="overflow-hidden">
                                    <p className="text-[9px] font-bold truncate w-24">{selectedFile.name}</p>
                                    <p className="text-[7px] opacity-50 uppercase font-black">
                                        {isOcrRunning ? '🔍 Reading text...' : (analyzeInput ? '✅ Text extracted' : 'Image')}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => { setSelectedFile(null); setOcrMsg(''); setOcrErr(''); }} className="text-xs hover:text-red-500 px-1">x</button>
                        </div>
                    )}

                    <div className="relative flex items-start">
                        <div className="absolute left-4 top-3 z-20">
                            <button onClick={() => setShowUploadMenu(!showUploadMenu)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl transition-all duration-300 ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'} hover:bg-blue-500 hover:text-white ${showUploadMenu ? 'rotate-45' : ''}`}>
                                +
                            </button>
                            {showUploadMenu && (
                                <div className={`p-2 rounded-xl shadow-2xl border absolute bottom-full mb-2 z-30 min-w-max ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                                    {/* Screenshot/Image — Tesseract.js OCR */}
                                    <label className="flex items-center gap-2 p-3 rounded-lg cursor-pointer whitespace-nowrap text-xs font-bold hover:bg-blue-500 hover:text-white transition-all text-slate-700">
                                        <input type="file" className="hidden" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp" onChange={handleFileChange} />
                                        📸 Screenshot / Image
                                        <span className="ml-1 text-[8px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black">OCR</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        <textarea
                            placeholder={isOcrRunning ? "AI is extracting text from the image... please wait..." : "Paste a news or article here..."}
                            value={analyzeInput}
                            onChange={e => setAnalyzeInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !isOcrRunning) { e.preventDefault(); handleAnalyze(); } }}
                            disabled={isOcrRunning}
                            rows={analyzeInput.length > 100 ? 4 : 1}
                            className={`w-full p-5 pl-16 pr-32 bg-transparent outline-none text-base resize-none leading-relaxed transition-opacity ${isOcrRunning ? 'opacity-40 cursor-wait' : 'opacity-100'}`}
                            style={{ minHeight: '60px', maxHeight: '160px' }}
                        />

                        <button onClick={() => handleAnalyze()} disabled={isOcrRunning}
                            className={`absolute right-3 top-3 text-white px-5 py-3 rounded-2xl font-black text-xs shadow-lg uppercase tracking-widest transition-all ${isOcrRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                            {isOcrRunning ? '⏳' : 'Analyze'}
                        </button>
                    </div>
                </div>

                {/* OCR Status / Error bar */}
                <OcrBar />

                <div className="w-full mt-20 relative z-10">
                    {/* ULTRA-PREMIUM CSS KEYFRAMES */}
                    <style dangerouslySetInnerHTML={{__html: `
                        @keyframes fade-in-up-premium {
                            0% { opacity: 0; transform: translateY(40px) scale(0.95); filter: blur(5px); }
                            100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
                        }
                        @keyframes float-magic {
                            0%, 100% { transform: translateY(0px) rotate(0deg); }
                            50% { transform: translateY(-8px) rotate(3deg); }
                        }
                        @keyframes sweep-shine {
                            0% { transform: translateX(-150%) skewX(-20deg); }
                            100% { transform: translateX(200%) skewX(-20deg); }
                        }
                        @keyframes pulse-ring {
                            0% { transform: scale(0.8); opacity: 0.5; }
                            100% { transform: scale(1.5); opacity: 0; }
                        }
                    `}} />

                    {/* Header Section */}
                    <div className="flex justify-between items-center mb-10 px-4">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 shadow-[0_0_10px_#3b82f6]"></span>
                            </div>
                            <h4 className="font-black text-xs uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
                                Recent Scans
                            </h4>
                        </div>
                        {recentSearches.length > 0 && (
                            <button onClick={() => { setRecentSearches([]); try { localStorage.removeItem('recentSearches'); } catch {} }} 
                                className="text-[10px] font-black uppercase text-slate-400 hover:text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-full transition-all duration-300 border border-transparent hover:border-red-500/30">
                                Clear History
                            </button>
                        )}
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-6 w-full perspective-[1500px]">
                        {recentSearches.length > 0 ? recentSearches.map((term, i) => {
                            const visual = getSearchVisual(term);
                            return (
                            <div 
                                key={i} 
                                className="text-center group cursor-pointer relative" 
                                onClick={() => { setAnalyzeInput(term); handleAnalyze(term); }}
                                style={{ 
                                    animation: `fade-in-up-premium 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                                    animationDelay: `${i * 0.1}s`,
                                    opacity: 0
                                }}
                            >
                                {/* The Main Glass Card */}
                                <div className={`relative aspect-square rounded-[2.5rem] p-[2px] transition-all duration-700 ease-out hover:-translate-y-5 hover:scale-[1.08] overflow-hidden shadow-xl
                                    ${isDark ? 'hover:shadow-[0_20px_50px_rgba(37,99,235,0.4)]' : 'hover:shadow-[0_20px_50px_rgba(59,130,246,0.3)]'}
                                `}>
                                    
                                    {/* Animated Colorful Border Background */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-400 opacity-20 group-hover:opacity-100 transition-opacity duration-700 animate-[spin_4s_linear_infinite]"></div>

                                    {/* Inner Frosted Glass */}
                                    <div className={`absolute inset-[2px] rounded-[2.4rem] flex flex-col items-center justify-center p-3 gap-3 backdrop-blur-2xl transition-all duration-500 
                                        ${isDark ? 'bg-slate-900/90 border border-white/5' : 'bg-white/95 border border-slate-100'}
                                    `}>
                                        
                                        {/* Hover Laser Sweep Effect (The Magic) */}
                                        <div className="absolute inset-0 overflow-hidden rounded-[2.4rem] pointer-events-none">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-[150%] h-full opacity-0 group-hover:opacity-100 group-hover:animate-[sweep-shine_1.5s_ease-in-out_infinite]"></div>
                                        </div>

                                        {/* Glowing Aura Behind Emoji */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-blue-500/40 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>

                                        {/* Floating Emoji Box */}
                                        <div 
                                            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${visual.gradient} flex items-center justify-center shadow-inner relative z-10 group-hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] border border-white/20 transition-all duration-500`}
                                            style={{ animation: 'float-magic 4s ease-in-out infinite', animationDelay: `${i * 0.15}s` }}
                                        >
                                            <span className="text-3xl drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-300">{visual.emoji}</span>
                                        </div>
                                        
                                        {/* Holographic Text */}
                                        <span className={`text-[10px] font-black break-words line-clamp-2 uppercase tracking-widest relative z-10 leading-tight px-1 transition-all duration-500 text-transparent bg-clip-text
                                            ${isDark ? 'bg-gradient-to-r from-slate-300 to-slate-100 group-hover:from-blue-300 group-hover:to-cyan-200' : 'bg-gradient-to-r from-slate-600 to-slate-800 group-hover:from-blue-600 group-hover:to-cyan-500'}
                                        `}>
                                            {term}
                                        </span>
                                    </div>
                                </div>

                                {/* Bottom Number Indicator */}
                                <p className="text-[11px] font-black mt-4 opacity-0 tracking-[0.3em] transition-all duration-500 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
                                    SCAN 0{i + 1}
                                </p>
                            </div>
                            );
                        }) : [...Array(7)].map((_, i) => (
                            <div 
                                key={i} 
                                className="text-center opacity-40 group"
                                style={{ 
                                    animation: `fade-in-up-premium 0.8s ease-out forwards`,
                                    animationDelay: `${i * 0.1}s`,
                                    opacity: 0
                                }}
                            >
                                <div className={`aspect-square rounded-[2.5rem] border-2 border-dashed transition-all duration-700 
                                    ${isDark ? 'border-slate-700 bg-slate-800/20 group-hover:bg-slate-800/40' : 'border-slate-300 bg-slate-100/50 group-hover:bg-slate-200/50'} 
                                `} />
                                <p className="text-[10px] mt-4 font-bold tracking-[0.3em] uppercase italic opacity-30">Empty Slot</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <div className="w-full mt-20"> {/* <--- Yahan se border-t hata diya */}
    <Footer isDark={isDark} />
</div>
        </div>
    );

    // ============================================================
    // DASHBOARD PAGE
    // ============================================================
    if (page === 'dashboard') {
        const score = safeNum(scanResult.score, 0);
        const verdict = safe(scanResult.verdict, 'UNVERIFIED');
        const ct = safe(scanResult.confidence, 'N/A').toUpperCase();
        const cw = ct === 'VERY HIGH' ? 100 : ct === 'HIGH' ? 75 : ct === 'MEDIUM-HIGH' ? 62 : ct === 'MEDIUM' ? 50 : 25;
        return (
            <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-[#eaf4ff] text-slate-900'} p-3 md:p-10 flex items-center justify-center`}>
                <ErrorToast />
                <div className={`w-full max-w-5xl rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 shadow-2xl ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 text-white flex items-center justify-center rounded-2xl shadow-xl text-xl">🛡️</div>
                            <div><h1 className="text-lg md:text-xl font-black tracking-tight">Detection Result</h1><p className="text-xs opacity-40 font-bold uppercase tracking-widest">8-Layer Forensic Analysis</p></div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setPage('search')} className="text-slate-400 font-bold hover:text-red-500 text-xl">x</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        {[
                            { label: 'Forensic Score', val: `${score}%`, bar: score, color: 'bg-cyan-500' },
                            { label: 'Metadata Check', val: 'OK', bar: 100, color: 'bg-green-500' },
                            { label: 'Source Engine', val: safe(scanResult.detected_language, 'English') === "Urdu/Roman Urdu" ? "SochFact" : "Google FC", bar: 100, color: 'bg-blue-500' },
                            { label: 'Confidence', val: ct, bar: cw, color: 'bg-purple-500' },
                        ].map((item, i) => (
                            <div key={i} className={`p-6 rounded-[2rem] border text-center ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-3">{item.label}</p>
                                <h2 className="text-2xl font-black mb-3">{item.val}</h2>
                                <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                                    <div className={`${item.color} h-full transition-all duration-500`} style={{ width: `${item.bar}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={`p-6 rounded-[2.5rem] border-2 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-blue-50 border-blue-100 shadow-sm'}`}>
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg">i</div>
                            <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Official Fact-Check Source</p><h4 className="text-lg font-black uppercase text-blue-600">{safe(scanResult.author_name, 'Unknown Source')}</h4></div>
                        </div>
                        {scanResult.source_link && scanResult.source_link !== '#' && (
                            <a href={scanResult.source_link} target="_blank" rel="noopener noreferrer" className="bg-slate-900 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl">View Full Evidence Report</a>
                        )}
                    </div>

                    <div className={`p-5 rounded-2xl border flex flex-col gap-3 mb-8 ${isDark ? 'bg-red-950/30 border-red-900/50 text-red-400' : 'bg-red-50 border-red-100 text-red-900'}`}>
                        <div className="flex flex-col md:flex-row items-start gap-4">
                            <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase shrink-0">Analysis</span>
                            <p className="text-xs md:text-sm font-bold italic opacity-90 leading-snug">"{safe(scanResult.explanation, 'No explanation.')}"</p>
                        </div>
                        <SourceNameBadges names={scanResult.source_names} isDark={isDark} />
                    </div>

                    {scanResult.advice && (
                        <div className={`p-4 rounded-2xl border mb-8 ${isDark ? 'bg-blue-950/30 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                            <p className="text-xs font-bold">💡 {scanResult.advice}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <div className={`p-8 rounded-3xl border ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <span className="text-[10px] font-black uppercase text-slate-400 block mb-2">Scan Status</span>
                            <p className="text-[11px] font-bold opacity-60 leading-relaxed">System analysis complete. 8 independent verification layers used.</p>
                        </div>
                        <div className={`p-8 rounded-3xl border ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <p className="text-sm font-black mb-3 uppercase tracking-tight">AI Confidence</p>
                            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}><div className="bg-cyan-500 h-full transition-all duration-500" style={{ width: `${score}%` }} /></div>
                            <p className="text-xs opacity-40 mt-2 font-bold">{score}% authenticity score</p>
                        </div>
                        <div className={`p-8 rounded-[2.5rem] text-white text-center flex flex-col justify-center min-h-[160px] ${getVerdictColor(verdict)}`}>
                            <h3 className="text-2xl font-black tracking-tighter leading-tight">{verdict}</h3>
                            <div className="mt-4 pt-4 border-t border-white/20 text-[8px] font-bold tracking-[0.3em]">SECURE SCAN ACTIVE</div>
                        </div>
                    </div>

                    <button onClick={() => { setAnalyzeInput(''); setSelectedFile(null); setPage('search'); }} className={`w-full md:w-auto mx-auto flex items-center justify-center gap-3 px-12 py-5 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl ${isDark ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-blue-600'}`}>
                        Analyze Another Article
                    </button>
                    <Footer isDark={isDark} />
                </div>
                
            </div>
        );
    }
if (page === 'privacy') {
  return (
    <div className={`min-h-screen transition-all duration-500 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage('home')}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><span className="text-white font-black">LD</span></div>
          <span className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Lets <span className="text-blue-600">Detect</span></span>
        </div>
        <button onClick={() => setPage('search')} className="text-sm font-bold text-blue-600">Back to App</button>
      </header>

      <PrivacyPolicyPage />
      <Footer isDark={isDark} />
    </div>
  );
}
// Privacy check ke baad ye Terms ka check lagayein
if (page === 'terms') {
  return (
    <div className={`min-h-screen transition-all duration-500 ${isDark ? 'bg-slate-950 text-white' : 'bg-[#fcfdfe] text-slate-900'}`}>
      <nav className="p-8 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setPage('home')}>
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform">
            <span className="text-white font-black text-lg">LD</span>
          </div>
          <span className="text-2xl font-black tracking-tighter">Lets <span className="text-blue-600">Detect</span></span>
        </div>
        
        <button onClick={() => setPage('search')} className="text-sm font-bold text-blue-600">Back to App</button>
      </nav>

      <TermsConditionsPage onContactClick={() => setPage('contact')} />
      <Footer isDark={isDark} />
    </div>
  );
}
// ============================================================
// CONTACT US PAGE — with Header & Footer
// ============================================================
if (page === 'contact') {
  const formInputBg = isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-50 text-slate-800 border-slate-200';
  return (
    <div className={`min-h-screen transition-all duration-500 ${isDark ? 'bg-slate-950 text-white' : 'bg-[#fcfdfe] text-slate-900'}`}>
      <nav className="p-8 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setPage('home')}>
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform">
            <span className="text-white font-black text-lg">LD</span>
          </div>
          <span className={`text-2xl font-black tracking-tighter`}>Lets <span className="text-blue-600">Detect</span></span>
        </div>
        <button onClick={() => setPage('search')} className="text-sm font-bold text-blue-600">Back to App</button>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16 relative overflow-hidden">
        {/* Background Aura */}
        <div className="absolute top-0 right-0 -z-10 w-72 h-72 bg-blue-200 rounded-full blur-[140px] opacity-50"></div>
        <div className="absolute bottom-0 left-0 -z-10 w-72 h-72 bg-indigo-200 rounded-full blur-[140px] opacity-50"></div>

        {/* Page Header */}
        <div className="text-center mb-14">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/30 hover:rotate-6 transition-transform">
            <span className="text-white text-4xl">✉️</span>
          </div>
          <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 inline-block shadow-sm border border-blue-100">
            Get In Touch
          </span>
          <h1 className={`text-5xl md:text-6xl font-black tracking-tighter mb-4`}>
            Contact <span className="text-blue-600">Us</span>
          </h1>
          <p className={`text-lg font-medium max-w-md mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Have questions, feedback or need help? Send us a message and we'll respond within 24 hours.
          </p>
        </div>

        {/* Contact Form Card */}
        <div className={`p-10 rounded-[3rem] border shadow-2xl ${isDark ? 'bg-slate-900/80 border-slate-800 backdrop-blur-xl' : 'bg-white/80 border-white backdrop-blur-xl'}`}>
          <form action="https://formsubmit.co/resumeprohub1@gmail.com" method="POST" className="space-y-5">
            <input type="hidden" name="_next" value={window.location.origin + window.location.pathname + '?sent=true'} />
            <input type="hidden" name="_captcha" value="false" />
            <input type="hidden" name="_subject" value="New Contact from Lets Detect" />
            <div>
              <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Your Name</label>
              <input type="text" name="name" required className={`w-full p-4 rounded-2xl outline-none border-2 transition-all text-sm ${formInputBg} focus:border-blue-600 focus:shadow-lg focus:shadow-blue-500/10`} placeholder="e.g. Ahmed Khan" />
            </div>
            <div>
              <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email Address</label>
              <input type="email" name="email" required className={`w-full p-4 rounded-2xl outline-none border-2 transition-all text-sm ${formInputBg} focus:border-blue-600 focus:shadow-lg focus:shadow-blue-500/10`} placeholder="your@email.com" />
            </div>
            <div>
              <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Message</label>
              <textarea name="message" required rows="5" className={`w-full p-4 rounded-2xl outline-none border-2 transition-all resize-none text-sm ${formInputBg} focus:border-blue-600 focus:shadow-lg focus:shadow-blue-500/10`} placeholder="Write your message here..."></textarea>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-blue-700 active:scale-95 transition-all mt-2 hover:shadow-blue-500/30 hover:shadow-2xl">
              🚀 Send Message
            </button>
            <p className={`text-center text-[10px] font-bold opacity-40`}>Powered by FormSubmit • Messages go to resumeprohub1@gmail.com</p>
          </form>
        </div>
      </div>

      <Footer isDark={isDark} />
    </div>
  );
}
// ============================================================
// SUCCESS PAGE — After Contact Form Submission
// ============================================================
if (page === 'success') {
  return (
    <div className={`min-h-screen transition-all duration-500 ${isDark ? 'bg-slate-950 text-white' : 'bg-[#fcfdfe] text-slate-900'}`}>
      <nav className="p-8 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setPage('home')}>
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform">
            <span className="text-white font-black text-lg">LD</span>
          </div>
          <span className={`text-2xl font-black tracking-tighter`}>Lets <span className="text-blue-600">Detect</span></span>
        </div>
        <button onClick={() => setPage('search')} className="text-sm font-bold text-blue-600">Back to App</button>
      </nav>

      <div className="flex flex-col items-center justify-center px-6 py-20 min-h-[60vh] relative overflow-hidden">
        {/* Background Aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-96 h-96 bg-green-200 rounded-full blur-[160px] opacity-40"></div>

        {/* Animated Checkmark */}
        <div className="w-28 h-28 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/30">
          <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <span className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 inline-block shadow-sm border border-green-100">
          Message Sent
        </span>

        <h1 className={`text-4xl md:text-6xl font-black tracking-tighter mb-4 text-center`}>
          Successfully <span className="text-green-500">Delivered!</span>
        </h1>

        <p className={`text-lg font-medium max-w-lg mx-auto text-center mb-12 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Your message has been sent to our team at <strong className="text-blue-600">resumeprohub1@gmail.com</strong>. We'll get back to you within 24 hours.
        </p>

        <button 
          onClick={() => setPage('search')} 
          className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-blue-700 active:scale-95 transition-all hover:shadow-blue-500/30 hover:shadow-2xl"
        >
          🏠 Go Back to Dashboard
        </button>

        <p className={`mt-6 text-[10px] font-bold opacity-30`}>Thank you for reaching out!</p>
      </div>

      <Footer isDark={isDark} />
    </div>
  );
}
// ============================================================
// ABOUT US PAGE
// ============================================================
if (page === 'about') {
  return (
    <div className={`min-h-screen transition-all duration-500 ${isDark ? 'bg-slate-950 text-white' : 'bg-[#fcfdfe] text-slate-900'}`}>
      <nav className="p-8 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setPage('home')}>
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform">
            <span className="text-white font-black text-lg">LD</span>
          </div>
          <span className={`text-2xl font-black tracking-tighter`}>Lets <span className="text-blue-600">Detect</span></span>
        </div>
        <button onClick={() => setPage('search')} className="text-sm font-bold text-blue-600">Back to App</button>
      </nav>

      <AboutPage />
      <Footer isDark={isDark} />
    </div>
  );
}
    return null;
};


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
