let appRunning = true;
  let appInterval;
  const classifier = knnClassifier.create();
  const webcamElement = document.getElementById('webcam');
  const predictionChartCtx = document.getElementById('predictionChart').getContext('2d');
  const classes = ['A', 'B', 'C', 'D'];

  // Create a chart to visualize prediction statistics
  const predictionChart = new Chart(predictionChartCtx, {
    type: 'bar',
    data: {
      labels: classes,
      datasets: [{
        label: 'Prediction Count',
        data: [0, 0, 0, 0],
        backgroundColor: ['rgba(54, 162, 235, 0.2)', 'rgba(75, 192, 192, 0.2)', 'rgba(255, 206, 86, 0.2)', 'rgba(255, 99, 132, 0.2)'],
        borderColor: ['rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)', 'rgba(255, 206, 86, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  async function app() {
    console.log('Loading mobilenet..');

    // Load the model.
    net = await mobilenet.load();
    console.log('Successfully loaded model');

    // Create an object from Tensorflow.js data API which could capture image from the web camera as Tensor.
    const webcam = await tf.data.webcam(webcamElement);

    // Reads an image from the webcam and associates it with a specific class index.
    const addExample = async classId => {
      // Capture an image from the web camera.
      const img = await webcam.capture();

      // Get the intermediate activation of MobileNet 'conv_preds' and pass that to the KNN classifier.
      const activation = net.infer(img, true);

      // Pass the intermediate activation to the classifier.
      classifier.addExample(activation, classId);

      // Dispose the tensor to release the memory.
      img.dispose();
    };

    // When clicking a button, add an example for that class.
    document.getElementById('class-a').addEventListener('click', () => addExample(0));
    document.getElementById('class-b').addEventListener('click', () => addExample(1));
    document.getElementById('class-c').addEventListener('click', () => addExample(2));
    document.getElementById('class-d').addEventListener('click', () => addExample(3));

    // Save classifier data
    document.getElementById('save-data').addEventListener('click', () => {
      const dataset = classifier.getClassifierDataset();
      const datasetObj = {};
      Object.keys(dataset).forEach(key => {
        datasetObj[key] = dataset[key].arraySync();
      });
      const jsonStr = JSON.stringify(datasetObj);
      localStorage.setItem('knnClassifier', jsonStr);
      Swal.fire('Saved!', 'Classifier data saved successfully!', 'success');
    });

    // Load classifier data
    document.getElementById('load-data').addEventListener('click', () => {
      const jsonStr = localStorage.getItem('knnClassifier');
      if (jsonStr) {
        const datasetObj = JSON.parse(jsonStr);
        const dataset = {};
        Object.keys(datasetObj).forEach(key => {
          dataset[key] = tf.tensor(datasetObj[key]);
        });
        classifier.setClassifierDataset(dataset);
        Swal.fire('Loaded!', 'Classifier data loaded successfully!', 'success');
      } else {
        Swal.fire('Oops!', 'No saved classifier data found!', 'error');
      }
    });

    // Reset classifier data
    document.getElementById('reset-data').addEventListener('click', () => {
      classifier.clearAllClasses();
      Swal.fire('Reset!', 'Classifier has been reset!', 'info');
      predictionChart.data.datasets[0].data = [0, 0, 0, 0];
      predictionChart.update();
    });

    // Add keyboard shortcuts for adding examples
    document.addEventListener('keydown', (event) => {
      switch (event.key) {
        case '1':
          addExample(0);
          break;
        case '2':
          addExample(1);
          break;
        case '3':
          addExample(2);
          break;
        case '4':
          addExample(3);
          break;
      }
    });

    // Add confidence indicator as progress bars
    const confidenceBarsContainer = document.getElementById('confidence-bars');
    const confidenceBars = classes.map((className, index) => {
      const container = document.createElement('div');
      container.classList.add('progress', 'my-1');
      const label = document.createElement('span');
      label.innerText = `Confidence for ${className}: `;
      const progressBar = document.createElement('div');
      progressBar.classList.add('progress-bar');
      progressBar.role = 'progressbar';
      progressBar.style.width = '0%';
      progressBar.ariaValueNow = '0';
      progressBar.ariaValueMin = '0';
      progressBar.ariaValueMax = '100';
      container.appendChild(progressBar);
      confidenceBarsContainer.appendChild(label);
      confidenceBarsContainer.appendChild(container);
      return progressBar;
    });

    // Main application loop
    async function runApp() {
      if (appRunning) {
        if (classifier.getNumClasses() > 0) {
          const img = await webcam.capture();

          // Get the activation from mobilenet from the webcam.
          const activation = net.infer(img, 'conv_preds');
          // Get the most likely class and confidence from the classifier module.
          const result = await classifier.predictClass(activation);

          document.getElementById('console').innerText = `
            Prediction: ${classes[result.label]}
            Probability: ${(result.confidences[result.label] * 100).toFixed(2)}%
          `;

          // Update the chart with the prediction result
          predictionChart.data.datasets[0].data[result.label]++;
          predictionChart.update();

          // Update confidence bars
          classes.forEach((className, index) => {
            const confidence = result.confidences[index] * 100;
            confidenceBars[index].style.width = `${confidence}%`;
            confidenceBars[index].ariaValueNow = confidence.toFixed(2);
            confidenceBars[index].innerText = `${confidence.toFixed(2)}%`;
          });

          // Dispose the tensor to release the memory.
          img.dispose();
        }

        await tf.nextFrame();
        appInterval = requestAnimationFrame(runApp);
      }
    }

    appInterval = requestAnimationFrame(runApp);
  }

  // Add fullscreen mode functionality
  document.getElementById('fullscreen').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  });

  // Start/Stop button functionality
  document.getElementById('start-stop').addEventListener('click', () => {
    if (appRunning) {
      appRunning = false;
      cancelAnimationFrame(appInterval);
      document.getElementById('start-stop').innerText = 'Start';
      document.getElementById('start-stop').classList.remove('btn-outline-danger');
      document.getElementById('start-stop').classList.add('btn-outline-success');
      alert('Stop!');
    } else {
      appRunning = true;
      appInterval = requestAnimationFrame(runApp);
      document.getElementById('start-stop').innerText = 'Stop';
      document.getElementById('start-stop').classList.remove('btn-outline-success');
      document.getElementById('start-stop').classList.add('btn-outline-danger');
      alert('Stop!');
    }
  });

  app();