import * as Minio from 'minio'
import { nanoid } from 'nanoid'

const endPoint = process.env.S3_ENDPOINT?.replace(/^https?:\/\//, '') || 's3.abfti.com.br'
const port = Number(process.env.S3_PORT) || 443
const useSSL = process.env.S3_USE_SSL !== 'false'

export const minioClient = new Minio.Client({
  endPoint,
  port,
  useSSL,
  accessKey: process.env.S3_ACCESS_KEY_ID,
  secretKey: process.env.S3_SECRET_ACCESS_KEY,
})

export const S3_BUCKETS = {
  EVENTOS: 'eventos',
  ABF_TI: 'abf-ti',
} as const

export function getPublicUrl(bucket: string, filePath: string): string {
  return `https://s3.abfti.com.br/${bucket}/${filePath}`
}

export function generateUniqueFileName(originalName: string = 'image.jpg'): string {
  const extension = originalName.split('.').pop() || 'jpg'
  const uniqueId = nanoid(10)
  return `${Date.now()}-${uniqueId}.${extension}`
}

export async function getFileBuffer(file: any): Promise<{ buffer: Buffer, type: string, size: number, name: string }> {
  if (file instanceof Blob || (typeof file === 'object' && file !== null && 'arrayBuffer' in file && typeof file.arrayBuffer === 'function')) {
    const buffer = Buffer.from(await file.arrayBuffer())
    return {
      buffer,
      type: file.type || 'image/jpeg',
      size: buffer.length,
      name: file.name || 'image.jpg'
    }
  }

  if (Buffer.isBuffer(file)) {
    return {
      buffer: file,
      type: 'application/octet-stream',
      size: file.length,
      name: 'buffer.bin'
    }
  }

  if (typeof file === 'object' && file !== null) {
    const actualFile = file.valueOf?.() ?? file

    if (actualFile instanceof Blob || 'arrayBuffer' in actualFile) {
      return getFileBuffer(actualFile)
    }

    if (typeof file.stream === 'function') {
      const chunks = []
      for await (const chunk of file.stream()) {
        chunks.push(chunk)
      }
      const buffer = Buffer.concat(chunks)
      return {
        buffer,
        type: file.type || 'application/octet-stream',
        size: buffer.length,
        name: file.name || 'streamed-file.bin'
      }
    }

    if (file.data && Buffer.isBuffer(file.data)) {
      return {
        buffer: file.data,
        type: file.type || 'application/octet-stream',
        size: file.data.length,
        name: file.name || 'data-file.bin'
      }
    }
  }

  const stringData = String(file)
  const buffer = Buffer.from(stringData)
  return {
    buffer,
    type: 'text/plain',
    size: buffer.length,
    name: 'text-file.txt'
  }
}
