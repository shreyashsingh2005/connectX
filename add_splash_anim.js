const fs = require('fs');

let css = fs.readFileSync('src/app/globals.css', 'utf8');

const newAnim = `
@keyframes splashDot {
  0%, 100% {
    opacity: 0.35;
    transform: scale(0.85) translateY(0);
  }
  50% {
    opacity: 1;
    transform: scale(1) translateY(-2px);
  }
}

@utility animate-splash-dot {
  animation: splashDot 1.4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-splash-dot {
    animation: none !important;
    opacity: 0.8 !important;
    transform: none !important;
  }
}
`;

css += newAnim;

fs.writeFileSync('src/app/globals.css', css);
console.log('Added splashDot animation to globals.css');
