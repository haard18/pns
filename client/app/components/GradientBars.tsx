export default function GradientBars() {
  const colors = [
    "bg-blue-600",
    "bg-slate-800",
    "bg-blue-500",
    "bg-blue-700",
    "bg-blue-600",
    "bg-slate-800",
    "bg-blue-600",
    "bg-blue-400",
  ];

  return (
    <div className="flex gap-2 justify-center items-end h-32">
      {colors.map((color, index) => (
        <div
          key={index}
          className={`${color} rounded-t-lg transition-all hover:scale-105`}
          style={{
            height: `${40 + Math.sin(index) * 20 + Math.random() * 30}px`,
            width: "24px",
          }}
        />
      ))}
    </div>
  );
}
