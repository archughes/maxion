import * as THREE from '../../lib/three.module.js';

export function createWaterMaterial(waterColor, uniforms, screenWidth, screenHeight) {
    // Create normal map texture
    const normalMap = loadWaterNormalMap();
    
    // Create material with custom shader
    const material = new THREE.MeshStandardMaterial({
        color: waterColor,
        transparent: true,
        opacity: uniforms.baseOpacity.value,
        side: THREE.DoubleSide,
        roughness: 0.2,
        metalness: 0.1,
        normalMap: normalMap,
        envMapIntensity: 1.0,
        onBeforeCompile: (shader) => {
            shader.uniforms = { ...shader.uniforms, ...uniforms };
            
            // Add custom vertex shader code
            shader.vertexShader = injectVertexShader(shader.vertexShader);
            
            // Add custom fragment shader code
            shader.fragmentShader = injectFragmentShader(shader.fragmentShader, screenWidth, screenHeight);
            
            material.userData.shader = shader;
        }
    });
    
    const normalScale = new THREE.Vector2(1.0, 1.0);
    material.normalScale = normalScale;
    
    return { material, normalScale };
}

function loadWaterNormalMap() {
    return new THREE.TextureLoader().load(
        './textures/waternormals.jpg',
        (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        },
        undefined,
        (err) => console.error('Failed to load normal map:', err)
    );
}

function injectVertexShader(vertexShader) {
    return `
        varying vec3 vViewPositionCustom;
        varying vec4 vWorldPosition;
        varying vec3 vNormalCustom;
        ${vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>
            vViewPositionCustom = -(modelViewMatrix * vec4(position, 1.0)).xyz;
            vWorldPosition = modelMatrix * vec4(position, 1.0);
            vNormalCustom = normalize(normalMatrix * normal);
            `
        )}
    `;
}

function injectFragmentShader(fragmentShader, screenWidth, screenHeight) {
    return `
        uniform float fresnelPower;
        uniform float fresnelScale;
        uniform float baseOpacity;
        uniform float time;
        uniform float criticalAngle;
        uniform int isCameraUnderwater;
        uniform sampler2D reflectionSampler;
        uniform float reflectionDistance;
        uniform float reflectionFalloff;
        uniform float waterRoughness;
        uniform float waterWaveHeight;
        varying vec3 vViewPositionCustom;
        varying vec4 vWorldPosition;
        varying vec3 vNormalCustom;
        ${fragmentShader.replace(
            '#include <dithering_fragment>',
            `
            #include <dithering_fragment>
            vec3 viewDir = normalize(vViewPositionCustom);
            float cosTheta = abs(dot(normalize(vNormalCustom), viewDir));
            float R0 = 0.02;
            float fresnel = R0 + (1.0 - R0) * pow(1.0 - cosTheta, fresnelPower);
            fresnel *= fresnelScale;

            float distanceFade = clamp(1.0 - length(vViewPositionCustom) / reflectionDistance, 0.0, 1.0);
            distanceFade = pow(distanceFade, reflectionFalloff);

            vec2 screenUV = gl_FragCoord.xy / vec2(${screenWidth}.0, ${screenHeight}.0);

            vec2 choppyDistortion = vec2(
                sin(time + vWorldPosition.x * 0.1 + vWorldPosition.z * 0.15) * 0.02,
                cos(time + vWorldPosition.z * 0.12 + vWorldPosition.x * 0.08) * 0.02
            );
            screenUV += choppyDistortion * waterRoughness;

            vec2 distortion = normalize(vNormalCustom.xz) * waterRoughness;
            distortion *= sin(time * 0.5 + vWorldPosition.x * 0.05 + vWorldPosition.z * 0.03) * waterWaveHeight;
            screenUV += distortion;

            vec4 reflectionColor = texture2D(reflectionSampler, screenUV);

            if (isCameraUnderwater == 0) {
                // Above water (air to water) - no critical angle
                gl_FragColor.rgb = mix(gl_FragColor.rgb, reflectionColor.rgb, fresnel * distanceFade);
                gl_FragColor.a = mix(baseOpacity, 1.0, fresnel);
            } else {
                // Underwater (water to air)
                float underwaterOpacity = baseOpacity * 0.8; // Slightly reduced opacity underwater
                if (cosTheta < criticalAngle) {
                    // Total internal reflection of ocean floor
                    gl_FragColor.rgb = mix(gl_FragColor.rgb, reflectionColor.rgb, fresnel * distanceFade);
                    gl_FragColor.a = underwaterOpacity;
                } else {
                    // Refracted light from above (non-inverted)
                    vec2 refractedUV = screenUV; // No inversion for refraction
                    vec4 refractedColor = texture2D(reflectionSampler, refractedUV);
                    gl_FragColor.rgb = mix(gl_FragColor.rgb, refractedColor.rgb, fresnel * distanceFade);
                    gl_FragColor.a = mix(underwaterOpacity, 1.0, fresnel);
                }
            }
            `
        )}
    `;
}