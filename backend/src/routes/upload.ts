import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { uploadFile } from '../controllers/upload'
import fileMiddleware from '../middlewares/file'
import auth from '../middlewares/auth'
import BadRequestError from '../errors/bad-request-error'

const uploadRouter = Router()

uploadRouter.post('/', auth, (req: Request, res: Response, next: NextFunction) => {
    fileMiddleware(req, res, (err) => {
        if (err instanceof multer.MulterError || err) {
            return next(new BadRequestError(err.message))
        }
        next()
    })
}, uploadFile)

export default uploadRouter