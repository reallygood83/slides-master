import {
  SlideBlueprint,
  ThemeType,
  ResolutionType,
  TableData,
  CodeBlock,
  ImageReference
} from '../types';
import { ThemeConfig, getThemeConfig, generateShadow } from './themeConfigs';

/**
 * Template Renderer
 * Converts SlideBlueprint array into styled HTML presentation
 */
export class TemplateRenderer {
  private theme: ThemeConfig;
  private resolution: ResolutionType;

  constructor(theme: ThemeType, resolution: ResolutionType) {
    this.theme = getThemeConfig(theme);
    this.resolution = resolution;
  }

  /**
   * Generate complete HTML presentation
   */
  public renderPresentation(
    blueprints: SlideBlueprint[],
    title: string,
    author?: string
  ): string {
    const slides = blueprints.map((bp) => this.renderSlide(bp)).join('\n');

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <style>${this.generateCSS()}</style>
</head>
<body>
  <div class="presentation">
    ${this.renderTitleSlide(title, author)}
    ${slides}
  </div>
  <div class="controls">
    <button id="prev" class="control-btn">◀</button>
    <span id="slide-number" class="slide-number">1 / ${blueprints.length + 1}</span>
    <button id="next" class="control-btn">▶</button>
  </div>
  <script>${this.generateJavaScript(blueprints.length + 1)}</script>
</body>
</html>
    `.trim();
  }

  /**
   * Render title slide
   */
  private renderTitleSlide(title: string, author?: string): string {
    return `
<section class="slide title-slide">
  <div class="title-content">
    <h1 class="presentation-title">${this.escapeHtml(title)}</h1>
    ${author ? `<p class="author">${this.escapeHtml(author)}</p>` : ''}
    <p class="theme-badge">${this.theme.emoji} ${this.theme.displayName} Theme</p>
  </div>
</section>
    `.trim();
  }

  /**
   * Render individual slide
   */
  private renderSlide(blueprint: SlideBlueprint): string {
    const layoutClass = `layout-${blueprint.layout}`;
    const contentHtml = this.renderContent(blueprint);

    return `
<section class="slide ${layoutClass}">
  <h2 class="slide-title">${this.escapeHtml(blueprint.title)}</h2>
  <div class="slide-content">
    ${contentHtml}
  </div>
  ${blueprint.notes ? `<div class="speaker-notes">${this.escapeHtml(blueprint.notes)}</div>` : ''}
</section>
    `.trim();
  }

  /**
   * Render slide content based on layout type
   */
  private renderContent(blueprint: SlideBlueprint): string {
    const { layout, content } = blueprint;

    switch (layout) {
      case 'title':
        return this.renderTitleLayout(content);
      case 'content':
        return this.renderContentLayout(content);
      case 'two-column':
        return this.renderTwoColumnLayout(content);
      case 'image-focus':
        return this.renderImageFocusLayout(content);
      case 'quote':
        return this.renderQuoteLayout(content);
      case 'comparison':
        return this.renderComparisonLayout(content);
      default:
        return this.renderContentLayout(content);
    }
  }

  /**
   * Title layout
   */
  private renderTitleLayout(content: SlideBlueprint['content']): string {
    return `
<div class="title-layout">
  ${content.text.map((t) => `<p class="title-text">${this.escapeHtml(t)}</p>`).join('')}
</div>
    `.trim();
  }

  /**
   * Content layout (bullets, tables, code)
   */
  private renderContentLayout(content: SlideBlueprint['content']): string {
    let html = '';

    // Text content as bullet points
    if (content.text.length > 0) {
      html += '<ul class="content-list">';
      content.text.forEach((text) => {
        html += `<li>${this.escapeHtml(text)}</li>`;
      });
      html += '</ul>';
    }

    // Tables
    if (content.tables && content.tables.length > 0) {
      content.tables.forEach((table) => {
        html += this.renderTable(table);
      });
    }

    // Code blocks
    if (content.code && content.code.length > 0) {
      content.code.forEach((codeBlock) => {
        html += this.renderCodeBlock(codeBlock);
      });
    }

    // Images
    if (content.images && content.images.length > 0) {
      content.images.forEach((img) => {
        html += this.renderImage(img);
      });
    }

    return html;
  }

  /**
   * Two-column layout
   */
  private renderTwoColumnLayout(content: SlideBlueprint['content']): string {
    const half = Math.ceil(content.text.length / 2);
    const leftItems = content.text.slice(0, half);
    const rightItems = content.text.slice(half);

    return `
<div class="two-column-layout">
  <div class="column left-column">
    <ul class="content-list">
      ${leftItems.map((t) => `<li>${this.escapeHtml(t)}</li>`).join('')}
    </ul>
  </div>
  <div class="column right-column">
    <ul class="content-list">
      ${rightItems.map((t) => `<li>${this.escapeHtml(t)}</li>`).join('')}
    </ul>
  </div>
</div>
    `.trim();
  }

  /**
   * Image focus layout
   */
  private renderImageFocusLayout(content: SlideBlueprint['content']): string {
    const image = content.images && content.images[0];
    return `
<div class="image-focus-layout">
  ${image ? this.renderImage(image, true) : '<div class="image-placeholder">Image will be generated here</div>'}
  ${content.text.length > 0 ? `<p class="image-caption">${this.escapeHtml(content.text[0])}</p>` : ''}
</div>
    `.trim();
  }

  /**
   * Quote layout
   */
  private renderQuoteLayout(content: SlideBlueprint['content']): string {
    const quote = content.text[0] || '';
    const attribution = content.text[1] || '';

    return `
<div class="quote-layout">
  <blockquote class="quote-text">"${this.escapeHtml(quote)}"</blockquote>
  ${attribution ? `<p class="quote-attribution">— ${this.escapeHtml(attribution)}</p>` : ''}
</div>
    `.trim();
  }

  /**
   * Comparison layout
   */
  private renderComparisonLayout(content: SlideBlueprint['content']): string {
    const half = Math.ceil(content.text.length / 2);
    const leftItems = content.text.slice(0, half);
    const rightItems = content.text.slice(half);

    return `
<div class="comparison-layout">
  <div class="comparison-side left-side">
    <h3>Option A</h3>
    <ul class="content-list">
      ${leftItems.map((t) => `<li>${this.escapeHtml(t)}</li>`).join('')}
    </ul>
  </div>
  <div class="comparison-divider">VS</div>
  <div class="comparison-side right-side">
    <h3>Option B</h3>
    <ul class="content-list">
      ${rightItems.map((t) => `<li>${this.escapeHtml(t)}</li>`).join('')}
    </ul>
  </div>
</div>
    `.trim();
  }

  /**
   * Render table
   */
  private renderTable(table: TableData): string {
    return `
<table class="data-table">
  ${table.caption ? `<caption>${this.escapeHtml(table.caption)}</caption>` : ''}
  <thead>
    <tr>
      ${table.headers.map((h) => `<th>${this.escapeHtml(h)}</th>`).join('')}
    </tr>
  </thead>
  <tbody>
    ${table.rows.map((row) => `
      <tr>
        ${row.map((cell) => `<td>${this.escapeHtml(cell)}</td>`).join('')}
      </tr>
    `).join('')}
  </tbody>
</table>
    `.trim();
  }

  /**
   * Render code block
   */
  private renderCodeBlock(codeBlock: CodeBlock): string {
    return `
<div class="code-block">
  ${codeBlock.caption ? `<p class="code-caption">${this.escapeHtml(codeBlock.caption)}</p>` : ''}
  <pre><code class="language-${codeBlock.language}">${this.escapeHtml(codeBlock.code)}</code></pre>
</div>
    `.trim();
  }

  /**
   * Render image
   */
  private renderImage(image: ImageReference, large = false): string {
    return `
<figure class="slide-image ${large ? 'large-image' : ''}">
  <img src="${this.escapeHtml(image.src)}" alt="${this.escapeHtml(image.alt)}" />
  ${image.caption ? `<figcaption>${this.escapeHtml(image.caption)}</figcaption>` : ''}
</figure>
    `.trim();
  }

  /**
   * Generate complete CSS
   */
  private generateCSS(): string {
    const { colors, fonts, layout } = this.theme;
    const shadow = generateShadow(layout.shadowIntensity);

    return `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: ${fonts.body};
  color: ${colors.text};
  background-color: ${colors.background};
  overflow: hidden;
}

.presentation {
  width: 100vw;
  height: 100vh;
  position: relative;
}

.slide {
  width: 100%;
  height: 100%;
  display: none;
  flex-direction: column;
  justify-content: flex-start;
  padding: ${layout.padding};
  background-color: ${colors.background};
  border: 1px solid ${colors.border};
}

.slide.active {
  display: flex;
}

/* Title Slide */
.title-slide {
  justify-content: center;
  align-items: center;
  text-align: center;
  background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
  color: white;
}

.title-content {
  max-width: 800px;
}

.presentation-title {
  font-family: ${fonts.heading};
  font-size: 3.5em;
  margin-bottom: 0.5em;
  font-weight: 700;
}

.author {
  font-size: 1.5em;
  margin-bottom: 1em;
  opacity: 0.9;
}

.theme-badge {
  font-size: 1.2em;
  opacity: 0.8;
  margin-top: 2em;
}

/* Slide Title */
.slide-title {
  font-family: ${fonts.heading};
  font-size: 2.5em;
  color: ${colors.primary};
  margin-bottom: 0.5em;
  border-bottom: 3px solid ${colors.accent};
  padding-bottom: 0.3em;
}

/* Slide Content */
.slide-content {
  flex: 1;
  overflow-y: auto;
  font-size: 1.2em;
  line-height: 1.6;
}

.content-list {
  list-style-type: disc;
  margin-left: 1.5em;
}

.content-list li {
  margin-bottom: 0.5em;
  color: ${colors.text};
}

/* Two Column Layout */
.two-column-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2em;
}

.column {
  padding: 1em;
  background-color: ${colors.background};
  border-radius: ${layout.borderRadius};
  box-shadow: ${shadow};
}

/* Image Focus Layout */
.image-focus-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.slide-image {
  max-width: 80%;
  margin: 1em 0;
}

.slide-image img {
  width: 100%;
  height: auto;
  border-radius: ${layout.borderRadius};
  box-shadow: ${shadow};
}

.slide-image figcaption {
  text-align: center;
  font-size: 0.9em;
  color: ${colors.textSecondary};
  margin-top: 0.5em;
}

.image-placeholder {
  width: 600px;
  height: 400px;
  background-color: ${colors.codeBackground};
  border: 2px dashed ${colors.border};
  border-radius: ${layout.borderRadius};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${colors.textSecondary};
  font-size: 1.5em;
}

/* Quote Layout */
.quote-layout {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.quote-text {
  font-family: ${fonts.heading};
  font-size: 2em;
  font-style: italic;
  color: ${colors.primary};
  text-align: center;
  margin: 0 2em;
}

.quote-attribution {
  font-size: 1.3em;
  color: ${colors.textSecondary};
  margin-top: 1em;
  font-style: italic;
}

/* Comparison Layout */
.comparison-layout {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 2em;
  align-items: center;
}

.comparison-side {
  padding: 1.5em;
  background-color: ${colors.background};
  border-radius: ${layout.borderRadius};
  box-shadow: ${shadow};
  border: 2px solid ${colors.border};
}

.comparison-side h3 {
  color: ${colors.primary};
  margin-bottom: 1em;
  text-align: center;
}

.comparison-divider {
  font-size: 2em;
  font-weight: bold;
  color: ${colors.accent};
}

/* Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 1em;
}

.data-table caption {
  font-weight: bold;
  margin-bottom: 0.5em;
  color: ${colors.primary};
}

.data-table th,
.data-table td {
  border: 1px solid ${colors.tableBorder};
  padding: 0.75em;
  text-align: left;
}

.data-table th {
  background-color: ${colors.primary};
  color: white;
  font-weight: 600;
}

.data-table tr:nth-child(even) {
  background-color: ${colors.codeBackground};
}

/* Code Block */
.code-block {
  margin: 1em 0;
}

.code-caption {
  font-weight: bold;
  margin-bottom: 0.5em;
  color: ${colors.primary};
}

.code-block pre {
  background-color: ${colors.codeBackground};
  border: 1px solid ${colors.border};
  border-radius: ${layout.borderRadius};
  padding: 1em;
  overflow-x: auto;
}

.code-block code {
  font-family: ${fonts.code};
  font-size: 0.9em;
  line-height: 1.5;
}

/* Speaker Notes (hidden by default) */
.speaker-notes {
  display: none;
  position: fixed;
  bottom: 60px;
  left: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 1em;
  border-radius: 8px;
  font-size: 0.9em;
  max-height: 150px;
  overflow-y: auto;
}

/* Controls */
.controls {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 1em;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 0.75em 1.5em;
  border-radius: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.control-btn {
  background-color: ${colors.primary};
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.2em;
  cursor: pointer;
  transition: background-color 0.3s;
}

.control-btn:hover {
  background-color: ${colors.secondary};
}

.control-btn:active {
  transform: scale(0.95);
}

.slide-number {
  color: white;
  font-size: 1em;
  font-weight: 600;
  min-width: 80px;
  text-align: center;
}
    `.trim();
  }

  /**
   * Generate JavaScript for navigation
   */
  private generateJavaScript(totalSlides: number): string {
    return `
let currentSlide = 1;
const totalSlides = ${totalSlides};

function showSlide(n) {
  const slides = document.querySelectorAll('.slide');
  if (n > totalSlides) currentSlide = 1;
  if (n < 1) currentSlide = totalSlides;

  slides.forEach(slide => slide.classList.remove('active'));
  slides[currentSlide - 1].classList.add('active');

  document.getElementById('slide-number').textContent = currentSlide + ' / ' + totalSlides;
}

function nextSlide() {
  currentSlide++;
  showSlide(currentSlide);
}

function prevSlide() {
  currentSlide--;
  showSlide(currentSlide);
}

// Event listeners
document.getElementById('next').addEventListener('click', nextSlide);
document.getElementById('prev').addEventListener('click', prevSlide);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault();
    nextSlide();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    prevSlide();
  } else if (e.key === 'n') {
    // Toggle speaker notes
    document.querySelectorAll('.speaker-notes').forEach(notes => {
      notes.style.display = notes.style.display === 'block' ? 'none' : 'block';
    });
  }
});

// Initialize
showSlide(currentSlide);
    `.trim();
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
