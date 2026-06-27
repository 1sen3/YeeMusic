export const vsSource = `
precision highp float;

uniform vec2 uPoints[25];
uniform vec3 uColors[25];
uniform vec2 uTangentsU[25];
uniform vec2 uTangentsV[25];
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
    float scaledU = uv.x * 4.0;
    float scaledV = uv.y * 4.0;

    int cellX = int(min(floor(scaledU), 3.0));
    int cellY = int(min(floor(scaledV), 3.0));

    float localU = scaledU - float(cellX);
    float localV = scaledV - float(cellY);

    vec2 p00, p10, p01, p11;
    vec2 tu00, tu10, tu01, tu11;
    vec2 tv00, tv10, tv01, tv11;
    vec3 c00, c10, c01, c11;

    int idx00 = cellY * 5 + cellX;
    int idx10 = idx00 + 1;
    int idx01 = idx00 + 5;
    int idx11 = idx01 + 1;

    p00=uPoints[idx00]; p10=uPoints[idx10]; p01=uPoints[idx01]; p11=uPoints[idx11];
    tu00=uTangentsU[idx00]; tu10=uTangentsU[idx10]; tu01=uTangentsU[idx01]; tu11=uTangentsU[idx11];
    tv00=uTangentsV[idx00]; tv10=uTangentsV[idx10]; tv01=uTangentsV[idx01]; tv11=uTangentsV[idx11];
    c00=uColors[idx00]; c10=uColors[idx10]; c01=uColors[idx01]; c11=uColors[idx11];

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

mat2 rotate2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

void main() {
    float t = uTime * 4.4;

    vec2 uv = vUv;
    vec2 screen = (vUv - 0.5) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    
    // Slow, large-scale flow warping
    float flowSpeed = t * 0.18;
    vec2 flowOffset;
    flowOffset.x = fbm(uv * 1.35 + vec2(flowSpeed * 0.48, flowSpeed * 0.2));
    flowOffset.y = fbm(uv * 1.35 + vec2(-flowSpeed * 0.28, flowSpeed * 0.42) + 5.0);

    vec2 centerA = vec2(
        sin(t * 0.23 + 0.8) * 0.18,
        cos(t * 0.19 + 1.6) * 0.15
    );
    vec2 centerB = vec2(
        sin(t * 0.16 + 3.1) * 0.2,
        cos(t * 0.21 + 2.2) * 0.17
    );
    vec2 localA = screen - centerA;
    vec2 localB = screen - centerB;
    float swirlA = exp(-dot(localA, localA) * 2.2);
    float swirlB = exp(-dot(localB, localB) * 2.6);
    vec2 swirl =
        (rotate2D(0.95 + sin(t * 0.17) * 0.18) * localA - localA) * swirlA +
        (rotate2D(-0.78 + cos(t * 0.13) * 0.16) * localB - localB) * swirlB;

    float flowStrength = 0.13;
    vec2 distortedUV = uv + flowOffset * flowStrength + swirl * 0.11;

    // Gentle color blending waves
    float wave1 = sin(distortedUV.x * PI * 1.65 + t * 0.28) * 0.5 + 0.5;
    float wave2 = sin(distortedUV.y * PI * 1.72 - t * 0.23) * 0.5 + 0.5;
    float wave3 = sin((distortedUV.x + distortedUV.y) * PI * 1.15 + t * 0.16) * 0.5 + 0.5;
    float waveMix = (wave1 + wave2 + wave3) / 3.0;

    // ---- Color processing ----
    vec3 baseColor = max(vColor, 0.0);

    // Create shifted color variant for organic blending
    vec3 shiftedColor = baseColor.gbr * 0.48 + baseColor.brg * 0.32 + baseColor * 0.2;

    // Keep color drift silky instead of visibly reactive.
    float mixAmount = 0.22;
    vec3 color = mix(baseColor, shiftedColor, waveMix * mixAmount);

    float sweep =
        sin((distortedUV.x * 1.28 + distortedUV.y * 0.84 + flowOffset.x * 0.42) * PI * 2.0 + t * 0.32) *
        0.5 + 0.5;
    float breath = sin(t * 0.34 + fbm(distortedUV * 1.9 + t * 0.055) * 2.2) * 0.5 + 0.5;
    float silk = fbm(distortedUV * 2.45 + vec2(t * 0.055, -t * 0.04)) * 0.5 + 0.5;
    float cloud = fbm(distortedUV * 1.55 + flowOffset * 0.65 + vec2(t * 0.035, -t * 0.028)) * 0.5 + 0.5;
    float ribbon = smoothstep(0.32, 0.78, cloud + sweep * 0.22);
    float radial = 1.0 - smoothstep(0.0, 0.92, length(screen));
    float liquidHighlight = max(swirlA, swirlB) * (0.45 + silk * 0.55);
    vec3 ribbonColor = baseColor.brg * 0.42 + shiftedColor * 0.4 + baseColor * 0.18;
    color = mix(color, ribbonColor, ribbon * 0.16);
    color *= 0.9 + sweep * 0.11 + breath * 0.065 + silk * radial * 0.08;
    color += shiftedColor * sweep * 0.035;
    color += baseColor * radial * silk * 0.055;
    color += shiftedColor * liquidHighlight * 0.085;

    // Contrast boost
    color = (color - 0.5) * 1.09 + 0.5;
    // Saturation boost
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(gray), color, 1.16);

    // Vignette
    float dist = length(screen);
    float vignette = smoothstep(0.92, 0.12, dist);
    float mask = 0.58 + vignette * 0.42;
    color *= mask;
    color = pow(max(color, 0.0), vec3(0.96));

    // Dithering
    float dither = INV_255 * gradientNoise(gl_FragCoord.xy) - HALF_INV_255;
    color += vec3(dither);

    gl_FragColor = vec4(color, 1.0);
}
`;
