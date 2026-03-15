export const landingPageTitle = "The Zero-Dependency Documentation Engine";

export const landingPageHtmlContent = `
<p>Welcome to the live demo. What you are reading right now is not a standard React web page. It is a single, self-contained HTML file generated entirely in the browser. No databases, no proprietary reader apps, and no vendor lock-in. Whether you are handing off a complex system architecture or writing the end-user onboarding flow for a new product, your documentation should be as modern as the software it describes.</p>

<h2>1. Frictionless Authoring</h2>
<div data-type="grid" data-layout="50-50" class="grid-wrapper ratio-50-50">
  <div data-type="grid-column" class="grid-column flex-1">
    <p>Writing documentation shouldn't require fighting with layout software. This entire guide was built using a block-based, local-first editor. We stripped away the harsh borders and clunky toolbars, giving you a clean, centered typography stack that automatically optimizes for reading comprehension.</p>
  </div>
  <div data-type="grid-column" class="grid-column flex-1">
    <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Editor demonstration" />
  </div>
</div>

<h2>2. Intelligent Asset Management</h2>
<div data-type="info" class="callout callout-info">
  <p>💡 <strong>The Base64 Bloat Problem:</strong> Standard HTML exports convert images to raw Base64 text. If you drop a 3MB screenshot into a standard editor, your exported HTML file balloons by 4MB, making it slow to load and impossible to share.</p>
</div>

<p>We fixed that. Go ahead and drag a massive high-resolution UI screenshot into the editor. The engine intercepts it, silently draws it to a hidden HTML5 canvas, and compresses it into a lightweight WebP string in milliseconds. You get crystal-clear visuals with zero file bloat.</p>

<h2>3. Built for Instructional Design</h2>
<p>Standard text is boring. When you are trying to explain a multi-step onboarding flow or walk a user through a testing checklist, you need to break up the visual rhythm.</p>

<div data-type="warning" class="callout callout-warning">
  <p>⚠️ <strong>Pro Tip:</strong> Use warning callouts to highlight destructive actions or critical API limitations before the user copies the code.</p>
</div>

<div data-type="success" class="callout callout-success">
  <p>✅ <strong>Success:</strong> You can drop these custom instructional blocks instantly using the slash menu.</p>
</div>

<pre><code class="language-javascript">// The engine automatically syntax-highlights your snippets
const exportGuide = (title, content) => {
  console.log(\`Exporting \${title} with zero dependencies.\`);
  return Compiler.generateSingleFile(content);
};</code></pre>

<h2>4. Annotated Images & Hotspots</h2>
<p>Drop any image into the editor, then click to pin numbered hotspot markers anywhere on it. Each marker shows a tooltip on hover in the exported file — no design tools required.</p>

<div class="annotated-image-container">
  <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80" alt="Analytics dashboard with annotated hotspots" />
  <div class="annotation-marker" style="left:14%;top:28%;" data-text="Sidebar navigation — click any section to jump directly to that part of the document.">1</div>
  <div class="annotation-marker" style="left:52%;top:20%;" data-text="Live chart — data updates automatically as filters change. Hover any bar for exact values.">2</div>
  <div class="annotation-marker" style="left:80%;top:42%;" data-text="Export controls — download the report as CSV, PDF, or a standalone HTML file.">3</div>
  <div class="annotation-marker" style="left:33%;top:74%;" data-text="Filter panel — narrow results by date range, region, or product category.">4</div>
</div>

<h2>5. The Single-File Magic</h2>
<p>When you are done writing, you click Export. The app bundles your text, your inline Tailwind CSS, your compressed WebP images, and the JavaScript for this Table of Contents into one lightweight .html file.</p>
<p>You can email it, drop it in a Slack channel, or host it on a basic server. It just works.</p>

<div data-type="section-divider" data-style="gradient" class="section-divider"></div>

<h2>6. Interactive Content Blocks</h2>
<p>Dense documentation loses readers. Accordion sections let you layer detail progressively — give a clear headline, and let readers decide how deep they want to go. Click the sections below to expand them.</p>

<div data-type="accordion">
  <div data-type="accordion-item" data-title="Does the exported file work completely offline?">
    <p>Yes — that is the whole point. The exported <code>.html</code> file has zero external dependencies. All Tailwind CSS, syntax highlighting, interactive JavaScript, and compressed images are inlined directly into the file. You can email it, save it to a USB drive, or open it from a corporate intranet with no internet access required.</p>
  </div>
  <div data-type="accordion-item" data-title="How does it handle large images without bloating the file size?">
    <p>Every image you drop into the editor is intercepted before it is saved. The engine draws it to a hidden HTML5 canvas, re-encodes it as WebP at 70% quality, and stores only the compressed result. A 3&nbsp;MB screenshot typically shrinks to under 300&nbsp;KB — a 10× reduction — with no visible quality loss at normal viewing sizes.</p>
  </div>
  <div data-type="accordion-item" data-title="Can I apply my own brand colors and typography?">
    <p>Yes. Every document has a Theme panel where you set a primary brand color (applied to links, active TOC items, tab indicators, and progress bars), choose between three font stacks (Modern, Editorial, and Technical/Mono), and optionally inject custom CSS for anything else. The brand color propagates through the entire exported file as a single CSS variable, so changing it updates everything at once.</p>
  </div>
  <div data-type="accordion-item" data-title="What content blocks are available?">
    <p>The editor ships with: headings, paragraphs, bullet and numbered lists, interactive task lists, blockquotes, code blocks with syntax highlighting, tables, info/warning/success callouts, annotated images, two-column grids, accordion sections, tabbed content, and section dividers. More block types are on the roadmap.</p>
  </div>
</div>

<div data-type="section-divider" data-style="dots" class="section-divider"></div>

<h2>7. Built for Every Team</h2>
<p>The same engine serves fundamentally different audiences. Select your role below to see how the workflow adapts to your specific needs.</p>

<div data-type="tab-group">
  <div data-type="tab-panel" data-label="Engineering">
    <p><strong>Ship runbooks that stay readable.</strong> Engineers paste terminal output and code snippets directly into the editor. Syntax highlighting activates automatically for JavaScript, Python, Bash, SQL, and 180+ other languages. The copy-to-clipboard button appears on every code block in the export — no extra configuration needed.</p>
    <pre><code class="language-bash"># Your snippets render with full syntax highlighting
npm run export -- --output ./dist/runbook.html</code></pre>
    <p>Version your documentation alongside your code, or export a standalone file and attach it to a Jira ticket or Notion page. Either way, the reader never needs to install anything.</p>
  </div>
  <div data-type="tab-panel" data-label="Product">
    <p><strong>Turn release notes into polished deliverables.</strong> Product teams use the annotated image block to mark up screenshots with numbered callout pins. Each pin has a tooltip that appears on hover in the exported file — perfect for highlighting new UI elements in a release document without needing a design tool.</p>
    <p>Pair that with the hero section (a full-bleed banner with your brand color and a subtitle) and you have a release announcement that looks like it came from a design team, built entirely in the browser in under ten minutes.</p>
  </div>
  <div data-type="tab-panel" data-label="Technical Writing">
    <p><strong>Structure deep content without fighting a CMS.</strong> Long-form technical guides benefit from the automatic Table of Contents (generated from H1 and H2 headings), scroll-spy activation as the reader navigates, and the reading progress bar at the top of the page. Readers always know where they are in a 10,000-word document.</p>
    <p>The accordion block is especially useful for reference material: surface the most common cases at the top level, and let advanced readers drill into edge cases only when they need them.</p>
  </div>
</div>

<div data-type="section-divider" data-style="wave" class="section-divider"></div>

<h2>8. Video Embed</h2>
<p>Drop in any YouTube, Vimeo, or direct video URL and the engine wraps it in a responsive 16:9 container — fully self-contained in the exported file.</p>

<div data-type="video-embed" data-src="https://youtu.be/dQw4w9WgXcQ?si=jKAnn_NGtFRFrHhs"></div>

<h2>9. Step-by-Step Timelines</h2>
<p>The Timeline block turns any sequential process into a clean, numbered vertical flow — perfect for onboarding guides, release checklists, or setup instructions.</p>

<div data-type="timeline">
  <div data-type="timeline-step" data-title="Write in the Block Editor">
    <p>Use the floating menu to insert any block — headings, callouts, code, tables, accordions, tabs, timelines, card grids, and video embeds. Everything lives in a clean, distraction-free canvas.</p>
  </div>
  <div data-type="timeline-step" data-title="Customize Your Theme">
    <p>Open the Theme panel to set your brand color, choose a font stack, enable a hero section, add a footer, and toggle features like the reading progress bar and dark mode support.</p>
  </div>
  <div data-type="timeline-step" data-title="Export to a Single HTML File">
    <p>Click Export. GuideEm bundles your content, compressed images, Tailwind CSS, and all interactive JavaScript into one <code>.html</code> file — no build step, no server, no external dependencies.</p>
  </div>
  <div data-type="timeline-step" data-title="Share Anywhere">
    <p>Email the file, drop it in Slack, host it on any static server, or save it to a USB drive. Readers get a fully interactive document with no apps to install.</p>
  </div>
</div>

<div data-type="section-divider" data-style="dots" class="section-divider"></div>

<h2>10. Animated Counters</h2>
<p>Numbers that count up when they scroll into view. Drop a Counter block anywhere — it works especially well inside grid columns for stat showcases.</p>

<div style="display:flex;flex-wrap:wrap;gap:1rem;margin:1.5rem 0;">
  <div data-type="counter" data-value="180" data-suffix="+" data-label="Languages Highlighted"></div>
  <div data-type="counter" data-value="0" data-suffix="KB" data-label="External Dependencies"></div>
  <div data-type="counter" data-value="100" data-suffix="%" data-label="Client-Side Export"></div>
  <div data-type="counter" data-value="10" data-suffix="x" data-label="Image Compression"></div>
</div>

<div data-type="section-divider" data-style="gradient" class="section-divider"></div>

<h2>11. Text Effects</h2>
<p>Three new inline mark types let you add visual flair to any selected text. All effects are preserved in the exported HTML — no extra setup required.</p>

<h3>Gradient Text</h3>
<p>Select any text in the editor and choose <strong>Gradient</strong> from the bubble menu to apply a smooth color transition. Pick start color, end color, and direction.</p>
<p>Works on headlines: <span data-gradient="true" data-gradient-from="#6366f1" data-gradient-to="#ec4899" data-gradient-dir="to right" style="background: linear-gradient(to right, #6366f1, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 700; font-size: 1.15em;">Zero-Dependency Documentation</span></p>
<p>Or on inline phrases — <span data-gradient="true" data-gradient-from="#0ea5e9" data-gradient-to="#10b981" data-gradient-dir="135deg" style="background: linear-gradient(135deg, #0ea5e9, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 600;">diagonal ocean-to-emerald</span> and <span data-gradient="true" data-gradient-from="#f97316" data-gradient-to="#ef4444" data-gradient-dir="to right" style="background: linear-gradient(to right, #f97316, #ef4444); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 600;">orange to red</span>.</p>

<h3>Text Badges</h3>
<p>Tag terms, statuses, or version labels inline without breaking reading flow. Five color presets available in the bubble menu.</p>
<p>
  Release status: <span data-badge-color="#16a34a" style="background-color: #16a34a; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 0.75em; font-weight: 600; text-transform: uppercase; display: inline;" class="text-badge">stable</span> &nbsp;&nbsp;
  API: <span data-badge-color="#6366f1" style="background-color: #6366f1; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 0.75em; font-weight: 600; text-transform: uppercase; display: inline;" class="text-badge">v2.4</span> &nbsp;&nbsp;
  <span data-badge-color="#d97706" style="background-color: #d97706; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 0.75em; font-weight: 600; text-transform: uppercase; display: inline;" class="text-badge">deprecated</span> <code>legacyInit()</code> &nbsp;&nbsp;
  <span data-badge-color="#dc2626" style="background-color: #dc2626; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 0.75em; font-weight: 600; text-transform: uppercase; display: inline;" class="text-badge">breaking</span>
</p>

<h3>Animated Text</h3>
<p>Three animation types activate when the text scrolls into view. All respect <code>prefers-reduced-motion</code>.</p>
<p>
  <span data-animation="shimmer" class="animated-text animated-text-shimmer" style="font-weight: 700;">Shimmer</span> — sweeps a gradient highlight continuously. &nbsp;&nbsp;
  <span data-animation="fade-in-word" class="animated-text animated-text-fade-in-word" style="font-weight: 600;">Fade-in</span> — glides into view on scroll. &nbsp;&nbsp;
  <span data-animation="typewriter" class="animated-text animated-text-typewriter" style="font-weight: 600;">Typewriter</span> — blinks a cursor at the end.
</p>

<div data-type="section-divider" data-style="dots" class="section-divider"></div>

<h2>12. What's Inside Every Export</h2>
<p>A single <code>.html</code> file that ships everything readers need — no runtime, no CDN, no dependencies.</p>

<div data-type="card-grid" data-cols="3">
  <div data-type="card" data-emoji="🚀" data-title="Zero Dependencies">
    <p>Every byte — styles, scripts, and compressed images — is inlined at export time. Open the file anywhere a browser exists.</p>
  </div>
  <div data-type="card" data-emoji="🎨" data-title="Live Theming">
    <p>Brand color, font stack, hero section, and footer all flow through a single CSS variable. Change once, update the whole document.</p>
  </div>
  <div data-type="card" data-emoji="⚡" data-title="Instant Export">
    <p>Export happens entirely in the browser in milliseconds. No upload, no queue, no server processing your content.</p>
  </div>
  <div data-type="card" data-emoji="📦" data-title="Local-First Storage">
    <p>Documents live in IndexedDB — your data never leaves your machine unless you choose to share the exported HTML.</p>
  </div>
  <div data-type="card" data-emoji="🔒" data-title="Private by Default">
    <p>No account, no analytics, no telemetry. Your documentation stays entirely on your device until you export it.</p>
  </div>
  <div data-type="card" data-emoji="🌐" data-title="Runs Anywhere">
    <p>Email it, host it on S3, open it from a network drive, or view it offline. If a browser can open it, it works.</p>
  </div>
</div>

<div data-type="section-divider" data-style="gradient" class="section-divider"></div>

<h2>13. Hero Banners</h2>
<p>Drop a full-width gradient banner anywhere in your document — perfect for chapter headers, product announcements, or calls to action. Pick any two colors and add an optional CTA button.</p>

<div data-type="hero-banner" data-gradient-from="#6366f1" data-gradient-to="#ec4899" data-title="Phase 2: Visual Blocks" data-subtitle="Hero banners, stat rows, testimonials, code diffs, and before/after sliders — all exported as a single self-contained HTML file." data-cta-text="Start Writing" data-cta-url="#"></div>

<div data-type="hero-banner" data-gradient-from="#0ea5e9" data-gradient-to="#10b981" data-title="Ship Docs That Stand Out" data-subtitle="Every block renders identically in the editor and in the exported file. What you see is exactly what your readers get."></div>

<div data-type="section-divider" data-style="dots" class="section-divider"></div>

<h2>14. Testimonial Cards</h2>
<p>Embed social proof directly in your documentation. Each card renders a quote, author name, role, and a colored avatar initial — no images needed, and no external services required.</p>

<div data-type="testimonial" data-quote="GuideEm replaced three different tools in our workflow. We now hand off design specs, onboarding flows, and release notes as single HTML files that work everywhere — no Notion, no Confluence, no Figma links that expire." data-author-name="Sarah Chen" data-author-role="Head of Product, Veritas Labs" data-avatar-color="#6366f1"></div>

<div data-type="testimonial" data-quote="The image compression alone is worth it. We went from 40 MB documentation bundles to under 4 MB. Our field teams can actually email these files now instead of sharing a Confluence link that half our clients can't access." data-author-name="Marcus Webb" data-author-role="Senior Technical Writer, Apex Systems" data-avatar-color="#10b981"></div>

<div data-type="section-divider" data-style="dots" class="section-divider"></div>

<h2>15. Animated Stat Rows</h2>
<p>Numbers that count up when they scroll into view. The Stat Row block groups multiple animated counters in a responsive flex row — great for product pages, API reference intros, or capability overviews.</p>

<div data-type="stat-row" data-stats='[{"value":"14","prefix":"","suffix":"","label":"Block Types","icon":"🧩"},{"value":"100","prefix":"","suffix":"%","label":"Client-Side Export","icon":"⚡"},{"value":"10","prefix":"","suffix":"x","label":"Image Compression","icon":"🗜️"},{"value":"0","prefix":"","suffix":"","label":"External Dependencies","icon":"📦"}]'></div>

<div data-type="section-divider" data-style="dots" class="section-divider"></div>

<h2>16. Code Diff Blocks</h2>
<p>Show exactly what changed between two versions of code — perfect for migration guides, API changelogs, and before/after refactoring examples. The diff is pre-computed at export time, so no JavaScript runs in the exported file to generate it.</p>

<div data-type="code-diff" data-language="javascript" data-code-before="// v1 API
fetch('/api/users', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
}).then(res => res.json())
  .then(data => setUsers(data))
  .catch(err => console.error(err));" data-code-after="// v2 API — async/await
const response = await fetch('/api/v2/users', {
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${token}\`,
    'Accept': 'application/json'
  }
});
const { users, total } = await response.json();
setUsers(users);"></div>

<div data-type="section-divider" data-style="dots" class="section-divider"></div>

<h2>17. Before / After Slider</h2>
<p>Let readers drag a divider to compare two images side by side — ideal for UI redesigns, photo edits, design system migrations, or any visual before/after comparison. The slider is fully interactive in the exported file.</p>

<div data-type="before-after" data-before-image="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80" data-after-image="https://images.unsplash.com/photo-1543722530-d2c3201371e7?auto=format&fit=crop&w=1200&q=80" data-slider-position="50" data-before-label="Night" data-after-label="Day"></div>
`;
