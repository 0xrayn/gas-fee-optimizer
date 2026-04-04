import GasCard from "@/components/GasCard";
import GasChart from "@/components/GasChart";
import InsightBox from "@/components/InsightBox";
import ThemeToggle from "@/components/ThemeToggle";
import { getGasData } from "@/lib/getGas";

type GasHistory = {
  time: string;
  gas: number;
};

export default async function Home() {
  const gas = await getGasData();

  const history: GasHistory[] = [
    { time: "01:00", gas: 30 },
    { time: "02:00", gas: 20 },
    { time: "03:00", gas: 15 },
    { time: "04:00", gas: 40 },
    { time: "05:00", gas: 25 },
  ];

  return (
    <main className="min-h-screen p-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
            Gas Fee Optimizer
          </h1>
          <p className="opacity-70">
            Optimize Ethereum transaction timing
          </p>
        </div>

        <ThemeToggle />
      </div>

      {/* GAS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <GasCard title="Low" value={gas.low} color="text-green-400" />
        <GasCard title="Avg" value={gas.avg} color="text-yellow-400" />
        <GasCard title="High" value={gas.high} color="text-red-400" />
      </div>

      {/* CHART */}
      <div className="mt-8">
        <GasChart data={history} />
      </div>

      {/* INSIGHT */}
      <InsightBox avg={gas.avg} />
    </main>
  );
}