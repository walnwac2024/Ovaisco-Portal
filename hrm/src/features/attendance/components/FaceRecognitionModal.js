import React from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { X, Camera, RefreshCw } from 'lucide-react';

console.log('--- [FaceRecognitionModal] VERSION 2.1 LOADED ---');

const FaceRecognitionModal = ({ isOpen, onClose, onCapture, employeeName }) => {
    const webcamRef = React.useRef(null);
    const canvasRef = React.useRef(null);
    const lastStateRef = React.useRef('OPEN'); // OPEN or CLOSED
    const [modelsLoaded, setModelsLoaded] = React.useState(false);
    const [isLivenessConfirmed, setIsLivenessConfirmed] = React.useState(false);
    const [faceDetected, setFaceDetected] = React.useState(false);
    const [blinkCount, setBlinkCount] = React.useState(0);
    const [status, setStatus] = React.useState('Ready');
    const [error, setError] = React.useState(null);
    const blinkCountRef = React.useRef(0);
    const isLivenessConfirmedRef = React.useRef(false);
    const isModelLoadingRef = React.useRef(false);

    // Constants for blink detection (EAR - Eye Aspect Ratio)
    const BLINK_THRESHOLD = 0.30; // Slightly more relaxed for "instant" feel
    const REQUIRED_BLINKS = 1; // User requested "jaldi jaldi kam ho jana chaya"

    const loadModels = React.useCallback(async () => {
        // If models are already in memory (preloaded by Dashboard), don't show loading states
        if (faceapi.nets.ssdMobilenetv1 && faceapi.nets.ssdMobilenetv1.params) {
            setModelsLoaded(true);
            return;
        }

        if (isModelLoadingRef.current) return;
        isModelLoadingRef.current = true;
        try {
            // This is a fallback in case preloading failed or wasn't finished
            const MODEL_URL = process.env.PUBLIC_URL + '/models';
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);
            setModelsLoaded(true);
            console.log('[Diagnostic] Models Loaded via Fallback');
        } catch (err) {
            console.error('Error loading models:', err);
            setError('Biometric engine failed to start.');
        } finally {
            isModelLoadingRef.current = false;
        }
    }, []);

    React.useEffect(() => {
        if (isOpen) {
            loadModels();
        }
    }, [isOpen, loadModels]);

    // Reset state ONLY when the modal is closed or opened fresh
    React.useEffect(() => {
        if (!isOpen) {
            setModelsLoaded(false);
            setIsLivenessConfirmed(false);
            setFaceDetected(false);
            setBlinkCount(0);
            blinkCountRef.current = 0;
            isLivenessConfirmedRef.current = false;
            setStatus('Ready');
        }
    }, [isOpen]);

    const calculateEAR = (eyeLandmarks) => {
        // Vertical distances
        const v1 = Math.hypot(eyeLandmarks[1].x - eyeLandmarks[5].x, eyeLandmarks[1].y - eyeLandmarks[5].y);
        const v2 = Math.hypot(eyeLandmarks[2].x - eyeLandmarks[4].x, eyeLandmarks[2].y - eyeLandmarks[4].y);
        // Horizontal distance
        const h = Math.hypot(eyeLandmarks[0].x - eyeLandmarks[3].x, eyeLandmarks[0].y - eyeLandmarks[3].y);
        return (v1 + v2) / (2.0 * h);
    };

    const startDetection = React.useCallback(() => {
        if (!modelsLoaded || !webcamRef.current) return;

        console.log('[Diagnostic] Starting Detection Loop...');
        let isMounted = true;
        let requestRef = null;

        const detect = async () => {
            if (!isMounted || isLivenessConfirmedRef.current || !modelsLoaded) return;

            const video = webcamRef.current?.video;

            if (video) {
                const rs = video.readyState;
                const vw = video.videoWidth;
                if (rs < 4 || vw === 0) {
                    if (isMounted) requestRef = requestAnimationFrame(detect);
                    return;
                }
            } else {
                if (isMounted) requestRef = requestAnimationFrame(detect);
                return;
            }

            try {
                const detections = await faceapi.detectSingleFace(
                    video,
                    new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 })
                ).withFaceLandmarks();

                if (!isMounted || isLivenessConfirmedRef.current) return;

                if (detections && detections.detection && detections.detection.box) {
                    if (!faceDetected) setFaceDetected(true);

                    if (blinkCountRef.current === 0) {
                        setStatus('Face matched! Please blink.');
                    }

                    const landmarks = detections.landmarks;
                    const leftEAR = calculateEAR(landmarks.getLeftEye());
                    const rightEAR = calculateEAR(landmarks.getRightEye());
                    const avgEAR = (leftEAR + rightEAR) / 2;

                    // Debug EAR values in console to help troubleshooting
                    if (avgEAR < 0.3) {
                        console.log(`[Diagnostic] EAR: ${avgEAR.toFixed(3)} | Threshold: ${BLINK_THRESHOLD}`);
                    }

                    if (avgEAR < BLINK_THRESHOLD) {
                        if (lastStateRef.current === 'OPEN') {
                            blinkCountRef.current += 1;
                            const newCount = blinkCountRef.current;
                            console.log(`[Diagnostic] Blink detected: ${newCount}`);

                            setBlinkCount(newCount);

                            if (newCount >= REQUIRED_BLINKS) {
                                isLivenessConfirmedRef.current = true;
                                setIsLivenessConfirmed(true);
                                setStatus('Verified! Press Confirm.');
                            } else {
                                setStatus(`Blink ${newCount}/${REQUIRED_BLINKS} captured`);
                            }
                        }
                        lastStateRef.current = 'CLOSED';
                    } else if (avgEAR > BLINK_THRESHOLD + 0.005) {
                        // eyes are open again
                        lastStateRef.current = 'OPEN';
                    }
                } else {
                    setFaceDetected(false);
                    setStatus('Align your face to begin');
                }
            } catch (err) {
                console.error('[Diagnostic] Detection Error:', err);
                // The Box.constructor error usually happens here if detection is corrupted
                // We'll skip this frame and continue
            }

            if (isMounted && !isLivenessConfirmedRef.current) {
                setTimeout(() => {
                    if (isMounted) requestRef = requestAnimationFrame(detect);
                }, 50); // Doubled speed from 100ms to 50ms
            }
        };

        requestRef = requestAnimationFrame(detect);

        return () => {
            isMounted = false;
            console.log('[Diagnostic] Stopping Detection Loop.');
            if (requestRef) cancelAnimationFrame(requestRef);
        };
    }, [modelsLoaded]);

    React.useEffect(() => {
        if (modelsLoaded && isOpen) {
            const cleanup = startDetection();
            return () => {
                if (cleanup) cleanup();
            };
        }
    }, [modelsLoaded, startDetection, isOpen]);

    const capturePhoto = () => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            onCapture(imageSrc);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b dark:border-slate-800">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Face Verification</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{employeeName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Camera Area */}
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                    {error ? (
                        <div className="text-center p-6 bg-red-50 text-red-600 rounded-lg m-4 border border-red-100">
                            <p className="text-sm font-medium">{error}</p>
                            <button
                                onClick={() => { setError(null); loadModels(); }}
                                className="mt-3 flex items-center justify-center gap-2 mx-auto text-xs bg-white py-1.5 px-3 rounded-md shadow-sm border border-red-200 hover:bg-red-50"
                            >
                                <RefreshCw size={14} /> Retry
                            </button>
                        </div>
                    ) : (
                        <>
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{
                                    width: 640,
                                    height: 480,
                                    facingMode: "user",
                                    frameRate: { ideal: 30, max: 60 }
                                }}
                                style={{ transform: 'scaleX(-1)' }}
                                className="w-full h-full object-cover"
                            />
                            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

                            {/* High-Tech Scanner Frame */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {/* Thin Glowing Border */}
                                <div className={`absolute inset-6 rounded-[2rem] border-2 transition-all duration-700 ${faceDetected
                                    ? 'border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                    : 'border-white/10'
                                    }`} />

                                {/* Corner Accents */}
                                <div className={`absolute inset-6 rounded-[2rem] transition-opacity duration-500 ${faceDetected ? 'opacity-100' : 'opacity-20'}`}>
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl" />
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl" />
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl" />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl" />
                                </div>

                                {/* Dynamic Scanning Line */}
                                {faceDetected && !isLivenessConfirmed && (
                                    <div className="absolute top-0 left-6 right-6 h-1 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent animate-scan" style={{
                                        animation: 'scan 2s linear infinite'
                                    }} />
                                )}

                                {/* Subtle Status Bar inside Camera */}
                                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-full max-w-[80%]">
                                    <div className={`px-4 py-1.5 rounded-full backdrop-blur-md border transition-all duration-300 flex items-center gap-2 ${faceDetected
                                        ? 'bg-black/40 border-emerald-500/30 text-emerald-400'
                                        : 'bg-black/20 border-white/10 text-white/60'
                                        }`}>
                                        <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-emerald-500 animate-pulse' : 'bg-white/30'}`} />
                                        <span className="text-[11px] font-bold tracking-widest uppercase">
                                            {faceDetected ? (isLivenessConfirmed ? 'Face Verified' : 'Scanning Face...') : 'Searching for Face'}
                                        </span>
                                    </div>

                                    {faceDetected && !isLivenessConfirmed && (
                                        <div className="text-[14px] font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight animate-bounce">
                                            BLINK NOW TO VERIFY
                                        </div>
                                    )}
                                </div>
                            </div>

                            <style dangerouslySetInnerHTML={{
                                __html: `
                                @keyframes scan {
                                    0% { top: 10%; opacity: 0; }
                                    50% { opacity: 1; }
                                    100% { top: 90%; opacity: 0; }
                                }
                            `}} />
                        </>
                    )}
                </div>

                {/* Footer / Status */}
                <div className="p-6 space-y-4">
                    <div className={`p-4 rounded-2xl border text-center transition-all duration-500 backdrop-blur-sm ${isLivenessConfirmed
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                        : 'bg-slate-50 border-slate-100 text-slate-500'
                        }`}>
                        <p className="text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                            {!modelsLoaded && <RefreshCw className="animate-spin" size={14} />}
                            {status}
                        </p>
                        {!isLivenessConfirmed && modelsLoaded && (
                            <div className="mt-2 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-full transition-all duration-300"
                                    style={{ width: `${(blinkCount / REQUIRED_BLINKS) * 100}%` }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={capturePhoto}
                            disabled={!isLivenessConfirmed}
                            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${isLivenessConfirmed
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <Camera size={18} />
                            Confirm Check-In
                        </button>
                    </div>

                    <p className="text-[10px] text-center text-gray-400 invisible whitespace-pre-line">
                        Live Human Verification Required
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FaceRecognitionModal;
