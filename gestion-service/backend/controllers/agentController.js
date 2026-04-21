const pool = require('../config/db');

const buildAgentFilters = (query) => {
  const clauses = [];
  const params = [];

  if (query.search) {
    clauses.push('(nom LIKE ? OR prenom LIKE ? OR matricule LIKE ?)');
    const searchValue = `%${query.search}%`;
    params.push(searchValue, searchValue, searchValue);
  }

  if (query.service) {
    clauses.push('service = ?');
    params.push(query.service);
  }

  if (query.statut) {
    clauses.push('statut = ?');
    params.push(query.statut);
  }

  return {
    whereClause: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params
  };
};

const getAllAgents = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const offset = (page - 1) * limit;
    const { whereClause, params } = buildAgentFilters(req.query);

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM agents ${whereClause}`,
      params
    );

    const total = countRows[0].total;
    const pages = total ? Math.ceil(total / limit) : 1;
    const [agents] = await pool.query(
      `SELECT *
       FROM agents
       ${whereClause}
       ORDER BY nom ASC, prenom ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: agents,
      total,
      page,
      pages
    });
  } catch (error) {
    next(error);
  }
};

const getAgentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [agents] = await pool.query('SELECT * FROM agents WHERE id = ?', [id]);

    if (!agents.length) {
      return res.status(404).json({
        success: false,
        message: 'Agent introuvable'
      });
    }

    const [planning] = await pool.query(
      `SELECT id, agent_id, date_service, heure_debut, heure_fin, type_shift, statut, note, created_at
       FROM tableaux_service
       WHERE agent_id = ?
       ORDER BY date_service DESC, created_at DESC
       LIMIT 10`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...agents[0],
        planning_recent: planning
      }
    });
  } catch (error) {
    next(error);
  }
};

const createAgent = async (req, res, next) => {
  try {
    const {
      matricule,
      nom,
      prenom,
      poste = null,
      service = null,
      telephone = null,
      date_embauche = null,
      statut = 'actif'
    } = req.body;

    if (!matricule || !nom || !prenom) {
      return res.status(400).json({
        success: false,
        message: 'Les champs matricule, nom et prénom sont obligatoires'
      });
    }

    const [existingAgents] = await pool.query(
      'SELECT id FROM agents WHERE matricule = ?',
      [matricule]
    );

    if (existingAgents.length) {
      return res.status(400).json({
        success: false,
        message: 'Ce matricule existe déjà'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO agents (matricule, nom, prenom, poste, service, telephone, date_embauche, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [matricule, nom, prenom, poste, service, telephone, date_embauche || null, statut]
    );

    const [created] = await pool.query('SELECT * FROM agents WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      data: created[0],
      message: 'Agent créé'
    });
  } catch (error) {
    next(error);
  }
};

const updateAgent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existingAgents] = await pool.query('SELECT * FROM agents WHERE id = ?', [id]);

    if (!existingAgents.length) {
      return res.status(404).json({
        success: false,
        message: 'Agent introuvable'
      });
    }

    const currentAgent = existingAgents[0];
    const allowedFields = [
      'matricule',
      'nom',
      'prenom',
      'poste',
      'service',
      'telephone',
      'date_embauche',
      'statut'
    ];

    const fieldsToUpdate = allowedFields.filter((field) => Object.prototype.hasOwnProperty.call(req.body, field));

    if (!fieldsToUpdate.length) {
      return res.status(400).json({
        success: false,
        message: 'Aucune donnée à mettre à jour'
      });
    }

    const nextMatricule = Object.prototype.hasOwnProperty.call(req.body, 'matricule')
      ? req.body.matricule
      : currentAgent.matricule;

    if (nextMatricule !== currentAgent.matricule) {
      const [duplicate] = await pool.query(
        'SELECT id FROM agents WHERE matricule = ? AND id <> ?',
        [nextMatricule, id]
      );

      if (duplicate.length) {
        return res.status(400).json({
          success: false,
          message: 'Ce matricule existe déjà'
        });
      }
    }

    const setClause = fieldsToUpdate.map((field) => `${field} = ?`).join(', ');
    const values = fieldsToUpdate.map((field) => {
      if (field === 'date_embauche') {
        return req.body[field] || null;
      }

      return req.body[field];
    });

    await pool.query(
      `UPDATE agents SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    const [updated] = await pool.query('SELECT * FROM agents WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      data: updated[0],
      message: 'Agent mis à jour'
    });
  } catch (error) {
    next(error);
  }
};

const deleteAgent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existingAgents] = await pool.query('SELECT id FROM agents WHERE id = ?', [id]);

    if (!existingAgents.length) {
      return res.status(404).json({
        success: false,
        message: 'Agent introuvable'
      });
    }

    await pool.query('DELETE FROM agents WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Agent supprimé'
    });
  } catch (error) {
    next(error);
  }
};

const getAgentStats = async (req, res, next) => {
  try {
    const [[totalsRow]] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN statut = 'actif' THEN 1 ELSE 0 END) AS actif,
         SUM(CASE WHEN statut = 'conge' THEN 1 ELSE 0 END) AS conge,
         SUM(CASE WHEN statut = 'suspendu' THEN 1 ELSE 0 END) AS suspendu
       FROM agents`
    );

    const [serviceRows] = await pool.query(
      `SELECT COALESCE(NULLIF(service, ''), 'Non affecté') AS service, COUNT(*) AS total
       FROM agents
       GROUP BY COALESCE(NULLIF(service, ''), 'Non affecté')
       ORDER BY total DESC, service ASC`
    );

    return res.status(200).json({
      success: true,
      data: {
        total: Number(totalsRow.total || 0),
        byStatut: {
          actif: Number(totalsRow.actif || 0),
          conge: Number(totalsRow.conge || 0),
          suspendu: Number(totalsRow.suspendu || 0)
        },
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

module.exports = {
  getAllAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
  getAgentStats
};
