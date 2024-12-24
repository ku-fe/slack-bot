import dotenv from 'dotenv';

dotenv.config();

export const ARTICLES_CHANNEL_ID = process.env.ARTICLES_CHANNEL_ID ?? '';
export const JOBS_CHANNEL_ID = process.env.JOBS_CHANNEL_ID ?? '';
