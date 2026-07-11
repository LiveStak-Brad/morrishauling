const fs = require("fs");
const path = require("path");
const lighthouseModule = require("lighthouse");
const chromeLauncher = require("chrome-launcher");

const lighthouse =
  typeof lighthouseModule === "function"
    ? lighthouseModule
    : lighthouseModule.default || lighthouseModule.navigation;

if (typeof lighthouse !== "function") {
  console.error("Unable to resolve lighthouse runner", Object.keys(lighthouseModule));
  process.exit(1);
}

const pages = [
  { n: "home", u: "http://127.0.0.1:3456/" },
  { n: "junk-removal", u: "http://127.0.0.1:3456/junk-removal" },
  { n: "hauling", u: "http://127.0.0.1:3456/hauling" },
  { n: "junk-furniture", u: "http://127.0.0.1:3456/junk-removal/services/furniture-removal" },
  { n: "hauling-equipment", u: "http://127.0.0.1:3456/hauling/services/equipment-hauling" },
  { n: "junk-warrenton", u: "http://127.0.0.1:3456/junk-removal/areas/warrenton" },
  { n: "hauling-warren-county", u: "http://127.0.0.1:3456/hauling/areas/warren-county" },
  { n: "book", u: "http://127.0.0.1:3456/book" },
  { n: "contact", u: "http://127.0.0.1:3456/contact" },
];

const outDir = path.join(__dirname, "..", "lighthouse-reports");
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
  });
  const summary = [];
  try {
    for (const p of pages) {
      console.log("LH", p.n);
      const result = await lighthouse(p.u, {
        port: chrome.port,
        output: "json",
        logLevel: "error",
        formFactor: "mobile",
        screenEmulation: {
          mobile: true,
          width: 412,
          height: 823,
          deviceScaleFactor: 1.75,
          disabled: false,
        },
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      });
      const reportPath = path.join(outDir, `${p.n}.json`);
      const report = typeof result.report === "string" ? result.report : JSON.stringify(result.lhr);
      fs.writeFileSync(reportPath, report);
      const j = JSON.parse(report);
      const auditVal = (id) => j.audits?.[id]?.displayValue ?? "n/a";
      const row = {
        Page: p.n,
        Perf: Math.round(100 * j.categories.performance.score),
        A11y: Math.round(100 * j.categories.accessibility.score),
        BP: Math.round(100 * j.categories["best-practices"].score),
        SEO: Math.round(100 * j.categories.seo.score),
        LCP: auditVal("largest-contentful-paint"),
        INP: auditVal("interaction-to-next-paint"),
        CLS: auditVal("cumulative-layout-shift"),
      };
      summary.push(row);
      console.log(
        `${row.Page} P=${row.Perf} A=${row.A11y} BP=${row.BP} SEO=${row.SEO} LCP=${row.LCP} INP=${row.INP} CLS=${row.CLS}`
      );
    }
  } finally {
    await chrome.kill();
  }
  fs.writeFileSync(path.join(__dirname, "..", "lighthouse-summary.json"), JSON.stringify(summary, null, 2));
  console.log("done");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
