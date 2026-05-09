export const vsSource = `
precision highp float;

uniform vec2 uPoints[9];
uniform vec3 uColors[9];
uniform vec2 uTangentsU[9];
uniform vec2 uTangentsV[9];
uniform float uAspect;

varying vec3 vColor;
varying vec2 vUv;

mat4 H = mat4(
    2.0, -3.0, 0.0, 1.0,
   -2.0,  3.0, 0.0, 0.0,
    1.0, -2.0, 1.0, 0.0,
    1.0, -1.0, 0.0, 0.0
);

mat4 HT = mat4(
    2.0, -2.0, 1.0, 1.0,
   -3.0,  3.0,-2.0,-1.0,
    0.0,  0.0, 1.0, 0.0,
    1.0,  0.0, 0.0, 0.0
);

float hermite(vec4 U, vec4 V, mat4 C) {
    return dot(U * H * C * HT, V);
}

void main() {
    vUv = uv;
    float scaledU = uv.x * 2.0;
    float scaledV = uv.y * 2.0;

    int cellX = int(min(floor(scaledU), 1.0));
    int cellY = int(min(floor(scaledV), 1.0));

    float localU = scaledU - float(cellX);
    float localV = scaledV - float(cellY);

    vec2 p00, p10, p01, p11;
    vec2 tu00, tu10, tu01, tu11;
    vec2 tv00, tv10, tv01, tv11;
    vec3 c00, c10, c01, c11;

    int idx = cellY * 2 + cellX;

    if (idx == 0) {
        p00=uPoints[0]; p10=uPoints[1]; p01=uPoints[3]; p11=uPoints[4];
        tu00=uTangentsU[0]; tu10=uTangentsU[1]; tu01=uTangentsU[3]; tu11=uTangentsU[4];
        tv00=uTangentsV[0]; tv10=uTangentsV[1]; tv01=uTangentsV[3]; tv11=uTangentsV[4];
        c00=uColors[0]; c10=uColors[1]; c01=uColors[3]; c11=uColors[4];
    } else if (idx == 1) {
        p00=uPoints[1]; p10=uPoints[2]; p01=uPoints[4]; p11=uPoints[5];
        tu00=uTangentsU[1]; tu10=uTangentsU[2]; tu01=uTangentsU[4]; tu11=uTangentsU[5];
        tv00=uTangentsV[1]; tv10=uTangentsV[2]; tv01=uTangentsV[4]; tv11=uTangentsV[5];
        c00=uColors[1]; c10=uColors[2]; c01=uColors[4]; c11=uColors[5];
    } else if (idx == 2) {
        p00=uPoints[3]; p10=uPoints[4]; p01=uPoints[6]; p11=uPoints[7];
        tu00=uTangentsU[3]; tu10=uTangentsU[4]; tu01=uTangentsU[6]; tu11=uTangentsU[7];
        tv00=uTangentsV[3]; tv10=uTangentsV[4]; tv01=uTangentsV[6]; tv11=uTangentsV[7];
        c00=uColors[3]; c10=uColors[4]; c01=uColors[6]; c11=uColors[7];
    } else {
        p00=uPoints[4]; p10=uPoints[5]; p01=uPoints[7]; p11=uPoints[8];
        tu00=uTangentsU[4]; tu10=uTangentsU[5]; tu01=uTangentsU[7]; tu11=uTangentsU[8];
        tv00=uTangentsV[4]; tv10=uTangentsV[5]; tv01=uTangentsV[7]; tv11=uTangentsV[8];
        c00=uColors[4]; c10=uColors[5]; c01=uColors[7]; c11=uColors[8];
    }

    mat4 Cx = mat4(p00.x, p10.x, tu00.x, tu10.x, p01.x, p11.x, tu01.x, tu11.x, tv00.x, tv10.x, 0.0, 0.0, tv01.x, tv11.x, 0.0, 0.0);
    mat4 Cy = mat4(p00.y, p10.y, tu00.y, tu10.y, p01.y, p11.y, tu01.y, tu11.y, tv00.y, tv10.y, 0.0, 0.0, tv01.y, tv11.y, 0.0, 0.0);
    mat4 CR = mat4(c00.r, c10.r, 0.0, 0.0, c01.r, c11.r, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    mat4 CG = mat4(c00.g, c10.g, 0.0, 0.0, c01.g, c11.g, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    mat4 CB = mat4(c00.b, c10.b, 0.0, 0.0, c01.b, c11.b, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);

    vec4 U = vec4(localU*localU*localU, localU*localU, localU, 1.0);
    vec4 V = vec4(localV*localV*localV, localV*localV, localV, 1.0);

    float posX = hermite(U, V, Cx);
    float posY = hermite(U, V, Cy);

    float aspectX = max(1.0, uAspect);
    float aspectY = max(1.0, 1.0 / uAspect);

    gl_Position = vec4(posX / aspectX, posY / aspectY, 0.0, 1.0);

    vColor = vec3(hermite(U, V, CR), hermite(U, V, CG), hermite(U, V, CB));
}
`;

export const fsSource = `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uVolume;
varying vec3 vColor;
varying vec2 vUv;

const float INV_255 = 1.0 / 255.0;
const float HALF_INV_255 = 0.5 / 255.0;
const float GRADIENT_NOISE_A = 52.9829189;
const vec2 GRADIENT_NOISE_B = vec2(0.06711056, 0.00583715);
const float PI = 3.14159265;

float gradientNoise(in vec2 uv) {
    return fract(GRADIENT_NOISE_A * fract(dot(uv, GRADIENT_NOISE_B)));
}

// Simple 2D hash for flow noise
vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
}

// Smooth noise for organic flow
float noise2D(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = dot(hash22(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
    float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
    float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
    float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Fractal Brownian motion
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
        value += amplitude * noise2D(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    float t = uTime * 6.0; // gentle flow (~0.3x real-time)

    float vol = clamp(uVolume, 0.0, 1.0);
    float volPulse = vol * vol;

    vec2 uv = vUv;
    
    // Slow, large-scale flow warping
    float flowSpeed = t * 0.2;
    vec2 flowOffset;
    flowOffset.x = fbm(uv * 1.8 + vec2(flowSpeed * 0.5, flowSpeed * 0.2));
    flowOffset.y = fbm(uv * 1.8 + vec2(-flowSpeed * 0.3, flowSpeed * 0.4) + 5.0);
    
    // Volume-reactive ripple (subtle)
    float volFlow = volPulse * 0.08;
    flowOffset.x += sin(uv.y * PI * 2.5 + t * 1.2) * volFlow;
    flowOffset.y += cos(uv.x * PI * 2.5 + t * 1.0) * volFlow;
    
    float flowStrength = 0.08 + volPulse * 0.05;
    vec2 distortedUV = uv + flowOffset * flowStrength;

    // Gentle color blending waves
    float wave1 = sin(distortedUV.x * PI * 2.0 + t * 0.35) * 0.5 + 0.5;
    float wave2 = sin(distortedUV.y * PI * 2.0 - t * 0.28) * 0.5 + 0.5;
    float wave3 = sin((distortedUV.x + distortedUV.y) * PI * 1.5 + t * 0.2) * 0.5 + 0.5;
    // Volume-reactive wave (only visible when playing)
    float wave4 = sin((distortedUV.x - distortedUV.y) * PI * 3.0 + t * 1.8) * 0.5 + 0.5;

    float waveMix = (wave1 + wave2 + wave3) / 3.0;
    waveMix = mix(waveMix, wave4, volPulse * 0.25);

    // ---- Color processing ----
    vec3 baseColor = max(vColor, 0.0);

    // Create shifted color variant for organic blending
    vec3 shiftedColor = baseColor.gbr * 0.6 + baseColor.brg * 0.4;

    // Mix strength: base amount + volume boost for reactive color shifting
    float mixAmount = 0.15 + volPulse * 0.15;
    vec3 color = mix(baseColor, shiftedColor, waveMix * mixAmount);

    // Volume-reactive brightness pulse (subtle)
    color *= 1.0 + volPulse * 0.1;

    // Contrast boost
    color = (color - 0.5) * 1.1 + 0.5;
    // Saturation boost
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(gray), color, 1.3);

    // Vignette
    float dist = distance(vUv, vec2(0.5));
    float vignette = smoothstep(0.8, 0.2, dist);
    float mask = 0.55 + vignette * 0.45;
    color *= mask;

    // Dithering
    float dither = INV_255 * gradientNoise(gl_FragCoord.xy) - HALF_INV_255;
    color += vec3(dither);

    gl_FragColor = vec4(color, 1.0);
}
`;
