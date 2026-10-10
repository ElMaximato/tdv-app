import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Router } from 'express';

import { db } from '../config/db.js';
import { JWT_SECRET } from '../config/env.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.get('/quiz/questions', authRequired, async (req, res) => {
  try {
    const [[user]]=await db.query('SELECT is_verified FROM users WHERE id=?',[req.user.id]);
    const [[lastAttempt]]=await db.query(`SELECT attempted_at FROM quiz_attempts WHERE user_id=? ORDER BY attempted_at DESC LIMIT 1`,[req.user.id]);
    if (lastAttempt&&!user.is_verified){const d=(Date.now()-new Date(lastAttempt.attempted_at).getTime())/(1000*60*60*24);if(d<30)return res.status(429).json({error:'Debes esperar 30 días entre intentos',next_attempt:new Date(new Date(lastAttempt.attempted_at).getTime()+30*24*60*60*1000)});}
    const [questions]=await db.query(`SELECT id,question_text,option_a,option_b,option_c,option_d FROM quiz_questions ORDER BY RAND() LIMIT 10`);
    if (!questions.length) return res.status(404).json({error:'No hay preguntas disponibles'});
    // El token firma QUÉ preguntas se entregaron: al enviar, el servidor solo califica esas.
    const quiz_token = jwt.sign({ uid: req.user.id, ids: questions.map(q=>q.id), jti: crypto.randomUUID() }, JWT_SECRET, { expiresIn:'30m', issuer:'tdv-quiz' });
    res.json({questions,total:questions.length,quiz_token});
  } catch(err){console.error(err);res.status(500).json({error:'Error al obtener preguntas'});}
});

const usedQuizTokens = new Set();   // jti de quizzes ya enviados (en memoria; se limpia solo)

router.post('/quiz/submit', authRequired, async (req, res) => {
  const {answers, quiz_token}=req.body;
  if (!answers||!Array.isArray(answers)) return res.status(400).json({error:'Se requiere un array de respuestas'});
  if (!quiz_token) return res.status(400).json({error:'Falta el quiz_token. Pide las preguntas de nuevo.'});
  let quiz;
  try { quiz = jwt.verify(quiz_token, JWT_SECRET, { issuer:'tdv-quiz' }); }
  catch { return res.status(400).json({error:'El quiz expiró o es inválido. Inicia uno nuevo.'}); }
  if (quiz.uid !== req.user.id) return res.status(403).json({error:'Este quiz no es tuyo'});
  if (usedQuizTokens.has(quiz.jti)) return res.status(409).json({error:'Este quiz ya fue enviado'});
  usedQuizTokens.add(quiz.jti);                       // un token = un solo envío
  setTimeout(() => usedQuizTokens.delete(quiz.jti), 31*60*1000).unref();
  try {
    const servedIds = quiz.ids;                        // las preguntas realmente entregadas
    const [questions]=await db.query(`SELECT id,correct_opt FROM quiz_questions WHERE id IN (?)`,[servedIds]);
    const map={}; questions.forEach(q=>{map[q.id]=q.correct_opt;});
    // Solo cuenta UNA respuesta por pregunta entregada; las no respondidas valen como incorrectas.
    const given={}; answers.forEach(a=>{ if (servedIds.includes(a?.question_id) && !(a.question_id in given)) given[a.question_id]=a.answer; });
    let correct=0; servedIds.forEach(id=>{ if (map[id] && given[id]===map[id]) correct++; });
    const total=servedIds.length, passed=correct>=Math.ceil(total*0.7);
    await db.query(`INSERT INTO quiz_attempts (user_id,score,total,passed) VALUES (?,?,?,?)`,[req.user.id,correct,total,passed?1:0]);
    if (passed) await db.query('UPDATE users SET is_verified=TRUE WHERE id=?',[req.user.id]);
    res.json({score:correct,total,passed,message:passed?'¡Felicidades! Ahora eres un Gamer Verificado y puedes votar.':`Necesitas al menos ${Math.ceil(total*0.7)}/${total} para aprobar. Inténtalo en 30 días.`});
  } catch(err){console.error(err);res.status(500).json({error:'Error al procesar el quiz'});}
});

export default router;
