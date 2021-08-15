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


  const slope = (x1, y1, x2, y2) => {
    return (y2 - y1) / (x2 - x1);
  }
  const roundoff = (x1, y1, x2, y2) => {
    const s = slope(x1, y1, x2, y2);
    const d = 1
    const x = Math.pow(d * ((Math.pow(d, 2)) / (1 + Math.pow(s, 2))), 0.5)
    const y = s * x
    //return -round(x, 3), -round(y, 3)
    return [-x.toFixed(3), -y.toFixed(3)]
  }


  const runHandpose = async () => {
    const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet);
    console.log('Handpose model loaded.');
    const model = await tf.loadLayersModel('https://raw.githubusercontent.com/sufiyanpatel27/exercise_tracker/models/d_pull_ups/classifier/model.json')
    console.log('classification model loaded')
    try {
      setInterval(() => {
        detect(detector, model)
      }, 1)
    } catch (error) {
      console.log('nothing')
    }
  };

  runHandpose();

  const detect = async (m_model, c_model) => {
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

      const hand = await m_model.estimatePoses(video);

      const ctx = canvasRef.current.getContext('2d');


      var coords = [
        [hand[0].keypoints[5].x, hand[0].keypoints[5].y],
        //[hand[0].keypoints[6].x, hand[0].keypoints[6].y],
        [hand[0].keypoints[7].x, hand[0].keypoints[7].y],
        //[hand[0].keypoints[8].x, hand[0].keypoints[8].y],
        //[hand[0].keypoints[9].x, hand[0].keypoints[9].y],
        //[hand[0].keypoints[10].x, hand[0].keypoints[10].y],
      ]

      for (var i = 0; i < coords.length; i++) {
        ctx.beginPath();
        ctx.arc(coords[i][0], coords[i][1], 10, 0, Math.PI * 2, true);
        ctx.fillStyle = "blue"
        ctx.fill();
      }

      const x = roundoff(hand[0].keypoints[5].x, hand[0].keypoints[5].y, hand[0].keypoints[7].x, hand[0].keypoints[7].y)
      let input_xs = tf.tensor2d([[x[0], x[1]]]);
      let output = c_model.predict(input_xs);
      const outputData = output.dataSync();
      console.log(outputData)

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
