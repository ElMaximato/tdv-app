import { Router } from 'express';

import { db } from '../../config/db.js';
import { adminRequired } from '../../middleware/auth.js';
import { logAudit } from '../../utils/audit.js';

const router = Router();

router.get('/admin/quiz/questions',     adminRequired, async(_,res)=>{try{const[r]=await db.query('SELECT * FROM quiz_questions ORDER BY id DESC');res.json(r);}catch(err){console.error(err);res.status(500).json({error:'Error'});}});
router.post('/admin/quiz/questions',     adminRequired, async(req,res)=>{const{question_text,option_a,option_b,option_c,option_d,correct_opt,difficulty,game_id}=req.body;if(!question_text||!option_a||!option_b||!option_c||!option_d||!correct_opt)return res.status(400).json({error:'Todos los campos son obligatorios'});if(!['a','b','c','d'].includes(correct_opt))return res.status(400).json({error:'correct_opt inválido'});try{const[r]=await db.query(`INSERT INTO quiz_questions (question_text,option_a,option_b,option_c,option_d,correct_opt,difficulty,game_id) VALUES (?,?,?,?,?,?,?,?)`,[question_text,option_a,option_b,option_c,option_d,correct_opt,difficulty||'medium',game_id||null]);await logAudit(req.admin.id,'quiz_question_create',req.ip,`ID ${r.insertId}`);res.status(201).json({id:r.insertId});}catch(err){console.error(err);res.status(500).json({error:'Error'});}});
router.put('/admin/quiz/questions/:id', adminRequired, async(req,res)=>{const{question_text,option_a,option_b,option_c,option_d,correct_opt,difficulty}=req.body;try{await db.query(`UPDATE quiz_questions SET question_text=?,option_a=?,option_b=?,option_c=?,option_d=?,correct_opt=?,difficulty=? WHERE id=?`,[question_text,option_a,option_b,option_c,option_d,correct_opt,difficulty,req.params.id]);res.json({ok:true});}catch(err){console.error(err);res.status(500).json({error:'Error'});}});
router.delete('/admin/quiz/questions/:id', adminRequired, async(req,res)=>{try{await db.query('DELETE FROM quiz_questions WHERE id=?',[req.params.id]);await logAudit(req.admin.id,'quiz_question_delete',req.ip,`ID ${req.params.id}`);res.json({ok:true});}catch(err){console.error(err);res.status(500).json({error:'Error'});}});

export default router;
