// utils/sha256.js
import { createHash } from 'crypto'
export const sha256 = (txt) => createHash('sha256').update(txt).digest('hex')
