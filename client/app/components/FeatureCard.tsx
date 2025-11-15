interface FeatureCardProps {
  title: string;
  description: string;
  hasImage?: boolean;
}

export default function FeatureCard({
  title,
  description,
  hasImage = true,
}: FeatureCardProps) {
  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-8 hover:border-blue-500/50 transition">
      {hasImage && (
        <div className="h-32 w-32 bg-gradient-to-br from-blue-300 to-blue-100 rounded-lg mb-6" />
      )}
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
