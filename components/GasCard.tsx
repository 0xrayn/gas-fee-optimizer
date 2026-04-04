type GasCardProps = {
    title: string;
    value: number;
    color: string;
};

export default function GasCard({
    title,
    value,
    color,
}: GasCardProps) {
    return (
        <div className="div glass p-5 rounded-2xl">
            <p className="text-sm opacity-70">{title}</p>
            <h2 className={`text-3xl font-bold ${color}`}>{value} Gwei</h2>
        </div>
    )
}
