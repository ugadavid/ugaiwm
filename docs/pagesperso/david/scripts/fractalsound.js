const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
	console.error('WebGL not supported');
	throw new Error('WebGL not supported');
}

const vsSource = document.getElementById('vs').text;
const fsSource = document.getElementById('fs').text;

function createShader(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
	console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
	throw new Error('Shader program failed to link');
}

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positions = [-1, -1, 1, -1, -1, 1, 1, 1];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

const resolutionUniformLocation = gl.getUniformLocation(program, 'iResolution');
const timeUniformLocation = gl.getUniformLocation(program, 'iTime');
const audioLowUniformLocation = gl.getUniformLocation(program, 'iAudioLow');
const audioMidUniformLocation = gl.getUniformLocation(program, 'iAudioMid');
const audioHighUniformLocation = gl.getUniformLocation(program, 'iAudioHigh');
const sunControlUniformLocation = gl.getUniformLocation(program, 'iSunControl');
const treeControlUniformLocation = gl.getUniformLocation(program, 'iTreeControl');
const skyControlUniformLocation = gl.getUniformLocation(program, 'iSkyControl');
const wavesControlUniformLocation = gl.getUniformLocation(program, 'iWavesControl');
const sunSensitivityUniformLocation = gl.getUniformLocation(program, 'iSunSensitivity');
const treeSensitivityUniformLocation = gl.getUniformLocation(program, 'iTreeSensitivity');
const skySensitivityUniformLocation = gl.getUniformLocation(program, 'iSkySensitivity');
const wavesSensitivityUniformLocation = gl.getUniformLocation(program, 'iWavesSensitivity');
const colorShiftUniformLocation = gl.getUniformLocation(program, 'iColorShift');

function resizeCanvasToDisplaySize(canvas) {
	const displayWidth  = canvas.clientWidth;
	const displayHeight = canvas.clientHeight;
	if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
		canvas.width  = displayWidth;
		canvas.height = displayHeight;
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	}
}

// Audio setup
let audioContext, analyser, audioSource;
const audioUpload = document.getElementById('audioUpload');
const playPauseButton = document.getElementById('playPause');
let audioElement;

audioUpload.addEventListener('change', function(e) {
	const file = e.target.files[0];
	const reader = new FileReader();
	reader.onload = function(e) {
		setupAudio(e.target.result);
	};
	reader.readAsDataURL(file);
});

playPauseButton.addEventListener('click', function() {
	if (audioElement) {
		if (audioElement.paused) {
			audioElement.play();
		} else {
			audioElement.pause();
		}
	}
});

function setupAudio(url) {
	if (audioContext) audioContext.close();

	audioContext = new (window.AudioContext || window.webkitAudioContext)();
	analyser = audioContext.createAnalyser();
	analyser.fftSize = 256;

	audioElement = new Audio(url);
	audioElement.loop = true; // Make the audio loop
	audioSource = audioContext.createMediaElementSource(audioElement);
	audioSource.connect(analyser);
	analyser.connect(audioContext.destination);

	audioElement.play();
}

// Set up default audio
const defaultAudioUrl = 'https://audionautix.com/Music/12Mornings.mp3';
setupAudio(defaultAudioUrl);

function getAudioData() {
	if (!analyser) return { low: 0, mid: 0, high: 0 };

	const dataArray = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(dataArray);

	const bass = dataArray.slice(0, 8);
	const mid = dataArray.slice(8, 24);
	const treble = dataArray.slice(24, 64);

	return {
		low: bass.reduce((a, b) => a + b) / bass.length / 255,
		mid: mid.reduce((a, b) => a + b) / mid.length / 255,
		high: treble.reduce((a, b) => a + b) / treble.length / 255
	};
}

const sunControl = document.getElementById('sunControl');
const treeControl = document.getElementById('treeControl');
const skyControl = document.getElementById('skyControl');
const wavesControl = document.getElementById('wavesControl');
const sunSensitivity = document.getElementById('sunSensitivity');
const treeSensitivity = document.getElementById('treeSensitivity');
const skySensitivity = document.getElementById('skySensitivity');
const wavesSensitivity = document.getElementById('wavesSensitivity');

function getControlValue(control) {
	switch(control.value) {
		case 'bass': return 0;
		case 'mid': return 1;
		case 'treble': return 2;
		default: return 0;
	}
}

let colorShift = [0, 0, 0];
let colorIndex = 0;
const colors = [
	[0, 0, 0],    // No shift
	[0.2, 0, 0],  // Red shift
	[0, 0.2, 0],  // Green shift
	[0, 0, 0.2],  // Blue shift
];

document.addEventListener('keydown', function(event) {
	if (event.key === 'c') {
		colorIndex = (colorIndex + 1) % colors.length;
		colorShift = colors[colorIndex];
	}
});

function render(time) {
	time *= 0.001;  // Convert to seconds

	resizeCanvasToDisplaySize(gl.canvas);

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.useProgram(program);
	gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
	gl.uniform1f(timeUniformLocation, time);

	const audioData = getAudioData();
	gl.uniform1f(audioLowUniformLocation, audioData.low);
	gl.uniform1f(audioMidUniformLocation, audioData.mid);
	gl.uniform1f(audioHighUniformLocation, audioData.high);

	gl.uniform1i(sunControlUniformLocation, getControlValue(sunControl));
	gl.uniform1i(treeControlUniformLocation, getControlValue(treeControl));
	gl.uniform1i(skyControlUniformLocation, getControlValue(skyControl));
	gl.uniform1i(wavesControlUniformLocation, getControlValue(wavesControl));

	gl.uniform1f(sunSensitivityUniformLocation, sunSensitivity.value / 100);
	gl.uniform1f(treeSensitivityUniformLocation, treeSensitivity.value / 100);
	gl.uniform1f(skySensitivityUniformLocation, skySensitivity.value / 100);
	gl.uniform1f(wavesSensitivityUniformLocation, wavesSensitivity.value / 100);

	gl.uniform3fv(colorShiftUniformLocation, colorShift);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	requestAnimationFrame(render);
}

requestAnimationFrame(render);

// Add show/hide functionality for controls
const toggleControlsButton = document.getElementById('toggleControls');
const controlsPanel = document.getElementById('controls');

toggleControlsButton.addEventListener('click', function() {
	controlsPanel.classList.toggle('hidden');
});
