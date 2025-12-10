/**
 * Internationalization (i18n) Utilities
 * Provides language-specific prompts and instructions for AI-generated slides
 */

export type SupportedLanguage = 'en' | 'ko';

/**
 * Get language-specific instruction for AI prompts
 */
export function getLanguageInstruction(language: SupportedLanguage): string {
  const instructions = {
    en: 'Generate all slide content in English.',
    ko: '모든 슬라이드 내용을 한국어로 생성하세요.',
  };

  return instructions[language] || instructions.en;
}

/**
 * Get language-specific prompt additions for content analysis
 */
export function getAnalysisLanguagePrompt(language: SupportedLanguage): string {
  const prompts = {
    en: `
**Language Requirement:**
- All analysis results MUST be in English
- All field names and values in JSON should be in English
- Maintain professional English terminology
`,
    ko: `
**언어 요구사항:**
- 모든 분석 결과는 반드시 한국어로 작성되어야 합니다
- JSON의 모든 필드 값은 한국어로 작성하세요
- 전문적이고 자연스러운 한국어를 사용하세요
`,
  };

  return prompts[language] || prompts.en;
}

/**
 * Get language-specific prompt additions for slide blueprint generation
 */
export function getBlueprintLanguagePrompt(language: SupportedLanguage): string {
  const prompts = {
    en: `
**Language Requirement:**
- All slide titles MUST be in English
- All slide content MUST be in English
- All speaker notes MUST be in English
- Maintain professional presentation language
`,
    ko: `
**언어 요구사항:**
- 모든 슬라이드 제목은 반드시 한국어로 작성되어야 합니다
- 모든 슬라이드 내용은 반드시 한국어로 작성되어야 합니다
- 모든 발표자 노트는 반드시 한국어로 작성되어야 합니다
- 전문적이고 자연스러운 프레젠테이션 언어를 사용하세요
`,
  };

  return prompts[language] || prompts.en;
}

/**
 * Get language-specific example structure for prompts
 */
export function getExampleStructure(language: SupportedLanguage): {
  title: string;
  subtitle: string;
  bulletPoint: string;
  notes: string;
} {
  const examples = {
    en: {
      title: 'Introduction to the Topic',
      subtitle: 'Key Concepts and Overview',
      bulletPoint: 'Main point or idea',
      notes: 'Explanation for the presenter',
    },
    ko: {
      title: '주제 소개',
      subtitle: '핵심 개념 및 개요',
      bulletPoint: '주요 논점 또는 아이디어',
      notes: '발표자를 위한 설명',
    },
  };

  return examples[language] || examples.en;
}

/**
 * Get language name for display
 */
export function getLanguageName(language: SupportedLanguage): string {
  const names = {
    en: 'English',
    ko: '한국어',
  };

  return names[language] || names.en;
}
