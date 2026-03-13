const faceapi = require('face-api.js');
const canvas = require('canvas');
const path = require('path');
const fs = require('fs');

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

async function loadModels() {
    const modelsPath = path.join(__dirname, '../../hrm/public/models');
    await faceapi.nets.tinyFaceDetector.loadFromDisk(modelsPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);
}

let modelsLoaded = false;

async function compareFaces(capturedImagePath, storedImagePath) {
    if (!modelsLoaded) {
        await loadModels();
        modelsLoaded = true;
    }

    if (!fs.existsSync(storedImagePath)) {
        throw new Error(`Profile image not found at ${storedImagePath}`);
    }

    const img1 = await canvas.loadImage(capturedImagePath);
    const img2 = await canvas.loadImage(storedImagePath);

    let detections1 = await faceapi.detectSingleFace(img1, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.35 })).withFaceLandmarks().withFaceDescriptor();

    // Fallback for Captured photo
    if (!detections1) {
        console.log('[FaceID] Fallback detection attempt for captured photo...');
        detections1 = await faceapi.detectSingleFace(img1, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.20, inputSize: 320 })).withFaceLandmarks().withFaceDescriptor();
    }

    // For Reference photo (img2), we try multiple thresholds to be extremely robust
    let detections2 = await faceapi.detectSingleFace(img2, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.35 })).withFaceLandmarks().withFaceDescriptor();

    if (!detections2) {
        console.log('[FaceID] Fallback detection attempt for reference photo...');
        detections2 = await faceapi.detectSingleFace(img2, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.20, inputSize: 320 })).withFaceLandmarks().withFaceDescriptor();
    }

    if (!detections1) throw new Error("No face detected in the captured photo. Please ensure your face is clearly visible and try again.");
    if (!detections2) throw new Error("No face detected in your stored reference photo. Please update your profile photo or re-register your face.");

    const distance = faceapi.euclideanDistance(detections1.descriptor, detections2.descriptor);
    return distance; // Lower is better match
}

module.exports = {
    compareFaces
};
