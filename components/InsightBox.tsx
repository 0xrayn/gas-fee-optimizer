type InsightProps = {
  avg: number;
};

export default function InsightBox({ avg }: InsightProps) {
  let text = "";
  let color = "";

  if (avg < 20) {
    text = "🟢 Best time to transact";
    color = "text-green-400";
  } else if (avg < 50) {
    text = "🟡 Moderate gas";
    color = "text-yellow-400";
  } else {
    text = "🔴 Gas is high, wait";
    color = "text-red-400";
  }

  return (
    <div className="glass p-5 rounded-2xl mt-6">
      <h3 className="font-semibold text-lg">
        🤖 AI Insight
      </h3>
      <p className={`mt-2 ${color}`}>{text}</p>
    </div>
  );
}