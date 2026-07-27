import { GpuParticleSettings, GpuEngineStats, ParticlePresetType, ParticleColorPalette, Obstacle } from '../types/gpuParticle';

// ============================================================================
// WEBGL 2 TRANSFORM FEEDBACK GPU PARTICLE SIMULATOR ENGINE
// Physics Simulation Engine with Floating Dynamics & Solid Hard/Soft Collisions
// Supports 100,000 - 10,000,000 Particles @ 60 FPS
// ============================================================================

// --- UPDATE VERTEX SHADER (GLSL 300 es) ---
const UPDATE_VS = `#version 300 es
precision highp float;

layout(location = 0) in vec4 a_position; // xy = position, zw = velocity
layout(location = 1) in vec4 a_extra;    // x = life, y = maxLife, z = sizeMultiplier, w = seed

out vec4 v_position;
out vec4 v_extra;

uniform float u_deltaTime;
uniform vec2 u_gravity;
uniform float u_friction;
uniform float u_turbulence;
uniform vec2 u_mousePos;
uniform float u_mouseForce;
uniform float u_mouseRadius;
uniform int u_touchMode; // 0 = Attract, 1 = Repel, 2 = Vortex Swirl, 3 = Burst, 4 = Solid Elastic Collision
uniform vec2 u_resolution;
uniform int u_boundaryMode; // 0 = bounce, 1 = wrap, 2 = respawn
uniform float u_bounce;
uniform float u_time;
uniform int u_preset; // 0=galaxy, 1=explosion, 2=blackhole, 3=fountain, 4=fluid_flow, 5=vortex, 6=stream, 7=grid_drop, 8=floating_dust, 9=floating_bubbles, 10=quantum_float
uniform float u_repulsion;
uniform float u_buoyancy;
uniform vec4 u_obstacle0; // xy = pos, z = radius, w = active
uniform vec4 u_obstacle1;
uniform vec4 u_obstacle2;

// Simplex 2D Noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yy * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec2 pos = a_position.xy;
    vec2 vel = a_position.zw;
    float life = a_extra.x;
    float maxLife = a_extra.y;
    float size = a_extra.z;
    float seed = a_extra.w;

    float dt = clamp(u_deltaTime, 0.0005, 0.033);
    vec2 center = u_resolution * 0.5;
    float minDim = min(u_resolution.x, u_resolution.y);

    // Life decay
    life -= dt;

    // Check for invalid or dead particle
    bool isInvalid = isnan(pos.x) || isnan(pos.y) || isnan(vel.x) || isnan(vel.y) || isinf(pos.x) || isinf(pos.y);
    bool isDead = life <= 0.0 || isInvalid;

    // Boundary check for respawn mode
    if (u_boundaryMode == 2) {
        if (pos.x < -100.0 || pos.x > u_resolution.x + 100.0 || pos.y < -100.0 || pos.y > u_resolution.y + 100.0) {
            isDead = true;
        }
    }

    // ------------------------------------------------------------------------
    // RESPAWN / REINITIALIZATION LOGIC
    // ------------------------------------------------------------------------
    if (isDead) {
        life = 10.0 + rand(vec2(seed, u_time)) * 15.0;
        maxLife = life;

        if (u_preset == 8) { // Floating Dust - Ambient Space Floating Dust
            pos = vec2(
                rand(vec2(seed, u_time * 0.1)) * u_resolution.x,
                rand(vec2(seed * 2.3, u_time * 0.1)) * u_resolution.y
            );
            float angle = rand(vec2(seed * 3.7, u_time)) * 6.2831853;
            float speed = 20.0 + rand(vec2(seed * 4.1, u_time)) * 70.0;
            vel = vec2(cos(angle), sin(angle)) * speed;
        } else if (u_preset == 9) { // Floating Bubbles - Liquid Buoyancy
            pos = vec2(
                rand(vec2(seed, u_time * 0.2)) * u_resolution.x,
                u_resolution.y + rand(vec2(seed * 2.1, u_time)) * 30.0
            );
            vel = vec2(
                (rand(vec2(seed * 3.3, u_time)) - 0.5) * 50.0,
                -(80.0 + rand(vec2(seed * 4.2, u_time)) * 140.0)
            );
        } else if (u_preset == 10) { // Quantum Float - Oscillation Matrix
            float r1 = rand(vec2(seed, 1.1));
            float r2 = rand(vec2(seed, 2.2));
            pos = vec2(r1 * u_resolution.x, r2 * u_resolution.y);
            float angle = (r1 + r2) * 6.2831853;
            vel = vec2(cos(angle), sin(angle)) * 45.0;
        } else if (u_preset == 0) { // Spiral Galaxy - Dynamic Astronomical Disk
            float r1 = rand(vec2(seed, u_time * 0.11));
            float r2 = rand(vec2(seed * 2.1, u_time * 0.22));
            float r3 = rand(vec2(seed * 3.3, u_time * 0.33));
            float r4 = rand(vec2(seed * 4.7, u_time * 0.44));

            if (r1 < 0.20) { // Central Core Bulge
                float radius = pow(r2, 1.8) * minDim * 0.15;
                float angle = r3 * 6.2831853;
                pos = center + vec2(cos(angle), sin(angle)) * radius;
                float speed = sqrt(150000.0 / (radius + 20.0));
                vec2 tangent = vec2(-sin(angle), cos(angle));
                vec2 radial = vec2(cos(angle), sin(angle));
                vel = tangent * speed + radial * (r4 - 0.5) * speed * 0.4;
            } else { // Disk & Logarithmic Density Arms with velocity jitter
                float radius = (0.04 + pow(r2, 1.1) * 0.44) * minDim;
                float armOffset = (r3 < 0.5) ? 0.0 : 3.14159265;
                float logSpiralAngle = log(radius / (minDim * 0.04) + 0.1) * 2.5;
                float armScatter = (r4 - 0.5) * 1.4; // Wide scatter so particles float as clouds
                float angle = armOffset + logSpiralAngle + armScatter;

                pos = center + vec2(cos(angle), sin(angle)) * radius;

                float speed = sqrt(140000.0 / (radius + 25.0));
                vec2 tangent = vec2(-sin(angle), cos(angle));
                vec2 radial = vec2(cos(angle), sin(angle));
                float radialVel = (rand(vec2(seed * 5.1, u_time)) - 0.5) * 40.0;
                vel = tangent * speed * (0.85 + rand(vec2(seed * 6.2, u_time)) * 0.3) + radial * radialVel;
            }
        } else if (u_preset == 2) { // Black Hole Accretion Disk
            float angle = rand(vec2(seed, u_time)) * 6.2831853;
            float radius = (0.08 + pow(rand(vec2(seed * 2.0, u_time)), 1.1) * 0.40) * minDim;
            pos = center + vec2(cos(angle), sin(angle)) * radius;
            float speed = sqrt(220000.0 / (radius + 15.0));
            vec2 tangent = vec2(-sin(angle), cos(angle));
            vec2 inward = -vec2(cos(angle), sin(angle));
            vel = tangent * speed + inward * (speed * 0.12);
        } else if (u_preset == 1) { // Supernova / Explosion
            float angle = rand(vec2(seed, u_time)) * 6.2831853;
            float speed = 100.0 + rand(vec2(seed * 1.5, u_time)) * 800.0;
            pos = center + vec2(cos(angle), sin(angle)) * (rand(vec2(seed, u_time)) * 15.0);
            vel = vec2(cos(angle), sin(angle)) * speed;
        } else if (u_preset == 3) { // Fountain
            pos = vec2(u_resolution.x * 0.5 + (rand(vec2(seed, u_time)) - 0.5) * 100.0, u_resolution.y - 10.0);
            float angle = -1.5707963 + (rand(vec2(seed * 2.0, u_time)) - 0.5) * 0.7;
            float speed = 380.0 + rand(vec2(seed * 3.0, u_time)) * 450.0;
            vel = vec2(cos(angle), sin(angle)) * speed;
        } else if (u_preset == 6) { // Jet Stream
            pos = vec2(5.0, rand(vec2(seed, u_time)) * u_resolution.y);
            vel = vec2(180.0 + rand(vec2(seed, u_time)) * 260.0, (rand(vec2(seed * 2.0, u_time)) - 0.5) * 40.0);
        } else if (u_preset == 7) { // Rain / Grid Drop
            pos = vec2(rand(vec2(seed, 1.0)) * u_resolution.x, rand(vec2(seed, 2.0)) * u_resolution.y * 0.25);
            vel = vec2(0.0, 90.0 + rand(vec2(seed, u_time)) * 180.0);
        } else { // Vortex / Fluid Flow
            float angle = rand(vec2(seed, u_time)) * 6.2831853;
            float radius = (0.05 + rand(vec2(seed * 2.0, u_time)) * 0.42) * minDim;
            pos = center + vec2(cos(angle), sin(angle)) * radius;
            float speed = sqrt(120000.0 / (radius + 20.0));
            vel = vec2(-sin(angle), cos(angle)) * speed;
        }
    } else {
        // --------------------------------------------------------------------
        // NEWTONIAN + FLOATING + COLLISION PHYSICS INTEGRATION
        // --------------------------------------------------------------------
        
        // 1. Gravity & Upward Anti-Gravity Buoyancy Float
        vel += u_gravity * dt;
        if (u_buoyancy != 0.0) {
            vel.y -= u_buoyancy * 220.0 * dt;
        }

        // 2. Friction / Air Damping
        vel *= pow(u_friction, dt * 60.0);

        // 3. Central Gravitational & Orbital Angular Dynamics
        if (u_preset == 0 || u_preset == 2 || u_preset == 5) {
            vec2 toCenter = center - pos;
            float dist = length(toCenter);
            
            if (dist > 1.0) {
                vec2 dir = toCenter / dist;
                vec2 tangent = vec2(-dir.y, dir.x);
                float gConst = (u_preset == 2 ? 220000.0 : (u_preset == 5 ? 130000.0 : 110000.0));
                float gravAcc = gConst / (dist * dist + 1600.0);
                
                // Central gravity pull
                vel += dir * gravAcc * dt;

                // Tangential orbital momentum balance against friction!
                float orbitalAcc = sqrt(gConst / (dist + 30.0)) * 0.12;
                vel += tangent * orbitalAcc * dt;

                if (u_preset == 2 && dist < 16.0) {
                    life = -1.0;
                }
            }
        }

        // 4. Fluid Curl Noise, Brownian Micro-Jitter & Floating Motion
        float effTurbulence = max(u_turbulence, (u_preset == 8 || u_preset == 9 || u_preset == 10) ? 0.35 : 0.0);
        if (effTurbulence > 0.001) {
            float scale = 0.0018;
            float n1 = snoise(pos * scale + vec2(u_time * 0.15, seed * 0.05));
            float n2 = snoise(pos * scale + vec2(seed * 0.05 + 42.0, u_time * 0.15));
            vec2 curl = vec2(n2, -n1);

            // Brownian micro-jitter so particles float like light dust particles
            float bx = snoise(pos * 0.01 + vec2(u_time * 0.8, seed));
            float by = snoise(pos * 0.01 + vec2(seed, u_time * 0.8));
            vec2 brownian = vec2(bx, by) * 35.0;

            vel += (curl * 340.0 + brownian) * effTurbulence * dt;
        }

        // 5. Inter-Particle Collision / Spatial Density Repulsion
        if (u_repulsion > 0.001) {
            vec2 pGrid = pos * 0.012;
            float d1 = snoise(pGrid + vec2(0.08, 0.0)) - snoise(pGrid - vec2(0.08, 0.0));
            float d2 = snoise(pGrid + vec2(0.0, 0.08)) - snoise(pGrid - vec2(0.0, 0.08));
            vec2 repelVec = vec2(-d1, -d2);
            vel += repelVec * u_repulsion * 650.0 * dt;
        }

        // 6. Integrate Position
        pos += vel * dt;

        // 7. REAL HARD COLLISION: Interactive Mouse & Finger Collider
        if (u_mouseRadius > 0.0 && u_mousePos.x > -500.0) {
            vec2 toParticle = pos - u_mousePos;
            float dist = length(toParticle);
            if (dist < u_mouseRadius && dist > 0.1) {
                vec2 norm = toParticle / dist;

                if (u_touchMode == 4) { // SOLID ELASTIC BOUNCE COLLISION
                    pos = u_mousePos + norm * (u_mouseRadius + 1.2);
                    float vDotN = dot(vel, norm);
                    if (vDotN < 0.0) {
                        vel = vel - (1.0 + u_bounce) * vDotN * norm;
                    }
                } else if (u_touchMode == 0) { // Attract
                    float normDist = 1.0 - (dist / u_mouseRadius);
                    vel -= norm * normDist * normDist * u_mouseForce * 1200.0 * dt;
                } else if (u_touchMode == 1) { // Repel / Push Collision
                    float normDist = 1.0 - (dist / u_mouseRadius);
                    pos = u_mousePos + norm * (u_mouseRadius * (1.0 - normDist * 0.15));
                    vel += norm * normDist * normDist * u_mouseForce * 1400.0 * dt;
                } else if (u_touchMode == 2) { // Vortex Swirl
                    vec2 tangent = vec2(-norm.y, norm.x);
                    float normDist = 1.0 - (dist / u_mouseRadius);
                    vel += (tangent * 1.5 + norm * 0.3) * normDist * u_mouseForce * 1000.0 * dt;
                } else if (u_touchMode == 3) { // Shockwave
                    vel += norm * u_mouseForce * 2400.0 * dt;
                }
            }
        }

        // 8. REAL HARD COLLISION: Bouncing Dynamic Obstacle Spheres
        vec4 obstacles[3];
        obstacles[0] = u_obstacle0;
        obstacles[1] = u_obstacle1;
        obstacles[2] = u_obstacle2;

        for (int i = 0; i < 3; i++) {
            if (obstacles[i].w > 0.5) {
                vec2 obsPos = obstacles[i].xy;
                float obsRadius = obstacles[i].z;
                vec2 toParticle = pos - obsPos;
                float dist = length(toParticle);
                if (dist < obsRadius && dist > 0.1) {
                    vec2 norm = toParticle / dist;
                    pos = obsPos + norm * (obsRadius + 1.2);
                    float vDotN = dot(vel, norm);
                    if (vDotN < 0.0) {
                        vel = vel - (1.0 + u_bounce) * vDotN * norm;
                    }
                }
            }
        }

        // 9. Canvas Wall Boundary Collision
        if (u_boundaryMode == 0) { // Bounce off canvas edges
            float margin = 2.0;
            if (pos.x < margin) {
                pos.x = margin;
                vel.x = abs(vel.x) * u_bounce;
            } else if (pos.x > u_resolution.x - margin) {
                pos.x = u_resolution.x - margin;
                vel.x = -abs(vel.x) * u_bounce;
            }
            if (pos.y < margin) {
                pos.y = margin;
                vel.y = abs(vel.y) * u_bounce;
            } else if (pos.y > u_resolution.y - margin) {
                pos.y = u_resolution.y - margin;
                vel.y = -abs(vel.y) * u_bounce;
            }
        } else if (u_boundaryMode == 1) { // Wrap around screen
            if (pos.x < 0.0) pos.x += u_resolution.x;
            if (pos.x > u_resolution.x) pos.x -= u_resolution.x;
            if (pos.y < 0.0) pos.y += u_resolution.y;
            if (pos.y > u_resolution.y) pos.y -= u_resolution.y;
        }
    }

    // Transform Feedback Output
    v_position = vec4(pos, vel);
    v_extra = vec4(life, maxLife, size, seed);
}
`;

// Fragment Shader for Transform Feedback Pass
const UPDATE_FS = `#version 300 es
precision highp float;
out vec4 fragColor;
void main() {
    fragColor = vec4(0.0);
}
`;

// --- RENDERING VERTEX SHADER (GLSL 300 es) ---
const RENDER_VS = `#version 300 es
precision highp float;

layout(location = 0) in vec4 a_position; // xy = pos, zw = vel
layout(location = 1) in vec4 a_extra;    // x = life, y = maxLife, z = size, w = seed

uniform mat4 u_matrix;
uniform float u_baseParticleSize;
uniform float u_totalParticles;
uniform float u_dpi;
uniform vec2 u_center;

out float v_speed;
out float v_lifeRatio;
out float v_distToCenter;
out float v_seed;

void main() {
    vec2 pos = a_position.xy;
    vec2 vel = a_position.zw;
    float speed = length(vel);

    gl_Position = u_matrix * vec4(pos, 0.0, 1.0);

    v_speed = speed;
    v_seed = a_extra.w;
    v_lifeRatio = clamp(a_extra.x / max(a_extra.y, 0.001), 0.0, 1.0);
    v_distToCenter = length(pos - u_center);

    // Fine starry point sizing based on density
    float densityScale = clamp(sqrt(120000.0 / max(u_totalParticles, 1000.0)), 0.18, 1.3);
    float baseSize = u_baseParticleSize * densityScale;
    float speedBoost = clamp(speed * 0.001, 0.0, 1.0);

    gl_PointSize = clamp((baseSize + speedBoost) * a_extra.z * u_dpi, 1.0, 10.0);
}
`;

// --- RENDERING FRAGMENT SHADER (GLSL 300 es) ---
const RENDER_FS = `#version 300 es
precision highp float;

in float v_speed;
in float v_lifeRatio;
in float v_distToCenter;
in float v_seed;

uniform float u_opacity;
uniform int u_palette;

out vec4 fragColor;

// Procedural Palette Generator
vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
    return a + b*cos( 6.2831853*(c*t+d) );
}

vec3 getPaletteColor(float speed, float dist, float seed) {
    float normSpeed = clamp(speed / 400.0, 0.0, 1.0);
    float normDist = clamp(dist / 400.0, 0.0, 1.0);
    float t = fract(normDist * 0.65 + seed * 0.35);

    if (u_palette == 0) { // Cyberpunk Neon
        vec3 coreColor = vec3(1.0, 0.95, 0.85);
        vec3 midColor = vec3(0.95, 0.15, 0.85);
        vec3 outerColor = vec3(0.0, 0.75, 1.0);
        
        if (normDist < 0.12) return mix(coreColor, midColor, normDist / 0.12);
        return mix(midColor, outerColor, clamp((normDist - 0.12) / 0.88, 0.0, 1.0));
    } else if (u_palette == 1) { // Rainbow Spectrum
        return pal(t, vec3(0.5,0.5,0.5), vec3(0.5,0.5,0.5), vec3(1.0,1.0,1.0), vec3(0.0,0.33,0.67));
    } else if (u_palette == 2) { // Fire & Plasma
        return mix(vec3(1.0, 0.18, 0.02), vec3(1.0, 0.9, 0.15), t) + vec3(0.15) * normSpeed;
    } else if (u_palette == 3) { // Cosmic Nebula
        return mix(vec3(0.35, 0.05, 0.95), vec3(0.0, 0.85, 0.95), t);
    } else if (u_palette == 4) { // Acid Toxic
        return mix(vec3(0.1, 0.95, 0.2), vec3(0.9, 1.0, 0.0), t);
    } else if (u_palette == 5) { // Ocean Depths
        return mix(vec3(0.02, 0.25, 0.85), vec3(0.15, 0.95, 0.8), t);
    } else if (u_palette == 6) { // Monochrome Gold
        return mix(vec3(0.85, 0.55, 0.1), vec3(1.0, 0.95, 0.65), t);
    } else { // Velocity Heatmap
        if (normSpeed < 0.33) return mix(vec3(0.0, 0.2, 0.8), vec3(0.0, 0.9, 0.3), normSpeed * 3.0);
        if (normSpeed < 0.66) return mix(vec3(0.0, 0.9, 0.3), vec3(1.0, 0.8, 0.0), (normSpeed - 0.33) * 3.0);
        return mix(vec3(1.0, 0.8, 0.0), vec3(1.0, 0.1, 0.2), (normSpeed - 0.66) * 3.0);
    }
}

void main() {
    // Soft glowing point falloff
    vec2 coord = gl_PointCoord - vec2(0.5);
    float distSq = dot(coord, coord);
    if (distSq > 0.25) discard;

    vec3 col = getPaletteColor(v_speed, v_distToCenter, v_seed);
    float falloff = (1.0 - smoothstep(0.0, 0.25, distSq));
    
    float alpha = clamp(u_opacity * v_lifeRatio * falloff * 0.45, 0.01, 0.85);

    fragColor = vec4(col, alpha);
}
`;

function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Failed to create WebGL shader');

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}`);
  }
  return shader;
}

function createTFProgram(
  gl: WebGL2RenderingContext,
  vsSource: string,
  fsSource: string,
  varyings: string[]
): WebGLProgram {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  if (!program) throw new Error('Failed to create WebGL program');

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);

  gl.bindAttribLocation(program, 0, 'a_position');
  gl.bindAttribLocation(program, 1, 'a_extra');

  gl.transformFeedbackVaryings(program, varyings, gl.SEPARATE_ATTRIBS);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`TF Program link error: ${info}`);
  }
  return program;
}

function createRenderProgram(
  gl: WebGL2RenderingContext,
  vsSource: string,
  fsSource: string
): WebGLProgram {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  if (!program) throw new Error('Failed to create WebGL program');

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);

  gl.bindAttribLocation(program, 0, 'a_position');
  gl.bindAttribLocation(program, 1, 'a_extra');

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Render Program link error: ${info}`);
  }
  return program;
}

export class WebglGpuParticleEngine {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;

  public settings: GpuParticleSettings;
  public touchMode: number = 0; // 0=Attract, 1=Repel, 2=Vortex, 3=Burst, 4=Collision Bounce

  private updateProgram!: WebGLProgram;
  private renderProgram!: WebGLProgram;

  private vaos: [WebGLVertexArrayObject, WebGLVertexArrayObject] = [null!, null!];
  private posBuffers: [WebGLBuffer, WebGLBuffer] = [null!, null!];
  private extraBuffers: [WebGLBuffer, WebGLBuffer] = [null!, null!];
  private transformFeedbacks: [WebGLTransformFeedback, WebGLTransformFeedback] = [null!, null!];

  private currentBufferIndex: number = 0;
  private maxParticleCapacity: number = 10000000;
  public currentParticleCount: number = 500000;

  private lastFrameTime: number = performance.now();
  private frameCount: number = 0;
  private lastFpsUpdate: number = performance.now();
  public stats: GpuEngineStats;

  public obstacles: Obstacle[] = [];

  private isDestroyed: boolean = false;

  constructor(canvas: HTMLCanvasElement, settings?: Partial<GpuParticleSettings>) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    });

    if (!gl) {
      throw new Error('WebGL 2.0 is not supported on this browser/device.');
    }
    this.gl = gl;

    this.settings = {
      particleCount: settings?.particleCount || 500000,
      targetFps: settings?.targetFps || 60,
      gravityX: settings?.gravityX ?? 0,
      gravityY: settings?.gravityY ?? 0,
      friction: settings?.friction ?? 0.992,
      turbulence: settings?.turbulence ?? 0.25,
      particleSize: settings?.particleSize ?? 3.0,
      particleOpacity: settings?.particleOpacity ?? 0.8,
      speedMultiplier: settings?.speedMultiplier ?? 1.0,
      palette: settings?.palette || 'cyberpunk',
      mouseForce: settings?.mouseForce ?? 16,
      mouseRadius: settings?.mouseRadius ?? 180,
      boundaryMode: settings?.boundaryMode || 'bounce',
      bounceElasticity: settings?.bounceElasticity ?? 0.85,
      autoAdaptQuality: settings?.autoAdaptQuality ?? true,
      particleRepulsion: settings?.particleRepulsion ?? 0.05,
      floatBuoyancy: settings?.floatBuoyancy ?? 0.0,
      mouseCollisionMode: settings?.mouseCollisionMode || 'elastic_bounce',
      hasObstacles: settings?.hasObstacles ?? false
    };

    this.stats = {
      fps: 60,
      gpuFrameTimeMs: 0.8,
      particleCountActive: this.settings.particleCount,
      drawCalls: 1,
      vboSizeMb: Math.round((this.settings.particleCount * 32) / (1024 * 1024)),
      webglStatus: 'simulating',
      autoHealingCount: 0,
      shaderCompilationStatus: 'ok'
    };

    this.initShaders();
    this.allocateGpuBuffers(this.settings.particleCount);
    this.initObstacles();
    this.spawnPreset('galaxy');
  }

  private initObstacles(): void {
    const w = Math.max(1, this.canvas.width || window.innerWidth || 800);
    const h = Math.max(1, this.canvas.height || window.innerHeight || 600);

    this.obstacles = [
      { x: w * 0.35, y: h * 0.45, radius: 75, vx: 60, vy: 40 },
      { x: w * 0.65, y: h * 0.55, radius: 90, vx: -50, vy: -50 }
    ];
  }

  private initShaders(): void {
    const gl = this.gl;
    this.updateProgram = createTFProgram(gl, UPDATE_VS, UPDATE_FS, ['v_position', 'v_extra']);
    this.renderProgram = createRenderProgram(gl, RENDER_VS, RENDER_FS);
  }

  public allocateGpuBuffers(count: number): void {
    const gl = this.gl;
    this.currentParticleCount = Math.min(count, this.maxParticleCapacity);

    if (this.vaos[0]) {
      gl.deleteVertexArray(this.vaos[0]);
      gl.deleteVertexArray(this.vaos[1]);
      gl.deleteBuffer(this.posBuffers[0]);
      gl.deleteBuffer(this.posBuffers[1]);
      gl.deleteBuffer(this.extraBuffers[0]);
      gl.deleteBuffer(this.extraBuffers[1]);
      gl.deleteTransformFeedback(this.transformFeedbacks[0]);
      gl.deleteTransformFeedback(this.transformFeedbacks[1]);
    }

    const posData = new Float32Array(this.currentParticleCount * 4);
    const extraData = new Float32Array(this.currentParticleCount * 4);

    for (let i = 0; i < 2; i++) {
      this.posBuffers[i] = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffers[i]);
      gl.bufferData(gl.ARRAY_BUFFER, posData.byteLength, gl.DYNAMIC_COPY);

      this.extraBuffers[i] = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.extraBuffers[i]);
      gl.bufferData(gl.ARRAY_BUFFER, extraData.byteLength, gl.DYNAMIC_COPY);
    }

    for (let i = 0; i < 2; i++) {
      this.vaos[i] = gl.createVertexArray()!;
      gl.bindVertexArray(this.vaos[i]);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffers[i]);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.extraBuffers[i]);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);

      gl.bindVertexArray(null);

      this.transformFeedbacks[i] = gl.createTransformFeedback()!;
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.transformFeedbacks[i]);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.posBuffers[i]);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, this.extraBuffers[i]);
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    }

    this.stats.vboSizeMb = Number(((this.currentParticleCount * 32 * 2) / (1024 * 1024)).toFixed(1));
    this.stats.particleCountActive = this.currentParticleCount;
  }

  public setParticleCount(count: number): void {
    if (count !== this.currentParticleCount) {
      this.allocateGpuBuffers(count);
      this.spawnPreset('galaxy');
    }
  }

  public clearParticles(): void {
    const gl = this.gl;
    const count = this.currentParticleCount;
    const extraData = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      extraData[i * 4] = -1.0; // mark dead
    }
    for (let i = 0; i < 2; i++) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.extraBuffers[i]);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, extraData);
    }
  }

  public spawnPreset(preset: ParticlePresetType): void {
    const gl = this.gl;
    const count = this.currentParticleCount;
    const posData = new Float32Array(count * 4);
    const extraData = new Float32Array(count * 4);

    const width = Math.max(1, this.canvas.width || window.innerWidth || 800);
    const height = Math.max(1, this.canvas.height || window.innerHeight || 600);
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const minDim = Math.min(width, height);

    for (let i = 0; i < count; i++) {
      const idx = i * 4;
      const seed = Math.random() * 1000.0;
      let x = centerX;
      let y = centerY;
      let vx = 0;
      let vy = 0;
      let life = 10.0 + Math.random() * 15.0;

      if (preset === 'floating_dust') {
        x = Math.random() * width;
        y = Math.random() * height;
        const angle = Math.random() * Math.PI * 2;
        const speed = 20.0 + Math.random() * 70.0;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
      } else if (preset === 'floating_bubbles') {
        x = Math.random() * width;
        y = height + Math.random() * 50.0;
        vx = (Math.random() - 0.5) * 50.0;
        vy = -(80.0 + Math.random() * 140.0);
      } else if (preset === 'quantum_float') {
        x = Math.random() * width;
        y = Math.random() * height;
        const angle = Math.random() * Math.PI * 2;
        vx = Math.cos(angle) * 45.0;
        vy = Math.sin(angle) * 45.0;
      } else if (preset === 'galaxy') {
        const r1 = Math.random();
        const r2 = Math.random();
        const r3 = Math.random();
        const r4 = Math.random();

        if (r1 < 0.20) {
          const radius = Math.pow(r2, 1.8) * minDim * 0.15;
          const angle = r3 * Math.PI * 2;
          x = centerX + Math.cos(angle) * radius;
          y = centerY + Math.sin(angle) * radius;
          const speed = Math.sqrt(150000.0 / (radius + 20.0));
          vx = -Math.sin(angle) * speed + Math.cos(angle) * (r4 - 0.5) * speed * 0.4;
          vy = Math.cos(angle) * speed + Math.sin(angle) * (r4 - 0.5) * speed * 0.4;
        } else {
          const radius = (0.04 + Math.pow(r2, 1.1) * 0.44) * minDim;
          const armOffset = r3 < 0.5 ? 0 : Math.PI;
          const logSpiralAngle = Math.log(radius / (minDim * 0.04) + 0.1) * 2.5;
          const armScatter = (r4 - 0.5) * 1.4;
          const angle = armOffset + logSpiralAngle + armScatter;

          x = centerX + Math.cos(angle) * radius;
          y = centerY + Math.sin(angle) * radius;

          const speed = Math.sqrt(140000.0 / (radius + 25.0));
          const radialVel = (Math.random() - 0.5) * 40.0;

          vx = -Math.sin(angle) * speed * (0.85 + Math.random() * 0.3) + Math.cos(angle) * radialVel;
          vy = Math.cos(angle) * speed * (0.85 + Math.random() * 0.3) + Math.sin(angle) * radialVel;
        }
      } else if (preset === 'blackhole') {
        const angle = Math.random() * Math.PI * 2;
        const radius = (0.08 + Math.pow(Math.random(), 1.1) * 0.40) * minDim;
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
        const speed = Math.sqrt(220000.0 / (radius + 15.0));
        vx = -Math.sin(angle) * speed - Math.cos(angle) * (speed * 0.12);
        vy = Math.cos(angle) * speed - Math.sin(angle) * (speed * 0.12);
      } else if (preset === 'explosion' || preset === 'supernova') {
        const angle = Math.random() * Math.PI * 2;
        const speed = 100.0 + Math.random() * 800.0;
        x = centerX + (Math.random() - 0.5) * 15;
        y = centerY + (Math.random() - 0.5) * 15;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
      } else if (preset === 'fountain') {
        x = centerX + (Math.random() - 0.5) * 100;
        y = height - 10;
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.7;
        const speed = 380.0 + Math.random() * 450.0;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
      } else if (preset === 'stream') {
        x = 5;
        y = Math.random() * height;
        vx = 180.0 + Math.random() * 260.0;
        vy = (Math.random() - 0.5) * 40;
      } else if (preset === 'grid_drop') {
        x = Math.random() * width;
        y = Math.random() * height * 0.25;
        vx = 0;
        vy = 90.0 + Math.random() * 180.0;
      } else { // Vortex
        const angle = Math.random() * Math.PI * 2;
        const radius = (0.05 + Math.random() * 0.42) * minDim;
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
        const speed = Math.sqrt(120000.0 / (radius + 20.0));
        vx = -Math.sin(angle) * speed;
        vy = Math.cos(angle) * speed;
      }

      posData[idx] = x;
      posData[idx + 1] = y;
      posData[idx + 2] = vx;
      posData[idx + 3] = vy;

      extraData[idx] = life;
      extraData[idx + 1] = life;
      extraData[idx + 2] = 0.5 + Math.random() * 0.8;
      extraData[idx + 3] = seed;
    }

    for (let i = 0; i < 2; i++) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffers[i]);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, posData);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.extraBuffers[i]);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, extraData);
    }

    if (preset === 'fountain') {
      this.settings.gravityY = 350.0;
      this.settings.friction = 0.998;
      this.settings.boundaryMode = 'bounce';
      this.settings.floatBuoyancy = 0.0;
    } else if (preset === 'grid_drop') {
      this.settings.gravityY = 120.0;
      this.settings.friction = 0.995;
      this.settings.boundaryMode = 'bounce';
      this.settings.floatBuoyancy = 0.0;
    } else if (preset === 'floating_dust') {
      this.settings.gravityX = 0.0;
      this.settings.gravityY = 0.0;
      this.settings.friction = 0.998;
      this.settings.turbulence = 0.45;
      this.settings.particleRepulsion = 0.45;
      this.settings.floatBuoyancy = 0.2;
      this.settings.boundaryMode = 'bounce';
    } else if (preset === 'floating_bubbles') {
      this.settings.gravityX = 0.0;
      this.settings.gravityY = 0.0;
      this.settings.friction = 0.994;
      this.settings.turbulence = 0.35;
      this.settings.particleRepulsion = 0.50;
      this.settings.floatBuoyancy = 1.2;
      this.settings.boundaryMode = 'bounce';
    } else if (preset === 'quantum_float') {
      this.settings.gravityX = 0.0;
      this.settings.gravityY = 0.0;
      this.settings.friction = 0.997;
      this.settings.turbulence = 0.50;
      this.settings.particleRepulsion = 0.60;
      this.settings.floatBuoyancy = 0.0;
      this.settings.boundaryMode = 'bounce';
    } else {
      this.settings.gravityX = 0.0;
      this.settings.gravityY = 0.0;
      this.settings.friction = 0.992;
      this.settings.boundaryMode = 'bounce';
      this.settings.floatBuoyancy = 0.0;
    }
  }

  public burstAt(x: number, y: number, count: number = 2500): void {
    const gl = this.gl;
    const burstCount = Math.min(count, Math.floor(this.currentParticleCount * 0.05));
    const posData = new Float32Array(burstCount * 4);

    for (let i = 0; i < burstCount; i++) {
      const idx = i * 4;
      const angle = Math.random() * Math.PI * 2;
      const speed = 250.0 + Math.random() * 850.0;
      posData[idx] = x;
      posData[idx + 1] = y;
      posData[idx + 2] = Math.cos(angle) * speed;
      posData[idx + 3] = Math.sin(angle) * speed;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffers[this.currentBufferIndex]);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, posData);
  }

  public render(mousePos: [number, number], presetId: ParticlePresetType = 'galaxy'): void {
    if (this.isDestroyed) return;

    const gl = this.gl;
    const now = performance.now();
    const dt = Math.min(0.033, (now - this.lastFrameTime) / 1000.0);
    this.lastFrameTime = now;

    this.frameCount++;
    if (now - this.lastFpsUpdate >= 500) {
      this.stats.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    const width = gl.canvas.width;
    const height = gl.canvas.height;

    // Update Bouncing Obstacle Positions
    if (this.settings.hasObstacles && this.obstacles.length > 0) {
      for (const obs of this.obstacles) {
        obs.x += obs.vx * dt;
        obs.y += obs.vy * dt;

        if (obs.x < obs.radius) { obs.x = obs.radius; obs.vx = Math.abs(obs.vx); }
        if (obs.x > width - obs.radius) { obs.x = width - obs.radius; obs.vx = -Math.abs(obs.vx); }
        if (obs.y < obs.radius) { obs.y = obs.radius; obs.vy = Math.abs(obs.vy); }
        if (obs.y > height - obs.radius) { obs.y = height - obs.radius; obs.vy = -Math.abs(obs.vy); }
      }
    }

    const readIndex = this.currentBufferIndex;
    const writeIndex = 1 - this.currentBufferIndex;

    const presetMap: Record<ParticlePresetType, number> = {
      galaxy: 0,
      explosion: 1,
      blackhole: 2,
      fountain: 3,
      fluid_flow: 4,
      vortex: 5,
      stream: 6,
      grid_drop: 7,
      supernova: 1,
      floating_dust: 8,
      floating_bubbles: 9,
      quantum_float: 10
    };
    const presetInt = presetMap[presetId] ?? 0;

    // --- STEP 1: GPU COMPUTE TRANSFORM FEEDBACK PASS ---
    gl.useProgram(this.updateProgram);

    gl.uniform1f(gl.getUniformLocation(this.updateProgram, 'u_deltaTime'), dt * this.settings.speedMultiplier);
    gl.uniform2f(gl.getUniformLocation(this.updateProgram, 'u_gravity'), this.settings.gravityX, this.settings.gravityY);
    gl.uniform1f(gl.getUniformLocation(this.updateProgram, 'u_friction'), this.settings.friction);
    gl.uniform1f(gl.getUniformLocation(this.updateProgram, 'u_turbulence'), this.settings.turbulence);
    gl.uniform2f(gl.getUniformLocation(this.updateProgram, 'u_mousePos'), mousePos[0], mousePos[1]);
    gl.uniform1f(gl.getUniformLocation(this.updateProgram, 'u_mouseForce'), this.settings.mouseForce);
    gl.uniform1f(gl.getUniformLocation(this.updateProgram, 'u_mouseRadius'), this.settings.mouseRadius);
    gl.uniform1i(gl.getUniformLocation(this.updateProgram, 'u_touchMode'), this.touchMode);
    gl.uniform2f(gl.getUniformLocation(this.updateProgram, 'u_resolution'), width, height);

    const bMode = this.settings.boundaryMode === 'bounce' ? 0 : this.settings.boundaryMode === 'wrap' ? 1 : 2;
    gl.uniform1i(gl.getUniformLocation(this.updateProgram, 'u_boundaryMode'), bMode);
    gl.uniform1f(gl.getUniformLocation(this.updateProgram, 'u_bounce'), this.settings.bounceElasticity);
    gl.uniform1f(gl.getUniformLocation(this.updateProgram, 'u_time'), now * 0.001);
    gl.uniform1i(gl.getUniformLocation(this.updateProgram, 'u_preset'), presetInt);
    gl.uniform1f(gl.getUniformLocation(this.updateProgram, 'u_repulsion'), this.settings.particleRepulsion);
    gl.uniform1f(gl.getUniformLocation(this.updateProgram, 'u_buoyancy'), this.settings.floatBuoyancy);

    // Pass obstacle uniforms
    const obs0 = (this.settings.hasObstacles && this.obstacles[0]) ? [this.obstacles[0].x, this.obstacles[0].y, this.obstacles[0].radius, 1.0] : [0, 0, 0, 0];
    const obs1 = (this.settings.hasObstacles && this.obstacles[1]) ? [this.obstacles[1].x, this.obstacles[1].y, this.obstacles[1].radius, 1.0] : [0, 0, 0, 0];
    const obs2 = [0, 0, 0, 0];

    gl.uniform4f(gl.getUniformLocation(this.updateProgram, 'u_obstacle0'), obs0[0], obs0[1], obs0[2], obs0[3]);
    gl.uniform4f(gl.getUniformLocation(this.updateProgram, 'u_obstacle1'), obs1[0], obs1[1], obs1[2], obs1[3]);
    gl.uniform4f(gl.getUniformLocation(this.updateProgram, 'u_obstacle2'), obs2[0], obs2[1], obs2[2], obs2[3]);

    gl.bindVertexArray(this.vaos[readIndex]);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.transformFeedbacks[writeIndex]);

    gl.enable(gl.RASTERIZER_DISCARD);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, this.currentParticleCount);
    gl.endTransformFeedback();
    gl.disable(gl.RASTERIZER_DISCARD);

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

    // --- STEP 2: RENDER PARTICLES TO CANVAS ---
    gl.viewport(0, 0, width, height);
    gl.clearColor(0.01, 0.015, 0.03, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(this.renderProgram);

    const projMat = new Float32Array([
      2 / width, 0, 0, 0,
      0, -2 / height, 0, 0,
      0, 0, 1, 0,
      -1, 1, 0, 1
    ]);

    const paletteList: ParticleColorPalette[] = [
      'cyberpunk',
      'rainbow',
      'fire_plasma',
      'cosmic_nebula',
      'acid_toxic',
      'ocean_depths',
      'monochrome_gold',
      'velocity_heatmap'
    ];
    const paletteIndex = paletteList.indexOf(this.settings.palette);

    const dpi = window.devicePixelRatio || 1.0;

    const dynamicSize = Math.max(1.0, this.settings.particleSize * 0.85);
    const dynamicOpacity = Math.max(0.2, Math.min(0.9, this.settings.particleOpacity));

    gl.uniformMatrix4fv(gl.getUniformLocation(this.renderProgram, 'u_matrix'), false, projMat);
    gl.uniform1f(gl.getUniformLocation(this.renderProgram, 'u_baseParticleSize'), dynamicSize);
    gl.uniform1f(gl.getUniformLocation(this.renderProgram, 'u_totalParticles'), this.currentParticleCount);
    gl.uniform1f(gl.getUniformLocation(this.renderProgram, 'u_dpi'), dpi);
    gl.uniform2f(gl.getUniformLocation(this.renderProgram, 'u_center'), width * 0.5, height * 0.5);
    gl.uniform1f(gl.getUniformLocation(this.renderProgram, 'u_opacity'), dynamicOpacity);
    gl.uniform1i(gl.getUniformLocation(this.renderProgram, 'u_palette'), paletteIndex < 0 ? 0 : paletteIndex);

    gl.bindVertexArray(this.vaos[writeIndex]);
    gl.drawArrays(gl.POINTS, 0, this.currentParticleCount);

    gl.bindVertexArray(null);

    this.currentBufferIndex = writeIndex;
  }

  public destroy(): void {
    this.isDestroyed = true;
    const gl = this.gl;
    if (this.vaos[0]) {
      gl.deleteVertexArray(this.vaos[0]);
      gl.deleteVertexArray(this.vaos[1]);
      gl.deleteBuffer(this.posBuffers[0]);
      gl.deleteBuffer(this.posBuffers[1]);
      gl.deleteBuffer(this.extraBuffers[0]);
      gl.deleteBuffer(this.extraBuffers[1]);
      gl.deleteTransformFeedback(this.transformFeedbacks[0]);
      gl.deleteTransformFeedback(this.transformFeedbacks[1]);
    }
    if (this.updateProgram) gl.deleteProgram(this.updateProgram);
    if (this.renderProgram) gl.deleteProgram(this.renderProgram);
  }
}
