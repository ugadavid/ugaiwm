"use strict";
const vertexShaderSource = `#version 300 es
in vec4 aVertexPosition;
void main() { gl_Position = aVertexPosition; }
`;

const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform float uTime;
uniform vec2 uResolution;
const int MAX_MARCHING_STEPS = 255;
const float MIN_DIST = 0.0;
const float MAX_DIST = 100.0;
const float EPSILON = 0.0001;

mat2 rotate2d(float angle) { return mat2(cos(angle), -sin(angle), sin(angle), cos(angle)); }

float sdTorus(vec3 p, vec2 t) { vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }

float sceneSDF(vec3 samplePoint) {
    samplePoint.xz *= rotate2d(uTime * 0.5);
    samplePoint.xy *= rotate2d(uTime * 0.3);
    float pulse = 1.0 + 0.2 * sin(uTime * 4.0);
    vec3 z = samplePoint;
    float d = sdTorus(z, vec2(1.0 * pulse, 0.2 * pulse));
    float s = 1.0;
    for (int i = 0; i < 4; i++) {
        z = abs(z) / dot(z, z) - 1.0;
        float newD = sdTorus(z, vec2(1.0 * pulse * s, 0.2 * pulse * s));
        d = min(d, newD);
        s *= 0.5;
    }
    return d;
}

float shortestDistanceToSurface(vec3 eye, vec3 marchingDirection, float start, float end) {
    float depth = start;
    for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
        float dist = sceneSDF(eye + depth * marchingDirection);
        if (dist < EPSILON) return depth;
        depth += dist;
        if (depth >= end) return end;
    }
    return end;
}

vec3 rayDirection(float fieldOfView, vec2 size, vec2 fragCoord) {
    vec2 xy = fragCoord - size / 2.0;
    float z = size.y / tan(radians(fieldOfView) / 2.0);
    return normalize(vec3(xy, -z));
}

vec3 estimateNormal(vec3 p) {
    return normalize(vec3(
        sceneSDF(vec3(p.x + EPSILON, p.y, p.z)) - sceneSDF(vec3(p.x - EPSILON, p.y, p.z)),
        sceneSDF(vec3(p.x, p.y + EPSILON, p.z)) - sceneSDF(vec3(p.x, p.y - EPSILON, p.z)),
        sceneSDF(vec3(p.x, p.y, p.z + EPSILON)) - sceneSDF(vec3(p.x, p.y, p.z - EPSILON))
    ));
}

vec3 phongContribForLight(vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye, vec3 lightPos, vec3 lightIntensity) {
    vec3 N = estimateNormal(p);
    vec3 L = normalize(lightPos - p);
    vec3 V = normalize(eye - p);
    vec3 R = normalize(reflect(-L, N));
    float dotLN = dot(L, N);
    float dotRV = dot(R, V);
    if (dotLN < 0.0) return vec3(0.0, 0.0, 0.0);
    if (dotRV < 0.0) return lightIntensity * (k_d * dotLN);
    return lightIntensity * (k_d * dotLN + k_s * pow(dotRV, alpha));
}

vec3 phongIllumination(vec3 k_a, vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye) {
    const vec3 ambientLight = 0.5 * vec3(1.0, 1.0, 1.0);
    vec3 color = ambientLight * k_a;
    vec3 light1Pos = vec3(4.0 * sin(uTime), 2.0, 4.0 * cos(uTime));
    vec3 light1Intensity = vec3(0.4, 0.4, 0.4);
    color += phongContribForLight(k_d, k_s, alpha, p, eye, light1Pos, light1Intensity);
    return color;
}

vec3 orbitColor(vec3 p, float t) {
    float angle = atan(p.z, p.x) + t;
    float radius = length(p.xz);
    return vec3(0.5 + 0.5 * sin(angle), 0.5 + 0.5 * sin(angle + 2.0 * 3.141592653589793 / 3.0), 0.5 + 0.5 * sin(angle + 4.0 * 3.141592653589793 / 3.0));
}

void main() {
    vec3 dir = rayDirection(45.0, uResolution, gl_FragCoord.xy);
    vec3 eye = vec3(0.0, 0.0, 5.0);
    float dist = shortestDistanceToSurface(eye, dir, MIN_DIST, MAX_DIST);
    if (dist > MAX_DIST - EPSILON) { fragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
    vec3 p = eye + dist * dir;
    vec3 K_a = orbitColor(p, uTime);
    vec3 K_d = orbitColor(p, uTime + 1.0);
    vec3 K_s = orbitColor(p, uTime + 2.0);
    float shininess = 10.0;
    vec3 color = phongIllumination(K_a, K_d, K_s, shininess, p, eye);
    fragColor = vec4(color, 1.0);
}
`;

function createShader(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error(
			"An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader)
		);
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
		console.error(
			"Unable to initialize the shader program: " + gl.getProgramInfoLog(program)
		);
		return null;
	}
	return program;
}

function main() {
	const canvas = document.getElementById("TorusCanvas");
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
	const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(positionAttributeLocation);
	gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

	const uTimeLocation = gl.getUniformLocation(program, "uTime");
	const uResolutionLocation = gl.getUniformLocation(program, "uResolution");

	function render(time) {
		time *= 0.001;
		gl.uniform1f(uTimeLocation, time);
		gl.uniform2f(uResolutionLocation, gl.canvas.width, gl.canvas.height);
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		requestAnimationFrame(render);
	}

	requestAnimationFrame(render);
}

main();
