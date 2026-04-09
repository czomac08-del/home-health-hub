import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Wrench, Clock, Fan, Droplets, Zap, Home, Refrigerator, Snowflake,
  Play, Bookmark, ExternalLink, Star, ChevronRight, User, Eye, Calendar,
  ThermometerSun, Leaf, Sun, TreePine, Flame, Shield, Waves,
  Sparkles, ShoppingCart, Lock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/* ─── Types ─── */
interface Guide {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  time: string;
  icon: React.ReactNode;
  headerColor: string;
  tools?: { name: string; price: string; link: string }[];
}

interface VideoCard {
  id: string;
  title: string;
  channel: string;
  views: string;
  uploaded: string;
  duration: string;
  thumbnail: string;
  matchLevel: "exact" | "good" | "general";
  isPartner: boolean;
}

interface FeaturedCreator {
  name: string;
  subscribers: string;
  specialty: string;
  description: string;
  avatar: string;
}

/* ─── Static Data ─── */
const skillLevels = ["Complete Beginner", "Some Experience", "Comfortable with Basic Repairs", "Advanced DIY", "Professional"];

const guides: Guide[] = [
  {
    id: "replace-hvac-filter", title: "Replace HVAC Filter",
    description: "Swap out your air filter to improve airflow and cut energy costs by up to 15%.",
    category: "HVAC", difficulty: 1, time: "15 min",
    icon: <Fan className="h-6 w-6" />, headerColor: "from-emerald-600/80 to-emerald-800/80",
    tools: [
      { name: "Replacement Filter (16x25x1)", price: "$12.99", link: "#" },
      { name: "Vacuum with brush attachment", price: "$0 (use yours)", link: "#" },
    ],
  },
  {
    id: "flush-water-heater", title: "Flush Water Heater",
    description: "Drain sediment buildup to improve efficiency and extend unit lifespan.",
    category: "Plumbing", difficulty: 2, time: "45 min",
    icon: <Droplets className="h-6 w-6" />, headerColor: "from-blue-600/80 to-blue-800/80",
    tools: [
      { name: "Garden hose", price: "$0", link: "#" },
      { name: "Bucket", price: "$0", link: "#" },
      { name: "Pipe wrench", price: "$14.99", link: "#" },
    ],
  },
  {
    id: "test-smoke-detectors", title: "Test Smoke Detectors",
    description: "Press test buttons on each detector. Replace batteries annually.",
    category: "Electrical", difficulty: 1, time: "10 min",
    icon: <Zap className="h-6 w-6" />, headerColor: "from-amber-600/80 to-amber-800/80",
    tools: [{ name: "9V Batteries (pack of 4)", price: "$8.99", link: "#" }],
  },
  {
    id: "inspect-roof-shingles", title: "Inspect Roof Shingles",
    description: "Check for missing or curling shingles and granule loss in gutters.",
    category: "Roof", difficulty: 2, time: "30 min",
    icon: <Home className="h-6 w-6" />, headerColor: "from-red-600/80 to-red-800/80",
    tools: [
      { name: "Binoculars", price: "$29.99", link: "#" },
      { name: "Ladder (if safe access)", price: "$0", link: "#" },
    ],
  },
  {
    id: "clean-fridge-coils", title: "Clean Refrigerator Coils",
    description: "Vacuum dust from condenser coils to improve cooling efficiency.",
    category: "Appliances", difficulty: 1, time: "20 min",
    icon: <Refrigerator className="h-6 w-6" />, headerColor: "from-violet-600/80 to-violet-800/80",
    tools: [{ name: "Coil cleaning brush", price: "$9.99", link: "#" }],
  },
  {
    id: "winterize-faucets", title: "Winterize Outdoor Faucets",
    description: "Disconnect hoses, shut off supply valves, and drain outdoor lines.",
    category: "Seasonal", difficulty: 2, time: "30 min",
    icon: <Snowflake className="h-6 w-6" />, headerColor: "from-cyan-600/80 to-cyan-800/80",
    tools: [
      { name: "Faucet insulation cover (2-pack)", price: "$7.99", link: "#" },
      { name: "Pipe insulation wrap", price: "$5.99", link: "#" },
    ],
  },
];

const featuredCreators: FeaturedCreator[] = [
  { name: "This Old House", subscribers: "2.8M", specialty: "General Home Repair", description: "Professional-grade tutorials for every skill level", avatar: "🏠" },
  { name: "Word of Advice TV", subscribers: "1.2M", specialty: "HVAC & Plumbing", description: "Clear step-by-step HVAC maintenance guides", avatar: "🔧" },
  { name: "Everyday Home Repairs", subscribers: "900K", specialty: "DIY Basics", description: "Perfect for beginners — simple fixes explained well", avatar: "🛠️" },
  { name: "The Honest Carpenter", subscribers: "650K", specialty: "Structural & Carpentry", description: "In-depth tutorials on framing, decks, and woodwork", avatar: "🪚" },
];

const getSeasonalGuides = () => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return { season: "Spring", icon: Leaf, guides: ["HVAC tune-up", "Gutter cleaning", "Well inspection", "Exterior paint check", "Deck sealing"] };
  if (month >= 5 && month <= 7) return { season: "Summer", icon: Sun, guides: ["AC efficiency check", "Irrigation system test", "Exterior painting", "Window seal inspection", "Pool maintenance"] };
  if (month >= 8 && month <= 10) return { season: "Fall", icon: TreePine, guides: ["Furnace prep", "Weatherization", "Roof inspection", "Chimney sweep", "Drain winterization"] };
  return { season: "Winter", icon: Snowflake, guides: ["Pipe freeze prevention", "Heating check", "Generator test", "Ice dam prevention", "Draft sealing"] };
};

const mockVideos: VideoCard[] = [
  { id: "1", title: "How to Replace Your HVAC Filter — Complete Guide", channel: "This Old House", views: "1.2M", uploaded: "8 months ago", duration: "12:34", thumbnail: "", matchLevel: "exact", isPartner: true },
  { id: "2", title: "Water Heater Maintenance Tips Every Homeowner Needs", channel: "Word of Advice TV", views: "890K", uploaded: "1 year ago", duration: "18:22", thumbnail: "", matchLevel: "good", isPartner: true },
  { id: "3", title: "Testing Smoke Detectors the Right Way", channel: "Everyday Home Repairs", views: "340K", uploaded: "6 months ago", duration: "8:15", thumbnail: "", matchLevel: "general", isPartner: false },
];

/* ─── Components ─── */
const DifficultyWrenches = ({ level }: { level: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Wrench key={i} className={`h-3 w-3 ${i < level ? "text-primary" : "text-muted-foreground/20"}`} />
    ))}
  </div>
);

const MatchBadge = ({ level }: { level: "exact" | "good" | "general" }) => {
  const styles = {
    exact: "bg-health-green/15 text-health-green",
    good: "bg-primary/15 text-primary",
    general: "bg-secondary text-muted-foreground",
  };
  const labels = { exact: "Exact Match", good: "Good Match", general: "General" };
  return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${styles[level]}`}>{labels[level]}</span>;
};

/* ─── Main Screen ─── */
const GuidesScreen = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [skillLevel, setSkillLevel] = useState(2);
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [savedVideos, setSavedVideos] = useState<Set<string>>(new Set());
  const [followedCreators, setFollowedCreators] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const seasonal = getSeasonalGuides();
  const SeasonIcon = seasonal.icon;

  // Smart categories based on what systems homeowner has
  const smartCategories = ["All", "HVAC", "Plumbing", "Electrical", "Roof", "Appliances", "Seasonal", "Well Water", "Propane", "Septic"];

  const filtered = guides.filter((g) => {
    const matchesSearch = g.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || g.category === activeCategory;
    const matchesDifficulty = g.difficulty <= skillLevel + 1;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const toggleSaveVideo = (id: string) => {
    setSavedVideos(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleFollowCreator = (name: string) => {
    setFollowedCreators(prev => {
      const n = new Set(prev);
      n.has(name) ? n.delete(name) : n.add(name);
      return n;
    });
  };

  return (
    <div className="min-h-screen pb-24 max-w-lg lg:max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">DIY Guides</h1>
        <button onClick={() => setShowSkillPicker(!showSkillPicker)}
          className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-primary/20">
          <Wrench className="h-3 w-3" /> {skillLevels[skillLevel].split(" ")[0]}
        </button>
      </div>

      {/* Skill Level Picker */}
      {showSkillPicker && (
        <div className="rounded-xl border border-border bg-card p-4 mb-4 animate-fade-in">
          <h3 className="text-sm font-semibold text-foreground mb-3">My DIY Skill Level</h3>
          <div className="space-y-2">
            {skillLevels.map((level, i) => (
              <button key={level} onClick={() => { setSkillLevel(i); setShowSkillPicker(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  skillLevel === i ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:bg-secondary"
                }`}>
                <div className="flex items-center gap-2">
                  <DifficultyWrenches level={i + 1} />
                  <span>{level}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Seasonal Section */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <SeasonIcon className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">This {seasonal.season}</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {seasonal.guides.map((g, i) => (
            <span key={i} className="text-xs bg-card border border-border px-3 py-1.5 rounded-full whitespace-nowrap text-foreground">
              {g}
            </span>
          ))}
        </div>
      </div>

      {/* Featured Creators */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Featured Creators</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {featuredCreators.map(creator => (
            <div key={creator.name} className="min-w-[160px] rounded-xl border border-border bg-card p-3 flex flex-col items-center text-center shrink-0">
              <div className="text-3xl mb-1">{creator.avatar}</div>
              <p className="text-xs font-semibold text-foreground mb-0.5">{creator.name}</p>
              <p className="text-[10px] text-muted-foreground mb-1">{creator.subscribers} subscribers</p>
              <p className="text-[9px] text-primary font-medium mb-2">{creator.specialty}</p>
              <button onClick={() => toggleFollowCreator(creator.name)}
                className={`w-full py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
                  followedCreators.has(creator.name)
                    ? "bg-secondary text-foreground" : "bg-primary/15 text-primary hover:bg-primary/25"
                }`}>
                {followedCreators.has(creator.name) ? "Following" : "Follow"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder="Search guides..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      {/* Smart Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
        {smartCategories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Video Cards */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recommended Videos</h2>
        <div className="space-y-3">
          {mockVideos.map(video => (
            <div key={video.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Thumbnail placeholder */}
              <div className="h-36 bg-gradient-to-br from-secondary to-muted flex items-center justify-center relative">
                <Play className="h-12 w-12 text-foreground/30" />
                <span className="absolute bottom-2 right-2 text-[10px] font-medium text-foreground bg-background/80 px-1.5 py-0.5 rounded">
                  {video.duration}
                </span>
                {video.isPartner && (
                  <span className="absolute top-2 left-2 text-[9px] font-bold text-primary bg-primary/15 border border-primary/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" /> Partner · Verified Expert
                  </span>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-medium text-foreground leading-tight">{video.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{video.channel}</p>
                  </div>
                  <MatchBadge level={video.matchLevel} />
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {video.views}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {video.uploaded}</span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 flex items-center justify-center gap-1">
                    <Play className="h-3.5 w-3.5" /> Watch
                  </button>
                  <button onClick={() => toggleSaveVideo(video.id)}
                    className={`px-3 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                      savedVideos.has(video.id) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                    }`}>
                    <Bookmark className={`h-3.5 w-3.5 ${savedVideos.has(video.id) ? "fill-primary" : ""}`} />
                    {savedVideos.has(video.id) ? "Saved" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Guide cards grid */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Step-by-Step Guides</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {filtered.map((guide) => (
          <div key={guide.id} className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
            <div className={`bg-gradient-to-br ${guide.headerColor} p-4 flex items-center justify-between`}>
              <span className="text-foreground/90">{guide.icon}</span>
              <span className="text-[10px] font-medium text-foreground/70 bg-background/20 px-2 py-0.5 rounded-full">{guide.category}</span>
            </div>
            <div className="p-3.5 flex flex-col flex-1">
              <h3 className="text-foreground font-semibold text-sm mb-1">{guide.title}</h3>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed line-clamp-2 flex-1">{guide.description}</p>
              <div className="flex items-center gap-3 mb-2">
                <DifficultyWrenches level={guide.difficulty} />
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="text-[10px]">{guide.time}</span>
                </div>
              </div>
              {/* Tools & Parts */}
              {guide.tools && guide.tools.length > 0 && (
                <div className="border-t border-border/50 pt-2 mb-2">
                  <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mb-1">
                    <ShoppingCart className="h-3 w-3" /> Est. ${guide.tools.reduce((sum, t) => sum + (parseFloat(t.price.replace(/[^0-9.]/g, "")) || 0), 0).toFixed(2)}
                  </p>
                </div>
              )}
              <button onClick={() => navigate(`/guide/${guide.id}`)}
                className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
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
