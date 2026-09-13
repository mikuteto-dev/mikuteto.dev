import {
  siAndroid,
  siAstro,
  siBun,
  siC,
  siCplusplus,
  siDeno,
  siDiscord,
  siGnubash,
  siJavascript,
  siNodedotjs,
  siOpenjdk,
  siReact,
  siRust,
  siTailwindcss,
  siTypescript,
  siWebgl,
} from "simple-icons";
import featured from "./featured.json";
import generated from "./repos.generated.json";

export const site = {
  handle: "mikuteto.dev",
  domain: "mikuteto.dev",
} as const;

export type Work = {
  name: string;
  /** 言語 / スタック。行右に小さく出る。 */
  stack: string;
  /** 行左のマーク。Simple Icons から。無くても可。 */
  icon?: SkillIcon;
  href: string;
  /**
   * 最終更新を YYYY.MM で。年だけだと全件同じ値になって
   * 何も区別できないので月まで入れている。
   */
  updated?: string;
};

/**
 * 掲載するリポジトリは src/data/featured.json で選ぶ。
 * 言語・日付・URL は scripts/fetch-repos.mjs がビルド時に
 * GitHub から取ってくるので、ここには一切手で書かない。
 */

/** 言語名からマークを引く。未登録の言語はマーク無しで出る。 */
const LANGUAGE_MARKS: Record<string, SkillIcon> = {
  TypeScript: siTypescript,
  JavaScript: siJavascript,
  C: siC,
  "C++": siCplusplus,
  Rust: siRust,
  Java: { ...siOpenjdk, title: "Java" },
  Shell: { ...siGnubash, title: "Bash" },
};

export const works: Work[] = featured
  .flatMap((name) => {
    const repo = generated.repos[name as keyof typeof generated.repos];
    if (!repo) return [];
    return [
      {
        name,
        stack: repo.language ?? "",
        icon: repo.language ? LANGUAGE_MARKS[repo.language] : undefined,
        href: repo.url,
        updated: repo.updated,
      },
    ];
  })
  .sort((a, b) => (b.updated ?? "").localeCompare(a.updated ?? ""));

// ── スキル ────────────────────────────────────────────────────

// アイコンは Simple Icons (CC0) の実物。追加したいときは上の import に
// `siFoo` を足して、下の items に並べるだけ。名前と色はアイコン自身が
// 持っているので、こちらで書く必要はない。
//
// 注意: `siShell` は石油会社の Shell。シェル芸の意味なら siGnubash。
// Java の商標マークは Simple Icons に無いため OpenJDK が代替になる。

type SkillIcon = {
  /** 表示名。読み上げとホバー時のラベルに使う。 */
  title: string;
  /** 24x24 の path データ。 */
  path: string;
  /** ブランド色。ホバー時だけ出る。 */
  hex: string;
};

export type SkillGroup = {
  label: string;
  items: SkillIcon[];
};

export const skills: SkillGroup[] = [
  {
    label: "Language",
    items: [
      siTypescript,
      siJavascript,
      siC,
      siCplusplus,
      siRust,
      // Simple Icons has no Java mark (trademark) and its "Shell" is the oil
      // company, so the accurate marks carry the names people actually use.
      { ...siOpenjdk, title: "Java" },
      { ...siGnubash, title: "Bash" },
    ],
  },
  { label: "Runtime", items: [siNodedotjs, siBun, siDeno] },
  { label: "Frontend", items: [siReact, siAstro, siTailwindcss, siWebgl] },
  { label: "Platform", items: [siAndroid, siDiscord] },
];

// ── 連絡先 ────────────────────────────────────────────────────

export const links = {
  github: "https://github.com/mikumiku-jp",
  twitter: "https://twitter.com/mikuteto_dev",
  discord: "mikuteto.dev",
} as const;

type AnswerBlock = "works" | "skills" | "contact" | "topics" | null;

export type Answer = {
  /** 本文。空配列なら一切喋らずブロックだけ出る。 */
  lines: string[];
  block: AnswerBlock;
  /** 回答前に出す処理ログ。空なら出ない。 */
  tools?: string[];
};

export type Topic = {
  id: string;
  /** サジェストの文言。押すとそのまま送信される。 */
  label: string;
  /** 自由入力をこの topic に寄せるためのキーワード。 */
  match: string[];
  answer: Answer;
};

const ALL_TOPICS: Topic[] = [
  {
    id: "works",
    label: "Works",
    match: [
      "work",
      "works",
      "project",
      "projects",
      "github",
      "repo",
      "repos",
      "repository",
      "repositories",
      "build",
      "made",
      "作品",
    ],
    answer: {
      tools: ["search_repositories", "sort_by_updated"],
      lines: [],
      block: "works",
    },
  },
  {
    id: "skills",
    label: "Skills",
    match: [
      "skill",
      "skills",
      "stack",
      "stacks",
      "tech",
      "technology",
      "technologies",
      "language",
      "languages",
      "know",
      "use",
      "技術",
    ],
    answer: {
      tools: ["read_skill_index"],
      lines: [],
      block: "skills",
    },
  },
  {
    id: "contact",
    label: "Contact",
    match: [
      "contact",
      "contacts",
      "dm",
      "discord",
      "twitter",
      "mail",
      "email",
      "reach",
      "連絡",
    ],
    answer: {
      lines: [],
      block: "contact",
    },
  },
];

export const topics: Topic[] = ALL_TOPICS;

/**
 * Unmatched input answers with the range it can actually cover, in a form you
 * press. Nothing to read, nothing to apologise for.
 */
export const fallback: Answer = {
  lines: [],
  block: "topics",
};
