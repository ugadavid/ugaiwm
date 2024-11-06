const vertexShaderSource = `#version 300 es
in vec4 aVertexPosition;
void main() { gl_Position = aVertexPosition; }
`;

const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uCameraPosition;
uniform vec3 uCameraDirection;

const int MAX_MARCHING_STEPS = 255;
const float MIN_DIST = 0.0;
const float MAX_DIST = 100.0;
const float EPSILON = 0.001;

mat3 rotateX(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
}

mat3 rotateY(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
}

float fibonacciSphere(vec3 p, int iterations) {
    for (int i = 0; i < iterations; i++) {
        p = abs(p) / dot(p, p) - 1.0;
    }
    return length(p) - 0.5;
}

float sceneSDF(vec3 p) {
    vec3 pRot = p * rotateY(uTime * 0.5) * rotateX(uTime * 0.25);
    return fibonacciSphere(pRot, 5);
}

vec3 estimateNormal(vec3 p) {
    return normalize(vec3(
        sceneSDF(vec3(p.x + EPSILON, p.y, p.z)) - sceneSDF(vec3(p.x - EPSILON, p.y, p.z)),
        sceneSDF(vec3(p.x, p.y + EPSILON, p.z)) - sceneSDF(vec3(p.x, p.y - EPSILON, p.z)),
        sceneSDF(vec3(p.x, p.y, p.z + EPSILON)) - sceneSDF(vec3(p.x, p.y, p.z - EPSILON))
    ));
}

float rayMarch(vec3 ro, vec3 rd) {
    float depth = MIN_DIST;
    for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
        vec3 p = ro + depth * rd;
        float dist = sceneSDF(p);
        if (dist < EPSILON) return depth;
        depth += dist;
        if (depth >= MAX_DIST) return MAX_DIST;
    }
    return MAX_DIST;
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float ambientOcclusion(vec3 p, vec3 n) {
    float stepSize = 0.1;
    float occlusion = 0.0;
    for (int i = 1; i <= 5; i++) {
        float d = float(i) * stepSize;
        occlusion += (d - sceneSDF(p + n * d)) / pow(2.0, float(i));
    }
    return clamp(1.0 - occlusion, 0.0, 1.0);
}

vec3 renderScene(vec3 ro, vec3 rd) {
    float d = rayMarch(ro, rd);
    vec3 p = ro + rd * d;
    vec3 n = estimateNormal(p);
    vec3 lightDir = normalize(vec3(1, 1, -1));
    float diffuse = max(dot(n, lightDir), 0.0);
    float specular = pow(max(dot(reflect(-lightDir, n), -rd), 0.0), 32.0);
    float ao = ambientOcclusion(p, n);

    vec3 col = vec3(0.0);
    if (d < MAX_DIST) {
        float hue = fract(uTime * 0.1 + length(p) * 0.1);
        col = hsv2rgb(vec3(hue, 1.0, diffuse)) + specular * vec3(1.0);
        col *= ao;
        col += vec3(0.5) * pow(diffuse, 10.0);
    } else {
        col = vec3(0.0);
    }

    return col;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
    vec3 ro = uCameraPosition;
    vec3 rd = normalize(uCameraDirection + uv.x * vec3(1.0, 0.0, 0.0) + uv.y * vec3(0.0, 1.0, 0.0));
    vec3 col = renderScene(ro, rd);
    fragColor = vec4(col, 1.0);
}
`;

function createShader(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error("Shader compile error: " + gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
	const program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error("Program link error: " + gl.getProgramInfoLog(program));
		return null;
	}
	return program;
}

function main() {
	const canvas = document.getElementById("FiboCanvas");
	const gl = canvas.getContext("webgl2");
	if (!gl) {
		console.error("WebGL2 is not supported");
		return;
	}

	function resizeCanvas() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	}

	window.addEventListener("resize", resizeCanvas);
	resizeCanvas();

	const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	const fragmentShader = createShader(
		gl,
		gl.FRAGMENT_SHADER,
		fragmentShaderSource
	);
	const program = createProgram(gl, vertexShader, fragmentShader);
	gl.useProgram(program);

	const positionAttributeLocation = gl.getAttribLocation(
		program,
		"aVertexPosition"
	);
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	const positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

	gl.enableVertexAttribArray(positionAttributeLocation);
	gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

	const uTimeLocation = gl.getUniformLocation(program, "uTime");
	const uResolutionLocation = gl.getUniformLocation(program, "uResolution");
	const uCameraPositionLocation = gl.getUniformLocation(
		program,
		"uCameraPosition"
	);
	const uCameraDirectionLocation = gl.getUniformLocation(
		program,
		"uCameraDirection"
	);

	let cameraPosition = [0, 0, -1];
	let cameraDirection = [0, 0, 1];
	let time = 0;

	function render(currentTime) {
		time = currentTime * 0.001;

		gl.uniform1f(uTimeLocation, time);
		gl.uniform2f(uResolutionLocation, gl.canvas.width, gl.canvas.height);
		gl.uniform3f(
			uCameraPositionLocation,
			cameraPosition[0],
			cameraPosition[1],
			cameraPosition[2]
		);
		gl.uniform3f(
			uCameraDirectionLocation,
			cameraDirection[0],
			cameraDirection[1],
			cameraDirection[2]
		);

		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		requestAnimationFrame(render);
	}

	requestAnimationFrame(render);
}

main();
