import { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * Three.js wireframe topography mesh with mouse-reactive camera,
 * cyan→gold gradient, laser beam, starfield, and glow effects.
 */
export default function WireframeMesh() {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Scene setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 7, 7);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // --- Gaussian peak function ---
    function gaussianPeak(x, z, cx, cz, height, spread) {
      const dx = x - cx;
      const dz = z - cz;
      return height * Math.exp(-(dx * dx + dz * dz) / (2 * spread * spread));
    }

    function getHeight(x, z) {
      return (
        gaussianPeak(x, z, -1.5, -0.5, 4.2, 0.8) +
        gaussianPeak(x, z, 1.8, 0.5, 1.8, 0.9) +
        gaussianPeak(x, z, 0.3, -2.5, 1.8, 0.7) +
        gaussianPeak(x, z, -0.5, 1.5, 1.2, 0.6) +
        gaussianPeak(x, z, 2.5, -1.5, 1.0, 0.5) +

        gaussianPeak(x, z, -1.0, 2.5, 1.5, 0.7) +
        gaussianPeak(x, z, 2.0, 3.8, 2.0, 0.5)
      );
    }

    // --- Build wireframe grid ---
    const gridSize = 55;
    const gridExtent = 5;
    const step = (gridExtent * 2) / gridSize;

    function buildWireframeLines() {
      const positions = [];
      const colors = [];

      const cyanColor = new THREE.Color(0x00e5ff);
      const goldColor = new THREE.Color(0xd4a844);
      const tempColor = new THREE.Color();

      function addVertex(x, y, z) {
        positions.push(x, y, z);
        const t = (x + gridExtent) / (2 * gridExtent);
        tempColor.copy(cyanColor).lerp(goldColor, t);
        const brightness = 0.5 + 0.5 * (y / 4.5);
        colors.push(
          tempColor.r * brightness,
          tempColor.g * brightness,
          tempColor.b * brightness
        );
      }

      // Horizontal lines (along x)
      for (let j = 0; j <= gridSize; j++) {
        const z = -gridExtent + j * step;
        for (let i = 0; i < gridSize; i++) {
          const x1 = -gridExtent + i * step;
          const x2 = -gridExtent + (i + 1) * step;
          const y1 = getHeight(x1, z);
          const y2 = getHeight(x2, z);
          addVertex(x1, y1, z);
          addVertex(x2, y2, z);
        }
      }

      // Vertical lines (along z)
      for (let i = 0; i <= gridSize; i++) {
        const x = -gridExtent + i * step;
        for (let j = 0; j < gridSize; j++) {
          const z1 = -gridExtent + j * step;
          const z2 = -gridExtent + (j + 1) * step;
          const y1 = getHeight(x, z1);
          const y2 = getHeight(x, z2);
          addVertex(x, y1, z1);
          addVertex(x, y2, z2);
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
      );
      geometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(colors, 3)
      );

      return geometry;
    }

    // Main wireframe
    const wireGeometry = buildWireframeLines();
    const wireMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const wireframe = new THREE.LineSegments(wireGeometry, wireMaterial);
    scene.add(wireframe);

    // Glow wireframe (slightly thicker, more transparent)
    const glowMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.15,
      linewidth: 1,
    });
    const glowWireframe = new THREE.LineSegments(
      wireGeometry.clone(),
      glowMaterial
    );
    glowWireframe.scale.set(1.002, 1.002, 1.002);
    scene.add(glowWireframe);

    // --- Laser beam ---
    const laserPeakX = -1.5;
    const laserPeakZ = -0.5;
    const laserPeakY = getHeight(laserPeakX, laserPeakZ);

    // Core beam (bright, thin)
    const beamPositions = [
      laserPeakX, laserPeakY, laserPeakZ,
      laserPeakX, laserPeakY + 18, laserPeakZ,
    ];
    const beamGeometry = new THREE.BufferGeometry();
    beamGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(beamPositions, 3)
    );
    const beamMaterial = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 1.9,
    });
    const beam = new THREE.LineSegments(beamGeometry, beamMaterial);
    scene.add(beam);

    // Glow layers for laser
    for (let i = 1; i <= 3; i++) {
      const glowBeam = beam.clone();
      glowBeam.material = new THREE.LineBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.15 / i,
      });
      glowBeam.scale.set(1 + i * 0.01, 1, 1 + i * 0.01);
      scene.add(glowBeam);
    }

    // Laser glow point light
    const laserLight = new THREE.PointLight(0x00e5ff, 2, 8);
    laserLight.position.set(laserPeakX, laserPeakY + 1, laserPeakZ);
    scene.add(laserLight);

    // --- Starfield ---
    const starCount = 200;
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 60;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      starPositions[i * 3 + 2] = -10 - Math.random() * 30;
      starSizes[i] = Math.random() * 1.5 + 0.5;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starPositions, 3)
    );
    starGeometry.setAttribute(
      'size',
      new THREE.Float32BufferAttribute(starSizes, 1)
    );
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // --- Ambient light ---
    const ambientLight = new THREE.AmbientLight(0x112233, 0.5);
    scene.add(ambientLight);

    // --- Mouse tracking ---
    function handleMouseMove(e) {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    }
    window.addEventListener('mousemove', handleMouseMove);

    // --- Camera base position ---
    const baseCamX = 0;
    const baseCamY = 6;
    const baseCamZ = 12;
    const camTiltRange = 1.5;

    // --- Animation loop ---
    let time = 0;
    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      time += 0.005;

      // Mouse-reactive camera
      const targetX = baseCamX + mouseRef.current.x * camTiltRange;
      const targetY = baseCamY - mouseRef.current.y * camTiltRange * 0.5;
      camera.position.x += (targetX - camera.position.x) * 0.03;
      camera.position.y += (targetY - camera.position.y) * 0.03;
      camera.position.z = baseCamZ;
      camera.lookAt(0, 1, 0);

      // Subtle starfield drift
      stars.rotation.y = time * 0.02;
      stars.rotation.x = time * 0.01;

      // Laser pulse
      beamMaterial.opacity = 0.7 + 0.3 * Math.sin(time * 4);
      laserLight.intensity = 1.5 + 0.5 * Math.sin(time * 4);

      renderer.render(scene, camera);
    }
    animate();

    // --- Resize handler ---
    function handleResize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', handleResize);

    // --- Cleanup ---
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="wireframe-mesh-container" />;
}
