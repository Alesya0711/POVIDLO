import welcome from '../../assets/mascot/kapibankir-welcome-v1.png';
import thinking from '../../assets/mascot/kapibankir-thinking-v1.png';
import compare from '../../assets/mascot/kapibankir-compare-v1.png';
import review from '../../assets/mascot/kapibankir-review-v1.png';
import calculator from '../../assets/mascot/kapibankir-calculator-v1.png';
import search from '../../assets/mascot/kapibankir-search-v1.png';
import journey from '../../assets/mascot/kapibankir-journey-v1.png';
import signing from '../../assets/mascot/kapibankir-signing-v1.png';
import savings from '../../assets/mascot/kapibankir-savings-v1.png';
import celebrate from '../../assets/mascot/kapibankir-celebrate-v1.png';

const frames = {
  welcome: { src: welcome, width: 1312, height: 1199 },
  thinking: { src: thinking, width: 1312, height: 1199 },
  compare: { src: compare, width: 1312, height: 1199 },
  review: { src: review, width: 1312, height: 1199 },
  calculator: { src: calculator, width: 1199, height: 1312 },
  search: { src: search, width: 1312, height: 1199 },
  journey: { src: journey, width: 1312, height: 1199 },
  signing: { src: signing, width: 1312, height: 1199 },
  savings: { src: savings, width: 1312, height: 1199 },
  celebrate: { src: celebrate, width: 1312, height: 1199 }
};
export type MascotPose = keyof typeof frames;

/** Decorative by default; nearby copy explains each action independently. */
export function Mascot({ pose, className = '', alt = '' }: { pose: MascotPose; className?: string; alt?: string }) {
  const frame=frames[pose];
  return <img src={frame.src} width={frame.width} height={frame.height} alt={alt} className={`h-auto object-contain ${className}`} />;
}
