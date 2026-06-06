import { motion } from 'framer-motion';

/**
 * FeatureCard — premium feature card with icon, title, description and hover effects.
 */
export default function FeatureCard({ icon: Icon, title, description, index = 0 }) {
  return (
    <motion.div
      className="feature-card glass rounded-2xl p-6 cursor-default border border-white/8"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -6 }}
    >
      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
        <Icon className="w-5 h-5 text-primary" />
      </div>

      {/* Content */}
      <h3 className="font-heading font-semibold text-base text-foreground mb-2 leading-snug">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>

      {/* Bottom accent */}
      <div className="mt-5 h-0.5 w-8 rounded-full bg-primary/60" />
    </motion.div>
  );
}
