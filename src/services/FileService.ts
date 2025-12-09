import { App, TFile, TFolder, Notice } from 'obsidian';
import {
  IFileService,
  SlideBlueprint,
  ImageGenerationResult,
  OutputConfig,
  OutputFormat,
  GeneratedOutput,
  ThemeType,
  ResolutionType,
} from '../types';
import { TemplateRenderer } from '../templates';

/**
 * File Service
 * HTML/PDF/PPTX 형식으로 슬라이드 생성 및 저장
 */
export class FileService implements IFileService {
  constructor(private app: App) {}

  /**
   * 슬라이드 저장 (HTML 우선, PDF/PPTX는 향후 확장)
   */
  async saveSlides(
    blueprints: SlideBlueprint[],
    images: ImageGenerationResult[],
    config: OutputConfig
  ): Promise<GeneratedOutput[]> {
    const outputs: GeneratedOutput[] = [];

    try {
      // HTML 형식은 항상 생성
      if (config.format === 'html' || config.format === 'pdf' || config.format === 'pptx') {
        const htmlOutput = await this.generateHTML(blueprints, images, config);
        outputs.push(htmlOutput);

        // PDF/PPTX는 HTML 기반으로 향후 변환 가능
        if (config.format === 'pdf') {
          new Notice('PDF 변환 기능은 곧 추가될 예정입니다. HTML 파일을 브라우저에서 인쇄하여 PDF로 저장할 수 있습니다.');
        } else if (config.format === 'pptx') {
          new Notice('PPTX 변환 기능은 곧 추가될 예정입니다. 현재는 HTML 형식으로 제공됩니다.');
        }
      }

      // Markdown 형식 생성
      if (config.format === 'markdown') {
        const mdOutput = await this.generateMarkdown(blueprints, images, config);
        outputs.push(mdOutput);
      }

      // 생성 후 파일 열기 옵션
      if (config.openAfterGeneration && outputs.length > 0) {
        await this.openFile(outputs[0].filePath);
      }

      new Notice(`슬라이드 생성 완료: ${config.fileName}`);
      return outputs;
    } catch (error) {
      console.error('슬라이드 저장 중 오류:', error);
      new Notice('슬라이드 저장 실패. 콘솔을 확인하세요.');
      throw error;
    }
  }

  /**
   * HTML 형식 생성
   */
  private async generateHTML(
    blueprints: SlideBlueprint[],
    images: ImageGenerationResult[],
    config: OutputConfig
  ): Promise<GeneratedOutput> {
    // 테마는 blueprints[0]에서 가져오기 (모든 슬라이드가 같은 테마 사용)
    const theme: ThemeType = 'minimalist'; // 기본값, 실제로는 config에서 전달받아야 함
    const resolution: ResolutionType = '4K'; // 기본값 (1920x1080)

    // TemplateRenderer로 HTML 생성
    const renderer = new TemplateRenderer(theme, resolution);

    // 제목과 작성자 정보 추출 (첫 슬라이드 또는 메타데이터에서)
    const title = config.fileName.replace(/\.(html|pdf|pptx)$/, '');
    const author = undefined; // 향후 확장: 사용자 설정에서 가져오기

    // 이미지 데이터를 슬라이드에 매핑
    const blueprintsWithImages = this.embedImagesInBlueprints(blueprints, images);

    // HTML 렌더링
    const htmlContent = renderer.renderPresentation(blueprintsWithImages, title, author);

    // 파일 저장 경로 결정
    const folderPath = 'slides'; // 기본 저장 폴더
    await this.ensureFolderExists(folderPath);

    const fileName = config.fileName.endsWith('.html')
      ? config.fileName
      : `${config.fileName}.html`;
    const filePath = `${folderPath}/${fileName}`;

    // 파일 저장
    const existingFile = this.app.vault.getAbstractFileByPath(filePath);
    if (existingFile instanceof TFile) {
      // 기존 파일 덮어쓰기
      await this.app.vault.modify(existingFile, htmlContent);
    } else {
      // 새 파일 생성
      await this.app.vault.create(filePath, htmlContent);
    }

    // 파일 크기 계산
    const file = this.app.vault.getAbstractFileByPath(filePath) as TFile;
    const size = file.stat.size;

    return {
      format: 'html',
      filePath,
      fileName,
      size,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Markdown 형식 생성 (슬라이드 구조를 마크다운으로 변환)
   */
  private async generateMarkdown(
    blueprints: SlideBlueprint[],
    images: ImageGenerationResult[],
    config: OutputConfig
  ): Promise<GeneratedOutput> {
    let markdown = `# ${config.fileName.replace(/\.md$/, '')}\n\n`;

    blueprints.forEach((blueprint, index) => {
      markdown += `## Slide ${blueprint.slideNumber}: ${blueprint.title}\n\n`;

      // 텍스트 콘텐츠
      if (blueprint.content.text.length > 0) {
        blueprint.content.text.forEach((text) => {
          markdown += `- ${text}\n`;
        });
        markdown += '\n';
      }

      // 이미지
      const slideImage = images.find((img) => img.slideNumber === blueprint.slideNumber);
      if (slideImage) {
        markdown += `![Generated Image](data:${slideImage.mimeType};base64,${slideImage.imageData})\n\n`;
      }

      // 테이블
      if (blueprint.content.tables && blueprint.content.tables.length > 0) {
        blueprint.content.tables.forEach((table) => {
          // 헤더
          markdown += `| ${table.headers.join(' | ')} |\n`;
          markdown += `| ${table.headers.map(() => '---').join(' | ')} |\n`;
          // 행
          table.rows.forEach((row) => {
            markdown += `| ${row.join(' | ')} |\n`;
          });
          markdown += '\n';
        });
      }

      // 코드 블록
      if (blueprint.content.code && blueprint.content.code.length > 0) {
        blueprint.content.code.forEach((codeBlock) => {
          markdown += `\`\`\`${codeBlock.language}\n${codeBlock.code}\n\`\`\`\n\n`;
        });
      }

      // 스피커 노트
      if (blueprint.notes) {
        markdown += `> **Speaker Notes:** ${blueprint.notes}\n\n`;
      }

      markdown += '---\n\n';
    });

    // 파일 저장
    const folderPath = 'slides';
    await this.ensureFolderExists(folderPath);

    const fileName = config.fileName.endsWith('.md')
      ? config.fileName
      : `${config.fileName}.md`;
    const filePath = `${folderPath}/${fileName}`;

    const existingFile = this.app.vault.getAbstractFileByPath(filePath);
    if (existingFile instanceof TFile) {
      await this.app.vault.modify(existingFile, markdown);
    } else {
      await this.app.vault.create(filePath, markdown);
    }

    const file = this.app.vault.getAbstractFileByPath(filePath) as TFile;
    const size = file.stat.size;

    return {
      format: 'markdown',
      filePath,
      fileName,
      size,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * 이미지를 슬라이드 blueprint에 임베드
   */
  private embedImagesInBlueprints(
    blueprints: SlideBlueprint[],
    images: ImageGenerationResult[]
  ): SlideBlueprint[] {
    return blueprints.map((blueprint) => {
      const slideImage = images.find((img) => img.slideNumber === blueprint.slideNumber);

      if (slideImage && blueprint.content.images) {
        // 이미지 데이터를 base64 data URI로 변환하여 추가
        const imageRef = {
          src: `data:${slideImage.mimeType};base64,${slideImage.imageData}`,
          alt: `Generated image for slide ${blueprint.slideNumber}`,
          caption: blueprint.imagePrompt || 'AI-generated image',
        };

        // 기존 images 배열에 추가
        return {
          ...blueprint,
          content: {
            ...blueprint.content,
            images: [...(blueprint.content.images || []), imageRef],
          },
        };
      }

      return blueprint;
    });
  }

  /**
   * 원본 노트에 생성된 슬라이드 링크 삽입
   */
  async embedInNote(file: TFile, outputs: GeneratedOutput[]): Promise<void> {
    try {
      const content = await this.app.vault.read(file);

      // 링크 섹션 생성
      let embedSection = '\n\n---\n\n## 생성된 슬라이드\n\n';

      outputs.forEach((output) => {
        const link = `[[${output.filePath}|${output.fileName}]]`;
        const formatEmoji = this.getFormatEmoji(output.format);
        const sizeKB = (output.size / 1024).toFixed(2);

        embedSection += `- ${formatEmoji} ${link} (${sizeKB} KB) - ${new Date(output.createdAt).toLocaleString('ko-KR')}\n`;
      });

      // 기존 섹션이 있으면 교체, 없으면 추가
      const sectionRegex = /\n\n---\n\n## 생성된 슬라이드\n\n[\s\S]*$/;
      const newContent = sectionRegex.test(content)
        ? content.replace(sectionRegex, embedSection)
        : content + embedSection;

      await this.app.vault.modify(file, newContent);
      new Notice('원본 노트에 슬라이드 링크가 추가되었습니다.');
    } catch (error) {
      console.error('노트 임베드 중 오류:', error);
      new Notice('노트 임베드 실패. 콘솔을 확인하세요.');
      throw error;
    }
  }

  /**
   * 원본 파일 백업
   */
  async createBackup(file: TFile): Promise<string> {
    try {
      const content = await this.app.vault.read(file);
      const backupFolder = 'slides/backups';
      await this.ensureFolderExists(backupFolder);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `${file.basename}_backup_${timestamp}.md`;
      const backupPath = `${backupFolder}/${backupFileName}`;

      await this.app.vault.create(backupPath, content);
      new Notice(`백업 생성됨: ${backupFileName}`);

      return backupPath;
    } catch (error) {
      console.error('백업 생성 중 오류:', error);
      new Notice('백업 생성 실패. 콘솔을 확인하세요.');
      throw error;
    }
  }

  /**
   * 폴더 존재 확인 및 생성
   */
  private async ensureFolderExists(folderPath: string): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);

    if (!folder) {
      await this.app.vault.createFolder(folderPath);
    }
  }

  /**
   * 파일 열기
   */
  private async openFile(filePath: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(filePath);

    if (file instanceof TFile) {
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(file);
    }
  }

  /**
   * 파일 형식별 이모지 반환
   */
  private getFormatEmoji(format: OutputFormat): string {
    const emojiMap: Record<OutputFormat, string> = {
      html: '🌐',
      pdf: '📄',
      pptx: '📊',
      markdown: '📝',
    };
    return emojiMap[format];
  }
}
