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


  const slope = (x1, y1, x2, y2) => {
    return (y2 - y1) / (x2 - x1);
  }
  const distance = (x1, y1, x2, y2) => {
    return Math.pow(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2), 0.5)
  }
  const roundoff = (x1, y1, x2, y2) => {
    const s = slope(x1, y1, x2, y2);
    const d = 1
    const x = Math.pow(d * ((Math.pow(d, 2)) / (1 + Math.pow(s, 2))), 0.5)
    const y = s * x
    //return -round(x, 3), -round(y, 3)
    return [-x.toFixed(3), -y.toFixed(3)]
  }
  const retrivew = (x1, y1, x2, y2, x3, y3, x4, y4) => {
    const s = slope(x1, y1, x2, y2)
    const d = distance(x3, y3, x4, y4)
    const x = Math.pow(d * (1 / (1 + Math.pow(s, 2))), 0.5) + x3
    const y = s * (x - x3) + y3
    return [x, y]
  }


  const runHandpose = async () => {
    const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet);
    console.log('Movenet model loaded.');
    const model = await tf.loadLayersModel('https://raw.githubusercontent.com/sufiyanpatel27/exercise_tracker/models/d_pull_ups/classifier/model.json')
    console.log('classification model loaded')
    const model2 = await tf.loadLayersModel('https://raw.githubusercontent.com/sufiyanpatel27/exercise_tracker/models/d_pull_ups/regressor/model.json')
    console.log('regression model loaded')
    try {
      setInterval(() => {
        detect(detector, model, model2)
      }, 1)
    } catch (error) {
      console.log('nothing')
    }
  };

  runHandpose();

  const detect = async (m_model, c_model, r_model) => {
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
        [hand[0].keypoints[6].x, hand[0].keypoints[6].y],
        [hand[0].keypoints[7].x, hand[0].keypoints[7].y],
        [hand[0].keypoints[8].x, hand[0].keypoints[8].y],
        [hand[0].keypoints[9].x, hand[0].keypoints[9].y],
        [hand[0].keypoints[10].x, hand[0].keypoints[10].y],
      ]

      for (var i = 0; i < coords.length; i++) {
        ctx.beginPath();
        ctx.arc(coords[i][0], coords[i][1], 10, 0, Math.PI * 2, true);
        ctx.fillStyle = "blue"
        ctx.fill();
      }

      //left hand
      const x = roundoff(hand[0].keypoints[5].x, hand[0].keypoints[5].y, hand[0].keypoints[7].x, hand[0].keypoints[7].y)
      let input_xs = tf.tensor2d([[x[0], x[1]]]);
      let output = c_model.predict(input_xs);
      const outputData = output.dataSync();
      //right hand
      const right_x = roundoff(hand[0].keypoints[6].x, hand[0].keypoints[6].y, hand[0].keypoints[8].x, hand[0].keypoints[8].y)
      let right_input_xs = tf.tensor2d([[right_x[0], right_x[1]]]);
      let right_output = c_model.predict(right_input_xs);
      const right_outputData = right_output.dataSync();


      //left wrist prediction
      const ans = r_model.predict(input_xs)
      const outputData_1 = ans.dataSync();
      const x_reg = retrivew(x[0], x[1], outputData_1[0], outputData_1[1], hand[0].keypoints[7].x, hand[0].keypoints[7].y, hand[0].keypoints[9].x, hand[0].keypoints[9].y)

      //right wrist prediction
      const right_ans = r_model.predict(right_input_xs)
      const right_outputData_1 = right_ans.dataSync();
      const right_x_reg = retrivew(right_x[0], right_x[1], right_outputData_1[0], right_outputData_1[1], hand[0].keypoints[8].x, hand[0].keypoints[8].y, hand[0].keypoints[10].x, hand[0].keypoints[9].y)


      if (outputData[0] == 1) {
        if ((x_reg[0] - hand[0].keypoints[9].x).toFixed(2) > 50) {
          document.getElementById('left').innerHTML = "left"
        }
        else if ((x_reg[0] - hand[0].keypoints[9].x).toFixed(2) < -50) {
          document.getElementById('left').innerHTML = "right"
        }
        else {
          document.getElementById('left').innerHTML = "good"
        }
      }
      else {
        document.getElementById('left').innerHTML = "elbow error"
      }

      if (right_outputData[0] == 1) {
        if ((right_x_reg[0] - hand[0].keypoints[10].x).toFixed(2) > 50) {
          document.getElementById('right').innerHTML = "left"
        }
        else if ((right_x_reg[0] - hand[0].keypoints[10].x).toFixed(2) < -50) {
          document.getElementById('right').innerHTML = "right"
        }
        else {
          document.getElementById('right').innerHTML = "good"
        }
      }
      else {
        document.getElementById('right').innerHTML = "elbow error"
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
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: 'black' }}>left hand : </h1>
          <h1 id="left" style={{ color: 'black' }}>left</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: 'black' }}>right hand : </h1>
          <h1 id="right" style={{ color: 'black' }}>right</h1>
        </div>
      </div>
    </div>
  );
}

export default App;
