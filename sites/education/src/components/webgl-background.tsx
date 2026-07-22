"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const VERTEX = /* glsl */ `
uniform float uTime;
uniform vec2 uMouse;
uniform float uPixelRatio;
uniform float uScroll;

attribute float aSize;
attribute vec3 aColor;
attribute vec2 aSeed;

varying vec3 vColor;
varying float vAlpha;

void main() {
    vec3 pos = position;

    float t = uTime * 0.10;
    float sx = aSeed.x * 6.283;
    float sy = aSeed.y * 6.283;

    pos.x += sin(t + sx) * 16.0 + cos(t * 0.6 + sy) * 7.0;
    pos.y += cos(t * 0.8 + sy) * 12.0 + sin(t * 0.4 + sx) * 5.0;
    pos.z += sin(t * 0.35 + sx * 0.5) * 8.0;

    pos.y += uScroll * 0.08;

    vec2 delta = pos.xy - uMouse;
    float dist = length(delta);
    float radius = 100.0;
    if (dist < radius && dist > 0.001) {
        float strength = 1.0 - dist / radius;
        pos.xy += normalize(delta) * strength * strength * 45.0;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uPixelRatio * (220.0 / -mvPosition.z);
    gl_PointSize = max(gl_PointSize, 1.0);

    vColor = aColor;

    float edgeFade = 1.0 - smoothstep(280.0, 420.0, length(pos.xy));
    float depthFade = smoothstep(200.0, 50.0, abs(pos.z));
    vAlpha = edgeFade * depthFade;
}
`;

const FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float glow = smoothstep(0.5, 0.05, d);
    float alpha = glow * vAlpha * 0.12;
    gl_FragColor = vec4(vColor * glow, alpha);
}
`;

export default function WebGLBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let w = window.innerWidth;
        let h = window.innerHeight;
        const isMobile = w < 768;
        const count = isMobile ? 180 : 320;
        const dpr = Math.min(window.devicePixelRatio, 2);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, w / h, 1, 1000);
        camera.position.z = 300;

        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: false,
            powerPreference: "high-performance",
        });
        renderer.setSize(w, h);
        renderer.setPixelRatio(dpr);

        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const colors = new Float32Array(count * 3);
        const seeds = new Float32Array(count * 2);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 900;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 700;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

            sizes[i] = Math.random() < 0.92
                ? Math.random() * 2.5 + 0.5
                : Math.random() * 5 + 2.5;

            const pick = Math.random();
            if (pick < 0.45) {
                // Muted gold
                colors[i * 3] = 0.82 + Math.random() * 0.10;
                colors[i * 3 + 1] = 0.68 + Math.random() * 0.12;
                colors[i * 3 + 2] = 0.35 + Math.random() * 0.15;
            } else if (pick < 0.75) {
                // Warm beige
                colors[i * 3] = 0.80 + Math.random() * 0.10;
                colors[i * 3 + 1] = 0.72 + Math.random() * 0.10;
                colors[i * 3 + 2] = 0.55 + Math.random() * 0.15;
            } else if (pick < 0.92) {
                // Soft terracotta
                colors[i * 3] = 0.78 + Math.random() * 0.12;
                colors[i * 3 + 1] = 0.55 + Math.random() * 0.10;
                colors[i * 3 + 2] = 0.35 + Math.random() * 0.12;
            } else {
                // Pale amber highlight
                colors[i * 3] = 0.90 + Math.random() * 0.08;
                colors[i * 3 + 1] = 0.80 + Math.random() * 0.10;
                colors[i * 3 + 2] = 0.50 + Math.random() * 0.15;
            }

            seeds[i * 2] = Math.random() * 100;
            seeds[i * 2 + 1] = Math.random() * 100;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 2));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(9999, 9999) },
                uPixelRatio: { value: dpr },
                uScroll: { value: 0 },
            },
            vertexShader: VERTEX,
            fragmentShader: FRAGMENT,
            transparent: true,
            depthWrite: false,
            blending: THREE.NormalBlending,
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);

        const _vec = new THREE.Vector3();
        const _dir = new THREE.Vector3();

        const onMouseMove = (e: MouseEvent) => {
            _vec.set(
                (e.clientX / window.innerWidth) * 2 - 1,
                -(e.clientY / window.innerHeight) * 2 + 1,
                0.5,
            );
            _vec.unproject(camera);
            _dir.copy(_vec).sub(camera.position).normalize();
            const d = -camera.position.z / _dir.z;
            material.uniforms.uMouse.value.set(
                camera.position.x + _dir.x * d,
                camera.position.y + _dir.y * d,
            );
        };

        const onMouseLeave = () => {
            material.uniforms.uMouse.value.set(9999, 9999);
        };

        const onScroll = () => {
            material.uniforms.uScroll.value = window.scrollY;
        };

        window.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseleave", onMouseLeave);
        window.addEventListener("scroll", onScroll, { passive: true });

        let raf: number;
        let visible = true;
        const start = performance.now();

        const onVis = () => {
            visible = !document.hidden;
        };
        document.addEventListener("visibilitychange", onVis);

        const animate = () => {
            raf = requestAnimationFrame(animate);
            if (!visible) return;
            material.uniforms.uTime.value = (performance.now() - start) * 0.001;
            renderer.render(scene, camera);
        };
        animate();

        const onResize = () => {
            w = window.innerWidth;
            h = window.innerHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener("resize", onResize);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseleave", onMouseLeave);
            window.removeEventListener("scroll", onScroll);
            document.removeEventListener("visibilitychange", onVis);
            window.removeEventListener("resize", onResize);
            geometry.dispose();
            material.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }}
        />
    );
}
