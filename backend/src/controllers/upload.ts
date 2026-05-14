import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import { fileTypeFromFile } from 'file-type'
import BadRequestError from '../errors/bad-request-error'

const MIN_FILE_SIZE = 2 * 1024

const ALLOWED_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
]

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

    try {
        const type = await fileTypeFromFile(req.file.path)
        if (!type || !ALLOWED_MIME_TYPES.includes(type.mime)) {
            return next(new BadRequestError('Недопустимый тип файла'))
        }

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