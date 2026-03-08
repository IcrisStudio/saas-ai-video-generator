import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Zap, ArrowRight } from "lucide-react";

const templates = [
  {
    id: "product-photo",
    name: "Product Photo Shot",
    description:
      "Upload a product image, choose whether to include a model, add optional ideas — we craft the prompt and generate a pro product shot.",
    before:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60",
    after:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop&q=60",
    cost: 5,
    tag: "Easy",
    category: "Product"
  },
  {
    id: "gta-v",
    name: "GTA V Portrait",
    description:
      "Turn any portrait into iconic Rockstar-style character artwork with bold outlines and cinematic lighting.",
    before:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=60",
    after:
      "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&auto=format&fit=crop&q=60",
    cost: 5,
    tag: "Trending",
    category: "AI Stylization"
  },
  {
    id: "anime-pulse",
    name: "Anime Pulse",
    description:
      "Convert any clip into a high-energy anime style sequence with vibrant motion and color.",
    before:
      "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=800&auto=format&fit=crop&q=60",
    after:
      "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=800&auto=format&fit=crop&q=60",
    cost: 10,
    tag: "Popular",
    category: "Video"
  },
  {
    id: "cyberpunk-me",
    name: "Cyberpunk 2077",
    description:
      "Transform portraits into futuristic neon cyberpunk characters inspired by Night City.",
    before:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&auto=format&fit=crop&q=60",
    after:
      "https://images.unsplash.com/photo-1605142859862-978be7eba909?w=800&auto=format&fit=crop&q=60",
    cost: 5,
    category: "AI Stylization"
  }
];

export function Templates() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <Sparkles size={22} />
        </div>

        <div>
          <h1 className="text-4xl font-semibold text-white">
            AI Templates
          </h1>

          <p className="text-zinc-400 text-sm">
            One-click AI transformations powered by our models.
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            onClick={() =>
              (template.id === "gta-v" || template.id === "product-photo") &&
              navigate(`/templates/${template.id}`)
            }
            className="group cursor-pointer rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur hover:border-zinc-600 transition overflow-hidden"
          >

            {/* Before After Preview */}
            <div className="relative aspect-[4/3] overflow-hidden">

              <div className="grid grid-cols-2 h-full">

                <img
                  src={template.before}
                  className="object-cover w-full h-full group-hover:scale-105 transition duration-500"
                />

                <img
                  src={template.after}
                  className="object-cover w-full h-full group-hover:scale-105 transition duration-500"
                />

              </div>

              {/* Divider */}
              <div className="absolute inset-y-0 left-1/2 w-[2px] bg-white/20" />

              {/* Labels */}
              <div className="absolute top-3 left-3 text-[10px] px-2 py-1 bg-black/70 rounded text-white">
                Input
              </div>

              <div className="absolute top-3 right-3 text-[10px] px-2 py-1 bg-emerald-500 rounded text-white">
                AI Result
              </div>

              {/* Tag */}
              {template.tag && (
                <div className="absolute bottom-3 left-3 text-[10px] px-3 py-1 rounded-full bg-emerald-500 text-white">
                  {template.tag}
                </div>
              )}

              {/* Credits */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] px-3 py-1 bg-black/70 rounded text-amber-400">
                <Zap size={10} />
                {template.cost}
              </div>

              {/* Hover CTA */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-lg">
                  <ArrowRight size={20} />
                </div>
              </div>

            </div>

            {/* Info */}
            <div className="p-5 space-y-2">

              <span className="text-xs text-emerald-400 font-medium">
                {template.category}
              </span>

              <h3 className="text-xl font-semibold text-white group-hover:text-emerald-400 transition">
                {template.name}
              </h3>

              <p className="text-sm text-zinc-400 leading-relaxed">
                {template.description}
              </p>

            </div>

          </motion.div>
        ))}
      </div>
    </div>
  );
}