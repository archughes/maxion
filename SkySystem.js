import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene } from './scene.js';
import { Cloud } from './Cloud.js';

class CelestialBody {
    constructor(config) {
        this.color = config.color;
        this.pathParams = config.pathParams;
        this.phaseCycle = config.phaseCycle || 28;
        this.isMoon = config.isMoon || false;

        if (this.isMoon) {
            this.mesh = new THREE.Mesh(
                new THREE.SphereGeometry(1, 32, 32),
                new THREE.ShaderMaterial({
                    uniforms: {
                        phase: { value: 0 },
                        lightDirection: { value: new THREE.Vector3(1, 0, 0) }
                    },
                    vertexShader: `
                        varying vec2 vUv;
                        varying vec3 vNormal;
                        void main() {
                            vUv = uv;
                            vNormal = normalize(normalMatrix * normal);
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `,
                    fragmentShader: `
                        uniform float phase;
                        uniform vec3 lightDirection;
                        varying vec2 vUv;
                        varying vec3 vNormal;
                        void main() {
                            vec3 light = normalize(lightDirection);
                            float illumination = dot(vNormal, light);
                            float crescent = smoothstep(-0.1, 0.1, illumination - phase);
                            float brightness = phase > 0.0 ? max(crescent, 0.2) : crescent;
                            if (abs(phase) < 0.05) brightness = 0.0;
                            gl_FragColor = vec4(vec3(brightness), 1.0);
                        }
                    `,
                    side: THREE.DoubleSide
                })
            );
        } else {
            this.mesh = new THREE.Mesh(
                new THREE.SphereGeometry(1, 32, 32),
                new THREE.MeshBasicMaterial({ color: this.color })
            );
        }
        scene.add(this.mesh);
    }

    update(time, day) {
        const { azimuth, elevation } = this.pathParams.pathFunc(time, day, this.pathParams);
        const radius = 100;
        const x = radius * Math.cos(elevation) * Math.sin(azimuth);
        const y = radius * Math.sin(elevation);
        const z = radius * Math.cos(elevation) * Math.cos(azimuth);
        this.mesh.position.set(x, y, z);

        // Update visibility based on day/night
        const isDay = time >= 6 && time < 18;
        this.mesh.visible = this.isMoon ? !isDay : isDay;

        if (this.isMoon) {
            const phaseProgress = (day % this.phaseCycle) / this.phaseCycle;
            const phase = Math.sin(2 * Math.PI * phaseProgress);
            this.mesh.material.uniforms.phase.value = phase;
            const sunPosition = scene.getObjectByName('sunLight')?.position || new THREE.Vector3(100, 0, 0);
            const lightDir = sunPosition.clone().sub(this.mesh.position).normalize();
            this.mesh.material.uniforms.lightDirection.value.copy(lightDir);
        }
    }
}

class Meteor {
    constructor(config) {
        this.size = config.size || 0.5;
        this.color = config.color || 0xffffff;
        this.isComet = config.isComet || false;
        this.lifetime = config.lifetime || 5; // Seconds
        this.timeAlive = 0;

        // Random start position on sky sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 150;
        this.position = new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );

        // Velocity towards the ground with some randomness
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            -5 - Math.random() * 5,
            (Math.random() - 0.5) * 2
        );

        // Particle for the meteor head
        this.head = new THREE.Mesh(
            new THREE.SphereGeometry(this.size, 16, 16),
            new THREE.MeshBasicMaterial({ color: this.color })
        );
        this.head.position.copy(this.position);
        scene.add(this.head);

        // Trail (comets have longer trails)
        const trailLength = this.isComet ? 20 : 5;
        const trailGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(trailLength * 3);
        const colors = new Float32Array(trailLength * 3);
        const headColor = new THREE.Color(this.color);
        for (let i = 0; i < trailLength; i++) {
            positions[i * 3] = this.position.x;
            positions[i * 3 + 1] = this.position.y;
            positions[i * 3 + 2] = this.position.z;
            const fade = 1 - i / trailLength;
            colors[i * 3] = headColor.r * fade;
            colors[i * 3 + 1] = headColor.g * fade;
            colors[i * 3 + 2] = headColor.b * fade;
        }
        trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        trailGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.trail = new THREE.Line(
            trailGeometry,
            new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8 })
        );
        scene.add(this.trail);
    }

    update(deltaTime) {
        this.timeAlive += deltaTime;
        if (this.timeAlive > this.lifetime) return false; // Mark for removal

        // Move meteor
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        this.head.position.copy(this.position);

        // Update trail
        const positions = this.trail.geometry.attributes.position.array;
        for (let i = positions.length - 3; i >= 3; i -= 3) {
            positions[i] = positions[i - 3];
            positions[i + 1] = positions[i - 2];
            positions[i + 2] = positions[i - 1];
        }
        positions[0] = this.position.x;
        positions[1] = this.position.y;
        positions[2] = this.position.z;
        this.trail.geometry.attributes.position.needsUpdate = true;

        return true; // Keep alive
    }

    dispose() {
        scene.remove(this.head);
        scene.remove(this.trail);
        this.head.geometry.dispose();
        this.head.material.dispose();
        this.trail.geometry.dispose();
        this.trail.material.dispose();
    }
}

export class SkySystem {
    constructor(mapData) {
        this.suns = [];
        this.moons = [];
        this.stars = null;
        this.sky = null;
        this.clouds = [];
        this.meteors = [];

        // Meteor configs from map data
        this.meteorConfig = mapData.meteors || {
            frequency: 0.01, // Chance per second
            sizeMin: 0.2, sizeMax: 0.8,
            colors: [0xffffff],
            cometChance: 0.1
        };
        this.showerConfig = mapData.meteorShower || {
            frequency: 0.0001, // Very rare
            quantity: 20,
            sizeMin: 0.3, sizeMax: 1.0,
            colors: [0xffddaa, 0xffaaaa, 0xaaffaa]
        };

        // Celestial path functions
        const pathFunctions = {
            standardSun: (time, day, params) => ({
                azimuth: Math.PI * (time / 12 - 1) + Math.sin(day * params.dayShift) * 0.1,
                elevation: params.maxElevation * Math.sin(Math.PI * time / 12)
            }),
            highMoon: (time, day, params) => ({
                azimuth: Math.PI * (time / 12 - 1) + Math.PI + Math.cos(day * params.dayShift) * 0.2,
                elevation: params.maxElevation
            })
        };

        // Suns from map data
        mapData.suns.forEach(sunConfig => {
            const pathFunc = pathFunctions[sunConfig.pathType || 'standardSun'];
            this.suns.push(new CelestialBody({
                color: parseInt(sunConfig.color),
                pathParams: { pathFunc, maxElevation: sunConfig.maxElevation || Math.PI / 3, dayShift: sunConfig.dayShift || 0.1 },
                isMoon: false
            }));
        });

        // Moons from map data
        mapData.moons.forEach(moonConfig => {
            const pathFunc = pathFunctions[moonConfig.pathType || 'highMoon'];
            this.moons.push(new CelestialBody({
                color: parseInt(moonConfig.color),
                pathParams: { pathFunc, maxElevation: moonConfig.maxElevation || Math.PI / 4, dayShift: moonConfig.dayShift || 0.05 },
                phaseCycle: moonConfig.phaseCycle || 28,
                isMoon: true
            }));
        });

        this.createStars();
        this.createSky();

        // Clouds
        for (let i = 0; i < 10; i++) {
            this.clouds.push(new Cloud());
        }
    }

    createStars() {
        const starCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        const twinkles = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 200;
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            const color = new THREE.Color().setHSL(Math.random(), 0.2, 0.8);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            sizes[i] = Math.random() < 0.1 ? 0.5 : 0.1;
            twinkles[i] = Math.random() < 0.1 ? 0 : Math.random();
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('twinkle', new THREE.BufferAttribute(twinkles, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: { time: { value: 0 }, moons: { value: [] } },
            vertexShader: `
                attribute float size;
                attribute float twinkle;
                uniform float time;
                uniform vec3 moons[10];
                varying vec3 vColor;
                void main() {
                    vColor = color;
                    float twinkleFactor = twinkle > 0.0 ? (sin(time + twinkle * 10.0) * 0.5 + 0.5) : 1.0;
                    gl_PointSize = size * (twinkleFactor * 0.5 + 0.5);

                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    bool occluded = false;
                    for (int i = 0; i < 10; i++) {
                        if (moons[i].x == 0.0 && moons[i].y == 0.0 && moons[i].z == 0.0) break;
                        vec4 moonPos = modelViewMatrix * vec4(moons[i], 1.0);
                        vec3 toMoon = normalize(moonPos.xyz - mvPosition.xyz);
                        float dist = distance(mvPosition.xyz, moonPos.xyz);
                        float angle = acos(dot(normalize(mvPosition.xyz), toMoon));
                        if (dist < 10.0 && angle < 0.05) {
                            occluded = true;
                            break;
                        }
                    }
                    if (occluded) gl_PointSize = 0.0;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                void main() {
                    gl_FragColor = vec4(vColor, 1.0);
                }
            `,
            vertexColors: true,
            transparent: true
        });

        this.stars = new THREE.Points(geometry, material);
        scene.add(this.stars);
    }

    createSky() {
        const skyGeometry = new THREE.SphereGeometry(200, 32, 32);
        this.sky = new THREE.Mesh(skyGeometry, new THREE.MeshBasicMaterial({
            color: 0x87ceeb,
            side: THREE.BackSide
        }));
        scene.add(this.sky);
    }

    getSkyColor(time) {
        if (time < 6 || time > 18) return new THREE.Color(0x000033);
        if (time < 8) return new THREE.Color(0x87ceeb).lerp(new THREE.Color(0xffa500), (time - 6) / 2);
        if (time < 16) return new THREE.Color(0x87ceeb);
        return new THREE.Color(0x87ceeb).lerp(new THREE.Color(0xffa500), (time - 16) / 2);
    }

    updateLighting(time) {
        const sunLight = scene.getObjectByName('sunLight') || new THREE.DirectionalLight(0xffffff, 1);
        sunLight.name = 'sunLight';
        if (this.suns.length > 0) {
            const primarySun = this.suns[0];
            sunLight.position.copy(primarySun.mesh.position);
            sunLight.intensity = Math.max(0, primarySun.mesh.position.y / 100);
            sunLight.color.setHex(primarySun.color);
            if (!scene.getObjectByName('sunLight')) scene.add(sunLight);
        }
    }

    spawnMeteor(isShower = false) {
        const config = isShower ? this.showerConfig : this.meteorConfig;
        const size = config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin);
        const color = config.colors[Math.floor(Math.random() * config.colors.length)];
        const isComet = !isShower && Math.random() < this.meteorConfig.cometChance;
        this.meteors.push(new Meteor({
            size,
            color,
            isComet,
            lifetime: isComet ? 10 : 5
        }));
    }

    update(deltaTime, timeSystem) {
        const time = timeSystem.getTimeOfDay();
        const day = timeSystem.getDay();
        const isDay = time >= 6 && time < 18;
        const isNight = !isDay;

        this.suns.forEach(sun => sun.update(time, day));
        this.moons.forEach(moon => moon.update(time, day));
        this.stars.visible = isNight;
        this.stars.rotation.y += 0.0001 * deltaTime;
        this.stars.material.uniforms.time.value += deltaTime;

        const moonPositions = new Array(10).fill(new THREE.Vector3(0, 0, 0));
        this.moons.forEach((moon, i) => {
            if (i < 10) moonPositions[i].copy(moon.mesh.position);
        });
        this.stars.material.uniforms.moons.value = moonPositions;

        this.sky.material.color.set(this.getSkyColor(time));
        this.updateLighting(time);
        this.clouds.forEach(cloud => cloud.update(deltaTime));

        // Spawn meteors only during night
        if (isNight) {
            if (Math.random() < this.meteorConfig.frequency * deltaTime) {
                this.spawnMeteor(false);
            }
            if (Math.random() < this.showerConfig.frequency * deltaTime) {
                for (let i = 0; i < this.showerConfig.quantity; i++) {
                    setTimeout(() => this.spawnMeteor(true), i * 100); // Staggered spawn
                }
            }
        }

        // Update and clean up meteors, set visibility
        this.meteors = this.meteors.filter(meteor => {
            const keep = meteor.update(deltaTime);
            if (!keep) {
                meteor.dispose();
            } else {
                meteor.head.visible = isNight;
                meteor.trail.visible = isNight;
            }
            return keep;
        });
    }
}
