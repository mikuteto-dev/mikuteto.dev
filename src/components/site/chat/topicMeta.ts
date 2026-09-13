import { links, skills, works } from "../../../data/site";

/**
 * Shared by the picker and the fallback list so the two can never quote
 * different numbers for the same topic. Derived from the arrays the answers
 * actually render, so a count cannot outlive the data behind it.
 */
export function topicMeta(id: string): string {
  switch (id) {
    case "works":
      return `${works.length} repositories`;
    case "skills": {
      const total = skills.reduce((n, group) => n + group.items.length, 0);
      return `${total} tools · ${skills.length} groups`;
    }
    case "contact":
      return [
        links.github && "GitHub",
        links.twitter && "Twitter",
        links.discord && "Discord",
      ]
        .filter(Boolean)
        .join(" · ");
    default:
      return "";
  }
}
