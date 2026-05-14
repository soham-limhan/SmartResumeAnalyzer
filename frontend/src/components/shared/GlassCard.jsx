import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', hover = true, glow = false, ...props }) {
  return (
    <motion.div
      className={`glass rounded-2xl p-6 ${glow ? 'glow-purple' : ''} ${className}`}
      whileHover={hover ? { y: -2, scale: 1.005 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
