import ChartClient from "@/components/ChartClient";

export const instant = false;

export default async function ChartPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return <ChartClient symbol={(symbol || "XAUUSD").toUpperCase()} />;
}
