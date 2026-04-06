import { useState } from "react";
import { Search, Wrench, Clock, ChevronRight } from "lucide-react";

const categories = ["All", "HVAC", "Plumbing", "Electrical", "Roof", "Appliances"];

interface Guide {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  time: string;
}

const guides: Guide[] = [
  {
    id: "replace-hvac-filter",
    title: "Replace HVAC Filter",
    description: "Swap out your air filter to improve airflow and indoor air quality. A clean filter reduces energy costs by up to 15%.",
    category: "HVAC",
    difficulty: 1,
    time: "15 min",
  },
  {
    id: "flush-water-heater",
    title: "Flush Water Heater",
    description: "Drain sediment buildup from your water heater tank to improve efficiency and extend the unit's lifespan.",
    category: "Plumbing",
    difficulty: 2,
    time: "45 min",
  },
  {
    id: "test-smoke-detectors",
    title: "Test Smoke Detectors",
    description: "Press the test button on each smoke and CO detector. Replace batteries annually and units every 10 years.",
    category: "Electrical",
    difficulty: 1,
    time: "10 min",
  },
  {
    id: "inspect-roof-shingles",
    title: "Inspect Roof Shingles",
    description: "Check for missing, cracked, or curling shingles from the ground or with binoculars. Look for granule loss in gutters.",
    category: "Roof",
    difficulty: 2,
    time: "30 min",
  },
];

const DifficultyWrenches = ({ level }: { level: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Wrench
        key={i}
        className={`h-3.5 w-3.5 ${i < level ? "text-primary" : "text-muted-foreground/30"}`}
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
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
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

      {/* Guide cards */}
      <div className="flex flex-col gap-3">
        {filtered.map((guide) => (
          <div key={guide.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-foreground font-semibold">{guide.title}</h3>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
                {guide.category}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{guide.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <DifficultyWrenches level={guide.difficulty} />
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-xs">{guide.time}</span>
                </div>
              </div>
              <button className="flex items-center gap-1 text-primary text-sm font-medium hover:opacity-80 transition-opacity">
                Start Guide <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default GuidesScreen;
