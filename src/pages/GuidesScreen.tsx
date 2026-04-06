import { useState } from "react";
import { Search, Wrench, Clock, Fan, Droplets, Zap, Home, Refrigerator, Snowflake } from "lucide-react";

const categories = ["All", "HVAC", "Plumbing", "Electrical", "Roof", "Appliances", "Seasonal"];

interface Guide {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  time: string;
  icon: React.ReactNode;
  headerColor: string;
}

const guides: Guide[] = [
  {
    id: "replace-hvac-filter",
    title: "Replace HVAC Filter",
    description: "Swap out your air filter to improve airflow and cut energy costs by up to 15%.",
    category: "HVAC",
    difficulty: 1,
    time: "15 min",
    icon: <Fan className="h-6 w-6" />,
    headerColor: "from-emerald-600/80 to-emerald-800/80",
  },
  {
    id: "flush-water-heater",
    title: "Flush Water Heater",
    description: "Drain sediment buildup to improve efficiency and extend unit lifespan.",
    category: "Plumbing",
    difficulty: 2,
    time: "45 min",
    icon: <Droplets className="h-6 w-6" />,
    headerColor: "from-blue-600/80 to-blue-800/80",
  },
  {
    id: "test-smoke-detectors",
    title: "Test Smoke Detectors",
    description: "Press test buttons on each detector. Replace batteries annually.",
    category: "Electrical",
    difficulty: 1,
    time: "10 min",
    icon: <Zap className="h-6 w-6" />,
    headerColor: "from-amber-600/80 to-amber-800/80",
  },
  {
    id: "inspect-roof-shingles",
    title: "Inspect Roof Shingles",
    description: "Check for missing or curling shingles and granule loss in gutters.",
    category: "Roof",
    difficulty: 2,
    time: "30 min",
    icon: <Home className="h-6 w-6" />,
    headerColor: "from-red-600/80 to-red-800/80",
  },
  {
    id: "clean-fridge-coils",
    title: "Clean Refrigerator Coils",
    description: "Vacuum dust from condenser coils to improve cooling efficiency.",
    category: "Appliances",
    difficulty: 1,
    time: "20 min",
    icon: <Refrigerator className="h-6 w-6" />,
    headerColor: "from-violet-600/80 to-violet-800/80",
  },
  {
    id: "winterize-faucets",
    title: "Winterize Outdoor Faucets",
    description: "Disconnect hoses, shut off supply valves, and drain outdoor lines.",
    category: "Seasonal",
    difficulty: 2,
    time: "30 min",
    icon: <Snowflake className="h-6 w-6" />,
    headerColor: "from-cyan-600/80 to-cyan-800/80",
  },
];

const DifficultyWrenches = ({ level }: { level: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Wrench
        key={i}
        className={`h-3 w-3 ${i < level ? "text-primary" : "text-muted-foreground/20"}`}
      />
    ))}
  </div>
);

const GuidesScreen = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = guides.filter((g) => {
    const matchesSearch = g.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || g.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">DIY Guides</h1>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search guides..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Guide cards grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((guide) => (
          <div key={guide.id} className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
            {/* Colored header */}
            <div className={`bg-gradient-to-br ${guide.headerColor} p-4 flex items-center justify-between`}>
              <span className="text-foreground/90">{guide.icon}</span>
              <span className="text-[10px] font-medium text-foreground/70 bg-background/20 px-2 py-0.5 rounded-full">
                {guide.category}
              </span>
            </div>
            {/* Card body */}
            <div className="p-3.5 flex flex-col flex-1">
              <h3 className="text-foreground font-semibold text-sm mb-1">{guide.title}</h3>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed line-clamp-2 flex-1">{guide.description}</p>
              <div className="flex items-center gap-3 mb-3">
                <DifficultyWrenches level={guide.difficulty} />
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="text-[10px]">{guide.time}</span>
                </div>
              </div>
              <button className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                Start Guide
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GuidesScreen;
