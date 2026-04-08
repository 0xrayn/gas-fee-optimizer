import { getGasData } from "@/lib/getGas";
import Dashboard from "@/components/Dashboard";

// Pre-fetch initial gas on server (Ethereum default)
export const revalidate = 10;

export const metadata = {
  title: "GasWatch Gas Optimizer",
  description: "Real-time Ethereum gas fee tracker with multi-chain support, auto-refresh, and smart insights.",
};

export default async function Home() {
 
  return <Dashboard />;
}
