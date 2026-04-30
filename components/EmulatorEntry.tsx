'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

interface EmulatorEntryProps {
  onTransitionComplete: () => void;
}

export const EmulatorEntry: React.FC<EmulatorEntryProps> = ({ onTransitionComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Three.js Setup ---
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true, 
        powerPreference: 'default', // Changed from high-performance to increase compatibility
        failIfMajorPerformanceCaveat: false 
      });
    } catch (e) {
      console.error("WebGL Renderer creation failed in EmulatorEntry:", e);
      onTransitionComplete(); // Fallback: Proceed to site even if 3D fails
      return;
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 12;

    // --- Star Map Coordinate Grid ---
    const gridGeometry = new THREE.PlaneGeometry(60, 40);
    const gridUniforms = { 
      uTime: { value: 0 }, 
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) } 
    };
    const gridMaterial = new THREE.ShaderMaterial({
      uniforms: gridUniforms,
      transparent: true,
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float uTime; uniform vec2 uResolution; varying vec2 vUv;
        #define PI 3.14159265359
        void main() {
          vec2 uv = vUv - 0.5; uv.x *= uResolution.x / uResolution.y;
          float dist = length(uv); float angle = atan(uv.y, uv.x);
          float rDrift = dist - uTime * 0.05;
          float circles = step(0.996, fract(rDrift * 6.0));
          float radials = step(0.998, fract(angle * 12.0 / PI));
          float markers = circles * radials;
          float grid = circles * 0.4 + radials * 0.2 + markers * 0.8;
          float mask = smoothstep(0.15, 0.6, dist);
          vec3 lineColor = vec3(0.9, 0.95, 1.0); vec3 blueGlow = vec3(0.1, 0.3, 0.8);
          vec3 finalColor = mix(vec3(0.0), lineColor, grid * mask);
          finalColor += blueGlow * grid * 1.2 * mask;
          gl_FragColor = vec4(finalColor, (grid * 0.12 + markers * 0.35) * mask);
        }
      `
    });
    const gridPlane = new THREE.Mesh(gridGeometry, gridMaterial);
    gridPlane.position.z = -12;
    scene.add(gridPlane);

    // --- Twinkling Stars ---
    const starCount = 1000;
    const starGeometry = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i*3] = (Math.random()-0.5)*100; 
      starPos[i*3+1] = (Math.random()-0.5)*60; 
      starPos[i*3+2] = -20 + Math.random()*15;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, transparent: true, opacity: 0.3 }));
    scene.add(stars);

    // --- Cinematic Spheres ---
    const spheresGroup = new THREE.Group();
    scene.add(spheresGroup);
    
    const textureLoader = new THREE.TextureLoader();
    const logoTex = textureLoader.load('/hero-spheres.png'); // Using the one we already copied

    const sphereMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uLogo: { value: logoTex } },
      vertexShader: `
        varying vec3 vNormal; varying vec3 vViewDir; varying vec2 vUv;
        void main() { 
          vUv = uv;
          vNormal = normalize(normalMatrix * normal); 
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0); 
          vViewDir = normalize(-mvPos.xyz); 
          gl_Position = projectionMatrix * mvPos; 
        }
      `,
      fragmentShader: `
        varying vec3 vNormal; varying vec3 vViewDir; varying vec2 vUv;
        uniform sampler2D uLogo;
        void main() {
          float fresnel = pow(1.0 - max(0.0, dot(vNormal, vViewDir)), 3.0);
          vec3 rimColor = mix(vec3(0.2, 0.4, 1.0), vec3(0.7, 0.2, 0.9), fresnel);
          vec3 baseColor = vec3(0.02, 0.02, 0.03);
          gl_FragColor = vec4(baseColor + rimColor * fresnel * 2.0, 1.0);
        }
      `
    });

    const sphereGeom = new THREE.SphereGeometry(1, 64, 64);
    for (let i = 0; i < 16; i++) {
      const sphere = new THREE.Mesh(sphereGeom, sphereMat);
      sphere.scale.setScalar(0.1 + Math.random() * 0.5);
      const side = Math.random() > 0.5 ? 1 : -1;
      sphere.position.set(side * (6 + Math.random() * 8), (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 10 - 4);
      sphere.userData = { speed: 0.1 + Math.random() * 0.3, offset: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.02 };
      spheresGroup.add(sphere);
    }

    // --- Holographic Console ---
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 512; screenCanvas.height = 448;
    const ctx = screenCanvas.getContext('2d');
    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    const terminalLines = ["SYSTEM BOOT v2.4.1", "INIT HARDWARE...", "AGENTS: LIVE", "TAP TO START..."];
    let currentLineIdx = 0, currentCharIdx = 0, lastTypeTime = 0;

    const consoleGroup = new THREE.Group();
    scene.add(consoleGroup);
    const shellMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.95, opacity: 1, metalness: 0.1, roughness: 0.05, ior: 1.5, thickness: 0.5, iridescence: 0.2, transparent: true });
    const shell = new THREE.Mesh(new THREE.BoxGeometry(4, 6.5, 0.8), shellMat);
    consoleGroup.add(shell);

    const screenMat = new THREE.ShaderMaterial({
      uniforms: { uTexture: { value: screenTexture }, uTime: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform sampler2D uTexture; uniform float uTime; varying vec2 vUv; void main() { vec4 tex = texture2D(uTexture, vUv); float scanline = sin(vUv.y * 300.0 + uTime * 5.0) * 0.1; gl_FragColor = vec4(tex.rgb + scanline, tex.a); }`,
      transparent: true
    });
    const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.8), screenMat);
    screenMesh.position.set(0, 1.2, 0.41); 
    consoleGroup.add(screenMesh);

    // --- Post-Processing ---
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const wavePass = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uMouse: { value: new THREE.Vector2(0.5, 0.5) }, uIntensity: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uMouse; uniform float uIntensity; varying vec2 vUv;
        void main() {
          vec2 p = vUv - uMouse; p.x *= 1.77; float dist = length(p);
          float wave = sin(dist * 45.0 - uTime * 7.0) * 0.035 * uIntensity; float falloff = smoothstep(0.5, 0.0, dist); wave *= falloff;
          vec2 uvR = vUv + p * wave * 2.2; vec2 uvG = vUv + p * wave * 1.3; vec2 uvB = vUv + p * wave * 0.7;
          float r = texture2D(tDiffuse, uvR).r; float g = texture2D(tDiffuse, uvG).g; float b = texture2D(tDiffuse, uvB).b;
          gl_FragColor = vec4(r, g, b, 1.0);
        }
      `
    });
    composer.addPass(wavePass);

    // --- Interactivity ---
    let nMouseX = 0, nMouseY = 0;
    const handleMouseMoveGlobal = (e: MouseEvent) => {
      nMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      nMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMoveGlobal);

    const triggerTransition = () => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      
      const tl = gsap.timeline({
        onComplete: () => {
          onTransitionComplete();
        }
      });

      tl.to(flashRef.current, {
        width: '300vmax',
        height: '300vmax',
        duration: 1.2,
        ease: 'expo.in'
      });
    };

    const handleInteraction = (e: any) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const mouse = new THREE.Vector2();
      mouse.x = (clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(clientY / window.innerHeight) * 2 + 1;
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(consoleGroup.children, true);
      
      if (intersects.length > 0) {
        triggerTransition();
      }
    };

    window.addEventListener('mousedown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    // --- Animation Loop ---
    const clock = new THREE.Clock();
    let hoverIntensity = 0;
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!renderer) return;
      const time = clock.getElapsedTime();
      gridUniforms.uTime.value = time;
      screenMat.uniforms.uTime.value = time;
      wavePass.uniforms.uTime.value = time;

      // Update Terminal
      if (ctx) {
        if (time - lastTypeTime > 0.05) {
          if (currentLineIdx < terminalLines.length) {
            if (currentCharIdx < terminalLines[currentLineIdx].length) { currentCharIdx++; lastTypeTime = time; }
            else { if (time - lastTypeTime > 0.8) { currentLineIdx++; currentCharIdx = 0; lastTypeTime = time; } }
          }
        }
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 512, 448);
        ctx.fillStyle = '#0f0'; ctx.font = '32px monospace';
        for (let i = 0; i <= currentLineIdx && i < terminalLines.length; i++) {
          const text = i === currentLineIdx ? terminalLines[i].substring(0, currentCharIdx) : terminalLines[i];
          ctx.fillText(text, 40, 80 + i * 60);
        }
        screenTexture.needsUpdate = true;
      }

      // Spheres
      spheresGroup.children.forEach((sphere) => {
        const { speed, offset, rotSpeed } = sphere.userData;
        sphere.position.y += Math.sin(time * speed + offset) * 0.005;
        sphere.rotation.y += rotSpeed;
        sphere.rotation.x += rotSpeed * 0.5;
      });

      // Console floating
      const bob = Math.sin(time * 0.8) * 0.4;
      consoleGroup.position.y = bob;
      const targetRotX = -nMouseY * 0.45;
      const targetRotY = nMouseX * 0.45;
      consoleGroup.rotation.x += (targetRotX - consoleGroup.rotation.x) * 0.06;
      consoleGroup.rotation.y += (targetRotY - consoleGroup.rotation.y) * 0.06;

      // Hover check
      const raycasterHover = new THREE.Raycaster();
      raycasterHover.setFromCamera(new THREE.Vector2(nMouseX, nMouseY), camera);
      const intersectsHover = raycasterHover.intersectObject(shell);
      if (intersectsHover.length > 0) {
        hoverIntensity += (1.0 - hoverIntensity) * 0.12;
        document.body.style.cursor = 'pointer';
      } else {
        hoverIntensity += (0.0 - hoverIntensity) * 0.06;
        document.body.style.cursor = 'none';
      }
      wavePass.uniforms.uMouse.value.set((nMouseX+1)/2, (nMouseY+1)/2);
      wavePass.uniforms.uIntensity.value = hoverIntensity;

      composer.render();
    };

    animate();
    setIsLoaded(true);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
      gridUniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMoveGlobal);
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      
      // Resource Cleanup
      scene.traverse((object: any) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((mat: any) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      renderer.dispose();
      composer.dispose();
      screenTexture.dispose();
      
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      document.body.style.cursor = 'auto';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] bg-[#020205] overflow-hidden">
      {/* Three.js Canvas */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* UI Overlay */}
      <div className={`absolute inset-0 flex flex-col pointer-events-none transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <header className="p-8 flex justify-between items-center">
          <div className="font-headline text-white text-sm tracking-[0.4em]">TROVIA.OS</div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h1 className="font-headline text-[12vw] text-white leading-none skew-x-[-5deg] mb-4 select-none opacity-90" 
              style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #D1D5DB 40%, #9CA3AF 50%, #E5E7EB 60%, #FFFFFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            TROVIA
          </h1>
          <p className="font-mono text-white/40 text-[10px] tracking-[0.8em] uppercase mb-12">Treasure of Agents</p>
          
          <div className="animate-pulse flex flex-col items-center gap-2">
            <span className="font-mono text-white/60 text-xs tracking-[0.3em] uppercase">[ TAP THE DEVICE TO ENTER ]</span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-white/60 to-transparent"></div>
          </div>
        </div>
      </div>

      {/* Transition Flash */}
      <div 
        ref={flashRef}
        className="fixed top-1/2 left-1/2 w-0 h-0 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 z-[10001] pointer-events-none"
      />
      
      {/* Custom Cursor (Simplified for React) */}
      <div className="hidden md:block fixed top-0 left-0 w-4 h-4 bg-white rounded-full mix-blend-difference pointer-events-none z-[10002] transition-transform duration-75" />
    </div>
  );
};
