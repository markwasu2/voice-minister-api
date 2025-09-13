import { NextRequest, NextResponse } from "next/server";
import verses from "@/data/web.json";
// Tiny starter set (WEB wording or close). Replace/expand later.
const VERSES: { ref: string; text: string }[] = [
  { ref: "Psalm 23:1", text: "Yahweh is my shepherd; I shall not want." },
  { ref: "Isaiah 41:10", text: "Don’t be afraid, for I am with you... I will strengthen you; yes, I will help you." },
  { ref: "Jeremiah 29:11", text: "For I know the plans that I have for you, says Yahweh, plans for peace and not for evil..." },
  { ref: "John 3:16", text: "For God so loved the world, that he gave his one and only Son..." },
  { ref: "John 14:27", text: "Peace I leave with you. My peace I give to you... Don’t let your heart be troubled." },
  { ref: "Philippians 4:6-7", text: "In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God..." },
  { ref: "1 Peter 5:7", text: "Casting all your worries on him, because he cares for you." },
  { ref: "Romans 8:28", text: "We know that all things work together for good for those who love God..." },
  { ref: "Romans 15:13", text: "Now may the God of hope fill you with all joy and peace in believing..." },
  { ref: "Ephesians 4:32", text: "Be kind to one another, tenderhearted, forgiving each other..." },
  { ref: "1 John 1:9", text: "If we confess our sins, he is faithful and righteous to forgive us our sins..." },
  { ref: "Matthew 11:28", text: "Come to me, all you who labor and are heavily burdened, and I will give you rest." }
];

function norm(s: string) {
  return s.toLowerCase().replace(/[^\w\s:]/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ hits: [] });

  const qNorm = norm(q);

  // 1) If q looks like a reference, try exact/starts-with match
  const refHits = VERSES.filter(v => {
    const r = norm(v.ref);
    return r === qNorm || r.startsWith(qNorm);
  });

  let hits = refHits;

  // 2) Otherwise, do a simple keyword score search
  if (hits.length === 0) {
    const tokens = qNorm.split(" ").filter(Boolean);
    const scored = VERSES.map(v => {
      const hay = norm(v.ref + " " + v.text);
      let score = 0;
      for (const t of tokens) if (hay.includes(t)) score += 1;
      if (hay.includes(qNorm)) score += 2; // small phrase boost
      return { v, score };
    })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(x => x.v);

    hits = scored;
  }

  return NextResponse.json({ hits, source: "WEB" });
}
