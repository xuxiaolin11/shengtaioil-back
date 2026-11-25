import fs from 'node:fs'
import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'

export type ParsedDocument = {
  text: string
  paragraphs: string[]
  warning?: string
}

export const splitParagraphs = (raw: string) => {
  const normalized = raw.replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ').trim()
  const byBlankLine = normalized
    .split(/\n\s*\n+/)
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line) => line.length > 0)

  const paragraphs =
    byBlankLine.length === 1 && normalized.includes('\n')
      ? normalized
          .split('\n')
          .map((line) => line.replace(/[ \t]+/g, ' ').trim())
          .filter((line) => line.length > 0)
      : byBlankLine

  return { normalized, paragraphs }
}

export const parseDocument = async (filePath: string, mimeType: string): Promise<ParsedDocument> => {
  if (mimeType === 'application/msword') {
    return {
      text: '',
      paragraphs: [],
      warning: '旧版 .doc 暂不支持解析，请先将文件另存为 .docx 后重新上传'
    }
  }

  let raw = ''

  if (mimeType === 'application/pdf') {
    const parser = new PDFParse({ data: fs.readFileSync(filePath) })
    const result = await parser.getText()
    await parser.destroy()
    raw = result.text.replace(/^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/gm, '')
  } else {
    const result = await mammoth.extractRawText({ path: filePath })
    raw = result.value
  }

  const { normalized, paragraphs } = splitParagraphs(raw)
  const warning =
    normalized.length < 20
      ? '未提取到足够文字，扫描版 PDF 或图片型文档需要 OCR 支持，请手动录入正文'
      : undefined

  return { text: normalized, paragraphs, warning }
}
