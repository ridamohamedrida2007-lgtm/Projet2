const pool = require('../config/db');

const pad = (value) => String(value).padStart(2, '0');

const formatDate = (date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

const parseDate = (value) => {
  const [year, month, day] = String(value).split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
};

const getWeekBoundsFromDate = (value) => {
  const baseDate = parseDate(value);

  if (!baseDate || Number.isNaN(baseDate.getTime())) {
    return null;
  }

  const day = baseDate.getUTCDay() || 7;
  const monday = new Date(baseDate);
  monday.setUTCDate(baseDate.getUTCDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return { monday: formatDate(monday), sunday: formatDate(sunday) };
};

const getWeekBoundsFromIsoWeek = (isoWeek) => {
  const match = String(isoWeek).match(/^(\d{4})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const week = Number(match[2]);
  const januaryFourth = new Date(Date.UTC(year, 0, 4));
  const day = januaryFourth.getUTCDay() || 7;
  const monday = new Date(januaryFourth);
  monday.setUTCDate(januaryFourth.getUTCDate() - day + 1 + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return { monday: formatDate(monday), sunday: formatDate(sunday) };
};

const getMonthBounds = (month, year) => {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return { start: formatDate(start), end: formatDate(end) };
};

const fetchPlanningById = async (id) => {
  const [rows] = await pool.query(
    `SELECT
       ts.*,
       a.nom AS agent_nom,
       a.prenom AS agent_prenom,
       a.matricule AS agent_matricule,
       a.service AS agent_service
     FROM tableaux_service ts
     INNER JOIN agents a ON a.id = ts.agent_id
     WHERE ts.id = ?`,
    [id]
  );

  return rows[0] || null;
};

const getAllPlanning = async (req, res, next) => {
  try {
    const clauses = [];
    const params = [];

    if (req.query.agent_id) {
      clauses.push('ts.agent_id = ?');
      params.push(req.query.agent_id);
    }

    if (req.query.date_debut) {
      clauses.push('ts.date_service >= ?');
      params.push(req.query.date_debut);
    }

    if (req.query.date_fin) {
      clauses.push('ts.date_service <= ?');
      params.push(req.query.date_fin);
    }

    if (req.query.type_shift) {
      clauses.push('ts.type_shift = ?');
      params.push(req.query.type_shift);
    }

    if (req.query.semaine) {
      const bounds = getWeekBoundsFromIsoWeek(req.query.semaine);
      if (bounds) {
        clauses.push('ts.date_service BETWEEN ? AND ?');
        params.push(bounds.monday, bounds.sunday);
      }
    }

    const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT
         ts.*,
         a.nom AS agent_nom,
         a.prenom AS agent_prenom,
         a.matricule AS agent_matricule,
         a.service AS agent_service
       FROM tableaux_service ts
       INNER JOIN agents a ON a.id = ts.agent_id
       ${whereClause}
       ORDER BY ts.date_service ASC, a.nom ASC, a.prenom ASC`,
      params
    );

    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

const getPlanningByWeek = async (req, res, next) => {
  try {
    const bounds = getWeekBoundsFromDate(req.params.date);

    if (!bounds) {
      return res.status(400).json({
        success: false,
        message: 'Date invalide'
      });
    }

    const [rows] = await pool.query(
      `SELECT
         ts.*,
         a.nom AS agent_nom,
         a.prenom AS agent_prenom,
         a.matricule AS agent_matricule,
         a.service AS agent_service
       FROM tableaux_service ts
       INNER JOIN agents a ON a.id = ts.agent_id
       WHERE ts.date_service BETWEEN ? AND ?
       ORDER BY a.nom ASC, a.prenom ASC, ts.date_service ASC`,
      [bounds.monday, bounds.sunday]
    );

    return res.status(200).json({
      success: true,
      data: rows,
      message: `Planning de la semaine du ${bounds.monday} au ${bounds.sunday}`
    });
  } catch (error) {
    next(error);
  }
};

const getPlanningByAgent = async (req, res, next) => {
  try {
    const agentId = req.params.id;
    const now = new Date();
    const mois = Number(req.query.mois || now.getMonth() + 1);
    const annee = Number(req.query.annee || now.getFullYear());
    const { start, end } = getMonthBounds(mois, annee);

    const [rows] = await pool.query(
      `SELECT
         ts.*,
         a.nom AS agent_nom,
         a.prenom AS agent_prenom,
         a.matricule AS agent_matricule,
         a.service AS agent_service
       FROM tableaux_service ts
       INNER JOIN agents a ON a.id = ts.agent_id
       WHERE ts.agent_id = ? AND ts.date_service BETWEEN ? AND ?
       ORDER BY ts.date_service ASC`,
      [agentId, start, end]
    );

    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

const createPlanning = async (req, res, next) => {
  try {
    const {
      agent_id,
      date_service,
      heure_debut = null,
      heure_fin = null,
      type_shift,
      note = null
    } = req.body;

    if (!agent_id || !date_service || !type_shift) {
      return res.status(400).json({
        success: false,
        message: 'Les champs agent, date de service et type de shift sont obligatoires'
      });
    }

    const [agents] = await pool.query('SELECT id FROM agents WHERE id = ?', [agent_id]);
    if (!agents.length) {
      return res.status(404).json({
        success: false,
        message: 'Agent introuvable'
      });
    }

    const [existingRows] = await pool.query(
      'SELECT id, type_shift FROM tableaux_service WHERE agent_id = ? AND date_service = ?',
      [agent_id, date_service]
    );

    if (existingRows.length) {
      const hasNonReposConflict = existingRows.some((row) => row.type_shift !== 'repos' && type_shift !== 'repos');
      return res.status(409).json({
        success: false,
        message: hasNonReposConflict
          ? 'Conflit: agent déjà planifié ce jour'
          : 'Un shift existe déjà pour cet agent à cette date'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO tableaux_service (agent_id, date_service, heure_debut, heure_fin, type_shift, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        agent_id,
        date_service,
        type_shift === 'repos' ? null : (heure_debut || null),
        type_shift === 'repos' ? null : (heure_fin || null),
        type_shift,
        note
      ]
    );

    const created = await fetchPlanningById(result.insertId);

    return res.status(201).json({
      success: true,
      data: created,
      message: 'Shift créé'
    });
  } catch (error) {
    next(error);
  }
};

const updatePlanning = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existingRows] = await pool.query('SELECT * FROM tableaux_service WHERE id = ?', [id]);

    if (!existingRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Shift introuvable'
      });
    }

    const current = existingRows[0];
    const nextAgentId = req.body.agent_id || current.agent_id;
    const nextDate = req.body.date_service || current.date_service;
    const nextTypeShift = req.body.type_shift || current.type_shift;

    const [conflicts] = await pool.query(
      `SELECT id, type_shift
       FROM tableaux_service
       WHERE agent_id = ? AND date_service = ? AND id <> ?`,
      [nextAgentId, nextDate, id]
    );

    if (conflicts.length) {
      const hasNonReposConflict = conflicts.some((row) => row.type_shift !== 'repos' && nextTypeShift !== 'repos');
      return res.status(409).json({
        success: false,
        message: hasNonReposConflict
          ? 'Conflit: agent déjà planifié ce jour'
          : 'Un shift existe déjà pour cet agent à cette date'
      });
    }

    const allowedFields = ['agent_id', 'date_service', 'heure_debut', 'heure_fin', 'type_shift', 'note'];
    const fieldsToUpdate = allowedFields.filter((field) => Object.prototype.hasOwnProperty.call(req.body, field));

    if (!fieldsToUpdate.length) {
      return res.status(400).json({
        success: false,
        message: 'Aucune donnée à mettre à jour'
      });
    }

    const updateData = {
      agent_id: nextAgentId,
      date_service: nextDate,
      heure_debut: nextTypeShift === 'repos'
        ? null
        : (Object.prototype.hasOwnProperty.call(req.body, 'heure_debut') ? (req.body.heure_debut || null) : current.heure_debut),
      heure_fin: nextTypeShift === 'repos'
        ? null
        : (Object.prototype.hasOwnProperty.call(req.body, 'heure_fin') ? (req.body.heure_fin || null) : current.heure_fin),
      type_shift: nextTypeShift,
      note: Object.prototype.hasOwnProperty.call(req.body, 'note') ? req.body.note : current.note
    };

    await pool.query(
      `UPDATE tableaux_service
       SET agent_id = ?, date_service = ?, heure_debut = ?, heure_fin = ?, type_shift = ?, note = ?, statut = 'modifie'
       WHERE id = ?`,
      [
        updateData.agent_id,
        updateData.date_service,
        updateData.heure_debut,
        updateData.heure_fin,
        updateData.type_shift,
        updateData.note,
        id
      ]
    );

    const updated = await fetchPlanningById(id);

    return res.status(200).json({
      success: true,
      data: updated,
      message: 'Shift mis à jour'
    });
  } catch (error) {
    next(error);
  }
};

const deletePlanning = async (req, res, next) => {
  try {
    const [existingRows] = await pool.query('SELECT id FROM tableaux_service WHERE id = ?', [req.params.id]);

    if (!existingRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Shift introuvable'
      });
    }

    await pool.query('DELETE FROM tableaux_service WHERE id = ?', [req.params.id]);

    return res.status(200).json({
      success: true,
      message: 'Shift supprimé'
    });
  } catch (error) {
    next(error);
  }
};

const getPlanningStats = async (req, res, next) => {
  try {
    const now = new Date();
    const mois = Number(req.query.mois || now.getMonth() + 1);
    const annee = Number(req.query.annee || now.getFullYear());
    const { start, end } = getMonthBounds(mois, annee);
    const currentWeekBounds = getWeekBoundsFromDate(formatDate(now));

    const [typeRows] = await pool.query(
      `SELECT type_shift, COUNT(*) AS total
       FROM tableaux_service
       WHERE date_service BETWEEN ? AND ?
       GROUP BY type_shift`,
      [start, end]
    );

    const [serviceRows] = await pool.query(
      `SELECT COALESCE(NULLIF(a.service, ''), 'Non affecté') AS service, COUNT(*) AS total
       FROM tableaux_service ts
       INNER JOIN agents a ON a.id = ts.agent_id
       WHERE ts.date_service BETWEEN ? AND ?
       GROUP BY COALESCE(NULLIF(a.service, ''), 'Non affecté')
       ORDER BY total DESC, service ASC`,
      [start, end]
    );

    const [[monthTotalRow]] = await pool.query(
      'SELECT COUNT(*) AS total FROM tableaux_service WHERE date_service BETWEEN ? AND ?',
      [start, end]
    );

    const [[weekTotalRow]] = await pool.query(
      'SELECT COUNT(*) AS total FROM tableaux_service WHERE date_service BETWEEN ? AND ?',
      [currentWeekBounds.monday, currentWeekBounds.sunday]
    );

    const byTypeShift = {
      matin: 0,
      soir: 0,
      nuit: 0,
      repos: 0
    };

    typeRows.forEach((row) => {
      byTypeShift[row.type_shift] = Number(row.total);
    });

    return res.status(200).json({
      success: true,
      data: {
        totalShifts: Number(monthTotalRow.total || 0),
        currentWeekTotal: Number(weekTotalRow.total || 0),
        byTypeShift,
        byService: serviceRows.map((row) => ({
          service: row.service,
          total: Number(row.total)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getPlanningById = async (req, res, next) => {
  try {
    const planning = await fetchPlanningById(req.params.id);

    if (!planning) {
      return res.status(404).json({
        success: false,
        message: 'Shift introuvable'
      });
    }

    return res.status(200).json({
      success: true,
      data: planning
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPlanning,
  getPlanningByWeek,
  getPlanningByAgent,
  createPlanning,
  updatePlanning,
  deletePlanning,
  getPlanningStats,
  getPlanningById
};
