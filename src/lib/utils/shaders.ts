export const vsSource = `
    void main(void) {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const fsSource = `
    precision highp float;

    uniform vec2 uResolution;
    uniform float uTime;
    uniform vec3 uColors[5];

    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

    float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    void main() {
        vec2 uv = gl_FragCoord.xy / uResolution.xy;
        float time = uTime * 0.15;
        
        float n1 = snoise(uv * 0.5 + vec2(time * 0.1, time * 0.2));
        float n2 = snoise(uv * 1.2 - vec2(time * 0.2, time * 0.1));
        vec2 distUV = uv + vec2(n1, n2) * 0.2;

        float mask1 = snoise(distUV * 0.5 + vec2(time * 0.1, 0.0)) * 0.5 + 0.5;
        float mask2 = snoise(distUV * 0.6 + vec2(0.0, time * 0.15) + 10.0) * 0.5 + 0.5;
        float mask3 = snoise(distUV * 0.4 - vec2(time * 0.1, time * 0.1) + 20.0) * 0.5 + 0.5;
        float mask4 = snoise(distUV * 0.7 + vec2(time * 0.15, -time * 0.1) + 30.0) * 0.5 + 0.5;

        vec3 finalColor = uColors[0];
        finalColor = mix(finalColor, uColors[1], mask1 * 0.6); 
        finalColor = mix(finalColor, uColors[2], mask2 * 0.6);
        finalColor = mix(finalColor, uColors[3], mask3 * 0.5);
        finalColor = mix(finalColor, uColors[4], mask4 * 0.4);

        float grain = fract(sin(dot(uv.xy, vec2(12.9898, 78.233))) * 43758.5453);
        finalColor += (grain - 0.5) * 0.03;

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;
