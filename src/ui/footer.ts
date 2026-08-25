import { qsOptional, createEl } from "../utils/dom";

const YEAR = new Date().getFullYear();

/**
 * Mounted on every page (app + legal pages) so Impressum/Datenschutz are
 * always one click away, per German Telemedienstaatsvertrag requirements.
 */
export function mountFooter(root: ParentNode = document): void {
  const target = qsOptional("#site-footer", root);
  if (!target) return;

  target.append(
    createEl("span", { class: "site-footer__brand" }, ["Card Creator"]),
    createEl("nav", { "aria-label": "Rechtliches" }, [
      createEl("ul", { class: "site-footer__links" }, [
        createEl("li", {}, [createEl("a", { href: withBase("impressum.html") }, ["Impressum"])]),
        createEl("li", {}, [createEl("a", { href: withBase("datenschutz.html") }, ["Datenschutz"])]),
        createEl(
          "li",
          {},
          [
            createEl(
              "a",
              { href: "https://github.com/HansTydecks/card-creator", target: "_blank", rel: "noopener noreferrer" },
              ["GitHub"],
            ),
          ],
        ),
      ]),
    ]),
    createEl("span", {}, [`© ${YEAR} Hans Tydecks`]),
  );
}

function withBase(path: string): string {
  return import.meta.env.BASE_URL + path;
}
