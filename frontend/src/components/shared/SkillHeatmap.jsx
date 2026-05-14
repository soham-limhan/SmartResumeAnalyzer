import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

function getHeatColor(score) {
  if (score >= 80) return 'bg-emerald-500/80';
  if (score >= 60) return 'bg-blue-500/70';
  if (score >= 40) return 'bg-amber-500/70';
  if (score >= 20) return 'bg-orange-500/70';
  return 'bg-red-500/60';
}

export default function SkillHeatmap({ skills = [] }) {
  if (!skills.length) return null;

  // Group by category
  const categories = {};
  skills.forEach((skill) => {
    const cat = skill.category || 'General';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(skill);
  });

  return (
    <div className="space-y-4">
      {Object.entries(categories).map(([category, catSkills]) => (
        <div key={category}>
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">
            {category}
          </h4>
          <div className="flex flex-wrap gap-2">
            {catSkills.map((skill, i) => (
              <Tooltip key={skill.name}>
                <TooltipTrigger asChild>
                  <motion.div
                    className={`heatmap-cell px-3 py-1.5 rounded-lg text-xs font-medium cursor-default
                      text-white ${getHeatColor(skill.score)}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    {skill.name}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{skill.name}: {skill.score}/100</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
