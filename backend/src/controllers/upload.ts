import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import { readFileSync } from 'fs'
import BadRequestError from '../errors/bad-request-error'

const MIN_FILE_SIZE = 2 * 1024

const IMAGE_SIGNATURES: { mime: string; bytes: number[] }[] = [
    { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
    { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
    { mime: 'image/gif', bytes: [0x47, 0x49, 0x46] },
]

function detectMimeType(filePath: string): string | null {
    try {
        const buffer = readFileSync(filePath)
        const matched = IMAGE_SIGNATURES.find((sig) =>
            sig.bytes.every((byte, i) => buffer[i] === byte)
        )
        if (matched) {
            return matched.mime
        }
        const text = buffer.toString('utf8', 0, 100)
        if (text.includes('<svg')) {
            return 'image/svg+xml'
        }
        return null
    } catch {
        return null
    }
}

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }

    if (req.file.size < MIN_FILE_SIZE) {
        return next(new BadRequestError('Файл слишком маленький, минимум 2kb'))
    }

    const realMime = detectMimeType(req.file.path)
    if (!realMime) {
        return next(new BadRequestError('Недопустимый тип файла'))
    }

    try {
        const fileName = process.env.UPLOAD_PATH
            ? `/${process.env.UPLOAD_PATH}/${req.file.filename}`
            : `/${req.file?.filename}`
        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName,
            originalName: req.file?.originalname,
        })
    } catch (error) {
        return next(error)
    }
}

export default {}