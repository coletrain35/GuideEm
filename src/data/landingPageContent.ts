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
<p>Standard text is boring. When you are trying to explain complex game mechanics for Volunteller or walk a user through a testing checklist, you need to break up the visual rhythm.</p>

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

<h2>4. The Single-File Magic</h2>
<p>When you are done writing, you click Export. The app bundles your text, your inline Tailwind CSS, your compressed WebP images, and the JavaScript for this Table of Contents into one lightweight .html file.</p>
<p>You can email it, drop it in a Slack channel, or host it on a basic server. It just works.</p>
`;
