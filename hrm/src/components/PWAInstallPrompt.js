import React, { useState, useEffect } from "react";
import { X, Share, Download } from "lucide-react";

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if app is running in standalone mode
        const isInStandaloneMode = () =>
            window.matchMedia("(display-mode: standalone)").matches ||
            window.navigator.standalone ||
            document.referrer.includes("android-app://");

        if (isInStandaloneMode()) {
            setIsStandalone(true);
            return; // clear prompt if already installed
        }

        // Detect iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(iOS);

        // If iOS and not standalone, show prompt after a delay
        if (iOS && !isInStandaloneMode()) {
            const timer = setTimeout(() => {
                // Check if we've shown it recently (optional localStorage check)
                const lastShown = localStorage.getItem("pwaPromptShown");
                const now = Date.now();
                if (!lastShown || now - lastShown > 24 * 60 * 60 * 1000) {
                    setShowPrompt(true);
                }
            }, 5000); // Show after 5s
            return () => clearTimeout(timer);
        }

        // Capture the PWA install event for Android/Desktop
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show prompt if not previously dismissed recently
            const lastShown = localStorage.getItem("pwaPromptShown");
            const now = Date.now();
            if (!lastShown || now - lastShown > 24 * 60 * 60 * 1000) {
                setShowPrompt(true);
            }
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setDeferredPrompt(null);
                setShowPrompt(false);
            }
        }
    };

    const closePrompt = () => {
        setShowPrompt(false);
        localStorage.setItem("pwaPromptShown", Date.now());
    };

    if (isStandalone || !showPrompt) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-slide-up">
            {/* iOS Instructions */}
            {isIOS ? (
                <div className="mx-auto max-w-sm bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-5 mb-[env(safe-area-inset-bottom)] pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
                    <button
                        onClick={closePrompt}
                        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <img src="%PUBLIC_URL%/hrm-logo.png" alt="HRM" className="w-12 h-12 rounded-xl shadow-sm" />
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Install App</h3>
                                <p className="text-xs text-slate-500">For a better experience</p>
                            </div>
                        </div>
                        <div className="text-sm text-slate-700 space-y-2 mt-1">
                            <p className="flex items-center gap-2">
                                1. Tap the <Share size={16} className="text-blue-500" /> <strong>Share</strong> button
                            </p>
                            <p className="flex items-center gap-2">
                                2. Scroll and tap <strong>Add to Home Screen</strong>
                            </p>
                        </div>
                    </div>
                    {/* Arrow pointing to bottom center (Share button usually there on Safari) */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/90 rotate-45 border-r border-b border-slate-200"></div>
                </div>
            ) : (
                /* Android/Desktop Install Button */
                <div className="mx-auto max-w-sm bg-slate-900 text-white shadow-2xl rounded-xl p-4 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-800 p-2 rounded-lg text-customRed">
                            <Download size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Install App</p>
                            <p className="text-xs text-slate-400">Add to home screen</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={closePrompt}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white"
                        >
                            Later
                        </button>
                        <button
                            onClick={handleInstall}
                            className="px-4 py-1.5 bg-customRed text-white text-xs font-bold rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all"
                        >
                            Install
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
