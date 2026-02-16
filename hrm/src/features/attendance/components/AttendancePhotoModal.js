import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, X, RefreshCw, CheckCircle2, UserCheck, UserMinus, Loader2, Sparkles } from 'lucide-react';

export default function AttendancePhotoModal({ isOpen, onClose, onCapture, punchType }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [photo, setPhoto] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [beautyFilter, setBeautyFilter] = useState(true); // Default to ON as requested
    const detectionInterval = useRef(null);

    // Filter CSS string
    const BEAUTY_FILTER_CSS = "brightness(1.08) contrast(1.05) saturate(1.1) blur(0.4px)";

    // Load Face-API models
    useEffect(() => {
        const loadModels = async () => {
            if (!window.faceapi) {
                console.error("Face-API not found on window");
                return;
            }
            try {
                setLoading(true);
                const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
                await Promise.all([
                    window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                ]);
                setModelsLoaded(true);
            } catch (err) {
                console.error("Error loading face detection models:", err);
                setError("Failed to load face detection models. Please check your internet connection.");
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && !modelsLoaded) {
            loadModels();
        }
    }, [isOpen, modelsLoaded]);

    const startCamera = useCallback(async () => {
        try {
            setError(null);
            setLoading(true);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setError("Camera access denied or not available.");
        } finally {
            setLoading(false);
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (detectionInterval.current) {
            clearInterval(detectionInterval.current);
            detectionInterval.current = null;
        }
        setFaceDetected(false);
        setDetecting(false);
    }, [stream]);

    // Face detection loop
    useEffect(() => {
        if (stream && modelsLoaded && videoRef.current && !photo) {
            setDetecting(true);
            detectionInterval.current = setInterval(async () => {
                if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

                try {
                    const detections = await window.faceapi.detectAllFaces(
                        videoRef.current,
                        new window.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
                    );
                    setFaceDetected(detections.length > 0);
                } catch (err) {
                }
            }, 500);
        } else {
            if (detectionInterval.current) {
                clearInterval(detectionInterval.current);
                detectionInterval.current = null;
            }
            setDetecting(false);
        }

        return () => {
            if (detectionInterval.current) {
                clearInterval(detectionInterval.current);
            }
        };
    }, [stream, modelsLoaded, photo]);

    useEffect(() => {
        if (isOpen && !photo) {
            startCamera();
        }
        return () => stopCamera();
    }, [isOpen]);

    const capturePhoto = () => {
        if (!faceDetected) {
            setError("Face not detected. Please position your face clearly.");
            return;
        }
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        if (beautyFilter) {
            context.filter = BEAUTY_FILTER_CSS;
        } else {
            context.filter = 'none';
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhoto(dataUrl);
        stopCamera();
    };

    const retake = () => {
        setPhoto(null);
        setFaceDetected(false);
        setError(null);
        startCamera();
    };

    const handleConfirm = () => {
        onCapture(photo);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in text-slate-900 dark:text-white">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-5 py-4 border-b dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${punchType === 'IN' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            <Camera size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-white">Face Verification</h3>
                            <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                                Mandatory Face Check
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 overflow-y-auto text-slate-900">
                    {!photo ? (
                        <div className="space-y-4">
                            <div className={`relative aspect-video bg-black rounded-xl overflow-hidden shadow-inner border-4 transition-colors duration-300 ${faceDetected ? 'border-emerald-500 shadow-emerald-500/20' : 'border-slate-800'}`}>
                                {loading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/50 z-20 gap-3">
                                        <Loader2 className="animate-spin" size={32} />
                                        <span className="text-sm font-medium">Please wait...</span>
                                    </div>
                                )}

                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover scale-x-[-1] transition-all duration-300"
                                    style={{ filter: beautyFilter ? BEAUTY_FILTER_CSS : 'none' }}
                                />

                                {stream && modelsLoaded && !loading && (
                                    <div className="absolute top-4 left-4 z-30">
                                        <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 backdrop-blur-md shadow-lg transition-all ${faceDetected ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'}`}>
                                            {faceDetected ? (
                                                <><UserCheck size={14} /> Face Detected</>
                                            ) : (
                                                <><UserMinus size={14} /> Searching Face</>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {stream && !loading && (
                                    <div className="absolute top-4 right-4 z-30">
                                        <button
                                            onClick={() => setBeautyFilter(!beautyFilter)}
                                            className={`p-2 rounded-full backdrop-blur-md shadow-lg transition-all ${beautyFilter ? 'bg-amber-400 text-white' : 'bg-gray-800/60 text-gray-300 hover:bg-gray-800'}`}
                                            title={beautyFilter ? "Beauty Filter On" : "Beauty Filter Off"}
                                        >
                                            <Sparkles size={18} className={beautyFilter ? "animate-pulse" : ""} />
                                        </button>
                                    </div>
                                )}

                                {stream && !photo && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                        <div className={`w-48 h-64 border-2 border-dashed rounded-[3rem] transition-all duration-500 ${faceDetected ? 'border-emerald-400 scale-110 opacity-50' : 'border-white/30 scale-100 opacity-100'}`} />
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 p-3 rounded-lg flex items-start gap-3">
                                    <X className="text-rose-600 shrink-0 mt-0.5" size={16} />
                                    <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">{error}</p>
                                </div>
                            )}

                            <div className="text-center">
                                <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-tight">
                                    {faceDetected
                                        ? "Perfect! You can now capture your photo."
                                        : "Please align your face within the guide."}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border-4 border-emerald-500 shadow-xl">
                                <img src={photo} alt="Captured" className="w-full h-full object-cover scale-x-[-1]" />
                                <div className="absolute top-4 right-4 animate-bounce">
                                    <div className="bg-emerald-500 text-white p-2 rounded-full shadow-lg">
                                        <CheckCircle2 size={24} />
                                    </div>
                                </div>
                            </div>
                            <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                                <p className="text-sm font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-tighter">Identity Verified</p>
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold uppercase mt-1">Ready for Attendance Submission</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-5 py-5 bg-gray-50 dark:bg-slate-800/50 border-t dark:border-slate-700 flex flex-col gap-3">
                    {!photo ? (
                        <button
                            onClick={capturePhoto}
                            disabled={!faceDetected || loading}
                            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl ${!faceDetected || loading
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed grayscale'
                                : 'bg-customRed text-white hover:bg-customRed/90 active:scale-95 shadow-red-200'
                                }`}
                        >
                            <Camera size={20} />
                            {faceDetected ? "Capture Verified Photo" : "Waiting for Face"}
                        </button>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={retake}
                                className="py-4 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={16} />
                                Retake
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 animate-pulse"
                            >
                                <CheckCircle2 size={16} />
                                Confirm Punch
                            </button>
                        </div>
                    )}
                </div>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
        </div>
    );
}
