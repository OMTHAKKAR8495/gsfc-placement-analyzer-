import app from '../backend/index.js';

export default function handler(req, res) {
  return app(req, res);
}
