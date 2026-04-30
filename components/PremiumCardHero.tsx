'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export const PremiumCardHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true, 
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false 
      });
    } catch (e) {
      console.error("WebGL Renderer creation failed in PremiumCardHero:", e);
      return;
    }
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // --- Card Face Texture ---
    const createCanvasTexture = (isBack = false) => {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1280;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Pure White Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 2048, 1280);

      // Extremely subtle pearl/ceramic grain
      ctx.fillStyle = 'rgba(0,0,0,0.01)';
      for (let i = 0; i < 5000; i++) {
        ctx.fillRect(Math.random() * 2048, Math.random() * 1280, 2, 2);
      }

      if (!isBack) {
        // --- FRONT FACE DETAILS ---
        // Bank Name - High Contrast Charcoal
        ctx.fillStyle = '#0a0a0f';
        ctx.font = '300 75px "Inter", sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('TROVIA.OS', 1920, 100);

        // Card Number - Deep Black/Grey
        ctx.font = '700 110px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.letterSpacing = '14px';
        ctx.fillStyle = '#111118';
        ctx.fillText('**** **** **** ****', 160, 840);

        // Name - Elegant Black
        ctx.font = '500 48px "Inter", sans-serif';
        ctx.fillStyle = '#1a1a22';
        ctx.fillText('DECENTRALIZED AI', 160, 1120);
      } else {
        // --- BACK FACE DETAILS ---
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 150, 2048, 280); // Mag stripe

        // Subtle logo on back
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '700 40px "Inter", sans-serif';
        ctx.fillText('TROVIA SECURITY', 160, 600);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.anisotropy = 16;
      return tex;
    };

    const frontTex = createCanvasTexture(false);
    const backTex = createCanvasTexture(true);

    // --- Card Mesh ---
    const cardGeom = new THREE.BoxGeometry(4.0, 2.5, 0.08);
    
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    const envLight = new THREE.DirectionalLight(0xffffff, 2);
    envLight.position.set(1, 1, 1);
    envScene.add(envLight);
    const envMap = pmremGenerator.fromScene(envScene).texture;

    const cardMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      map: frontTex,
      envMap: envMap,
      envMapIntensity: 1.2,
      reflectivity: 1.0
    });

    const sideMat = new THREE.MeshPhysicalMaterial({ 
      color: 0xffffff, 
      metalness: 0.0, 
      roughness: 0.1
    });

    const backMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.05,
      map: backTex
    });

    const card = new THREE.Mesh(cardGeom, [
        sideMat, sideMat, sideMat, sideMat, cardMat, backMat
    ]);
    card.position.set(0, -0.5, 0); // Centered
    scene.add(card);

    // Holographic iridescent strip - Adjusted for smaller card
    const stripGeom = new THREE.PlaneGeometry(3.9, 0.25);
    const stripMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 1.0,
      roughness: 0.0,
      iridescence: 1.0,
      iridescenceIOR: 1.3,
      transparent: true,
      opacity: 0.7
    });
    const strip = new THREE.Mesh(stripGeom, stripMat);
    strip.position.set(0, 1.05, 0.041);
    card.add(strip);

    // Gold Chip - Adjusted for smaller card
    const chipGeom = new THREE.PlaneGeometry(0.5, 0.35);
    const chipMat = new THREE.MeshStandardMaterial({ 
      color: 0xffd700, 
      metalness: 1.0, 
      roughness: 0.1, 
      emissive: 0xffaa00, 
      emissiveIntensity: 0.4 
    });
    const chip = new THREE.Mesh(chipGeom, chipMat);
    chip.position.set(-1.4, -0.4, 0.042);
    card.add(chip);

    // --- Environment ---
    const starCount = 500;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i*3] = (Math.random() - 0.5) * 40;
      starPos[i*3+1] = (Math.random() - 0.5) * 20;
      starPos[i*3+2] = (Math.random() - 0.5) * 10 - 5;
    }
    const starGeom = new THREE.BufferGeometry();
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, transparent: true, opacity: 0.9 });
    const stars = new THREE.Points(starGeom, starMat);
    scene.add(stars);

    // Lighting Setup - Brightened for Visibility
    const ambLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3);
    keyLight.position.set(5, 5, 10);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
    fillLight.position.set(-5, 0, 5);
    scene.add(fillLight);

    // Orbiting Lights
    const lightOrbit1 = new THREE.PointLight(0xffffff, 15, 30);
    const lightOrbit2 = new THREE.PointLight(0xe0e0ff, 10, 30);
    scene.add(lightOrbit1, lightOrbit2);

    // Background Glow: dark grey for contrast
    const glowGeom = new THREE.PlaneGeometry(40, 30);
    const glowMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(0x0a0a12) } },
      transparent: true,
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec2 vUv; uniform vec3 uColor; void main() { float d = distance(vUv, vec2(0.5)); gl_FragColor = vec4(uColor, (1.0 - d * 2.0) * 0.6); }`
    });
    const bgGlow = new THREE.Mesh(glowGeom, glowMat);
    bgGlow.position.z = -10;
    scene.add(bgGlow);

    // Pure White Halo - Adjusted for smaller card
    const haloGeom = new THREE.PlaneGeometry(6, 4.5);
    const haloMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(0xffffff) } },
      transparent: true,
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec2 vUv; uniform vec3 uColor; void main() { float d = distance(vUv, vec2(0.5)); float strength = pow(1.0 - d * 2.0, 4.0); gl_FragColor = vec4(uColor, strength * 0.3); }`
    });
    const halo = new THREE.Mesh(haloGeom, haloMat);
    halo.position.z = -0.05;
    card.add(halo);

    // --- Post Processing ---
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.3, 0.4, 0.95);
    composer.addPass(bloomPass);

    // --- Animation ---
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      card.position.y = -0.5 + Math.sin(time * 0.5) * 0.15;
      card.rotation.y += 0.005;
      card.rotation.z = Math.sin(time * 0.3) * 0.05;

      lightOrbit1.position.set(Math.cos(time * 0.4) * 8, Math.sin(time * 0.2) * 5, 4);
      lightOrbit2.position.set(Math.sin(time * 0.3) * 8, Math.cos(time * 0.5) * 5, 4);

      stars.rotation.y += 0.0001;
      composer.render();
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
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

      pmremGenerator.dispose();
      renderer.dispose();
      composer.dispose();
      
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ opacity: 1.0 }}
    />
  );
};
