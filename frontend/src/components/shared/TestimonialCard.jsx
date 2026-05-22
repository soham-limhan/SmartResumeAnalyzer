import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

/**
 * TestimonialCard — premium testimonial with quote, rating, avatar initials, and role.
 */
export default function TestimonialCard({ name, role, company, quote, rating = 5, avatarColor = 'from-indigo-500 to-violet-600', index = 0 }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <motion.div
      className="testimonial-card"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Stars */}
      <div className="flex items-center gap-0.5 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="w-3.5 h-3.5"
            style={{ color: i < rating ? '#f59e0b' : 'oklch(1 0 0 / 20%)', fill: i < rating ? '#f59e0b' : 'transparent' }}
          />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-sm text-foreground/90 leading-relaxed mb-6 font-medium">
        "{quote}"
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center flex-shrink-0 shadow-lg`}>
          <span className="text-xs font-bold text-white">{initials}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{role} · {company}</p>
        </div>
      </div>
    </motion.div>
  );
}
