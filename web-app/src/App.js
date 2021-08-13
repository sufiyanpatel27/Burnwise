import logo from './logo.svg';
import './App.css';
import React, { useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import Webcam from 'react-webcam';


import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { getCoordsDataType } from '@tensorflow/tfjs-backend-webgl/dist/shader_compiler';

// Create a detector.

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [p, setp] = useState([]);

  const runHandpose = async () => {
    console.log('loading model');
    const detector = await poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, { runtime: 'tfjs', modelType: 'lite' });
    console.log('Handpose model loaded.');
    try {
      setInterval(() => {
        detect(detector)
      }, 1)
    } catch (error) {
      console.log('nothing')
    }
  };

  runHandpose();


  const detect = async (model) => {
    if (
      typeof webcamRef.current !== 'undefined' &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const hand = await model.estimatePoses(video);

      const ctx = canvasRef.current.getContext('2d');


      var coords = [
        [hand[0].keypoints[11].x, hand[0].keypoints[11].y],
        [hand[0].keypoints[12].x, hand[0].keypoints[12].y],
        [hand[0].keypoints[13].x, hand[0].keypoints[13].y],
        [hand[0].keypoints[14].x, hand[0].keypoints[14].y],
        [hand[0].keypoints[15].x, hand[0].keypoints[15].y],
        [hand[0].keypoints[16].x, hand[0].keypoints[16].y],
      ]

      for (var i = 0; i < coords.length; i++) {
        ctx.beginPath();
        ctx.arc(coords[i][0], coords[i][1], 10, 0, Math.PI * 2, true);
        ctx.fillStyle = "blue"
        ctx.fill();
      }

    }
  }




  return (
    <div className="App">
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          style={{
            position: 'absolute',
            marginLeft: 'auto',
            marginRight: 'auto',
            left: 0,
            right: 0,
            textAlign: 'center',
            zindex: 9,
            width: 933.33,
            height: 700
          }} />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            marginLeft: 'auto',
            marginRight: 'auto',
            left: 0,
            right: 0,
            textAlign: 'center',
            zindex: 9,
            width: 933.33,
            height: 700,
          }} />
      </header>
      <h1 style={{ color: 'black' }}>{p}fsdfsd</h1>
    </div>
  );
}

export default App;
