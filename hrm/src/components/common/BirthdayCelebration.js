import React, { useState, useEffect } from "react";

const birthdayQuotes = [
    "Wishing you a day filled with happiness and a year filled with joy!",
    "Happy birthday! I hope all your birthday wishes and dreams come true.",
    "Sending you smiles for every moment of your special day. Have a wonderful time!",
    "Hope your special day brings you all that your heart desires!",
    "Wishing you a beautiful day with good health and happiness forever.",
    "A simple celebration, a gathering of friends; here is wishing you great happiness and a joy that never ends.",
    "May your birthday be full of happy hours and special moments to remember for a long time!"
];

/**
 * BirthdayCelebration Component
 * Shows balloons, sparkles, and rotating quotes.
 * isSelf: boolean to show "Your Special Day" vs "Teammate Celebration"
 */
export default function BirthdayCelebration({ isBirthday, name, isSelf = false }) {
    const [quoteIndex, setQuoteIndex] = useState(0);

    useEffect(() => {
        if (!isBirthday) return;
        const interval = setInterval(() => {
            setQuoteIndex((prev) => (prev + 1) % birthdayQuotes.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [isBirthday]);

    if (!isBirthday) return null;

    return (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 via-white to-pink-50 dark:from-red-950/20 dark:via-slate-900 dark:to-pink-900/20 border border-red-200 dark:border-red-900/50 p-4 shadow-sm animate-fade-in group">
            {/* Context Label */}
            <div className={`text-[9px] font-black mb-1.5 uppercase tracking-[0.2em] text-center ${isSelf ? 'text-amber-500' : 'text-customRed/70'}`}>
                {isSelf ? "✨ It's Your Special Day! ✨" : "🎊 Celebrating a Teammate 🎊"}
            </div>

            {/* Balloons, Sparkles, Gifts, Confetti Area */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bottom-[-50px] animate-float-up opacity-80"
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 8}s`,
                            animationDuration: `${5 + Math.random() * 5}s`,
                            fontSize: `${14 + Math.random() * 16}px`,
                            filter: `hue-rotate(${Math.random() * 360}deg) drop-shadow(0 2px 4px rgba(0,0,0,0.1))`
                        }}
                    >
                        {['🎈', '✨', '🎁', '🎉', '🎊', '🍰', '🎈'][Math.floor(Math.random() * 7)]}
                    </div>
                ))}
            </div>

            <div className="relative z-10 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-2xl animate-bounce">🎂</span>
                    <h3 className={`text-sm font-black uppercase tracking-widest ${isSelf ? 'text-amber-600' : 'text-customRed'}`}>
                        Happy Birthday, <span className="underline decoration-2 decoration-amber-300 underline-offset-4">{name}</span>!
                    </h3>
                    <span className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>🥳</span>
                </div>

                <div key={quoteIndex} className="min-h-[2.5rem] flex items-center justify-center italic">
                    <p className="text-[12px] text-slate-600 animate-fade-in leading-relaxed max-w-[90%] mx-auto">
                        "{birthdayQuotes[quoteIndex]}"
                    </p>
                </div>

                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 text-lg opacity-40 group-hover:scale-125 transition-transform">🎁</div>
                <div className="absolute -top-1 -right-1 text-lg opacity-40 group-hover:scale-125 transition-transform">💖</div>
            </div>

            <style>{`
                @keyframes float-up {
                    0% { transform: translateY(0) rotate(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(-600px) rotate(90deg); opacity: 0; }
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-float-up {
                    animation: float-up infinite linear;
                }
                .animate-fade-in {
                    animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
}
