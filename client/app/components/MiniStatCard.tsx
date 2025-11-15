interface MiniStatCardProps {
  number: string;
  title: string;
  description: string;
}

export default function MiniStatCard({
  number,
  title,
  description,
}: MiniStatCardProps) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <div className="text-3xl font-bold text-blue-400 mb-2">{number}</div>
      <h4 className="font-semibold text-white text-sm uppercase tracking-wider mb-2">
        {title}
      </h4>
      <p className="text-gray-400 text-xs">{description}</p>
    </div>
  );
}
