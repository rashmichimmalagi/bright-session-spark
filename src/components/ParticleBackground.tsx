const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  left: `${(i * 37 + 13) % 100}%`,
  delay: `${(i * 3.7) % 20}s`,
  duration: `${15 + (i * 2.3) % 15}s`,
  size: `${2 + (i % 3)}px`,
}));

export function ParticleBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary/30"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animation: `float-up ${p.duration} linear ${p.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}
