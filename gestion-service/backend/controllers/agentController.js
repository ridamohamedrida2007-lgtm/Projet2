const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email) => {
  if (!email) {
    return null;
  }

  return String(email).trim().toLowerCase();
};

const generateTemporaryPassword = (length = 10) => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
  let password = '';

  for (let index = 0; index < length; index += 1) {
    password += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return password;
};

const getAgentSelectClause = () => `SELECT
    a.*,
    u.email AS compte_email,
    u.actif AS compte_actif,
    CASE WHEN a.utilisateur_id IS NOT NULL THEN TRUE ELSE FALSE END AS compte_cree
   FROM agents a
   LEFT JOIN utilisateurs u ON u.id = a.utilisateur_id`;

const getAgentByIdWithAccount = async (id, connection = pool) => {
  const [rows] = await connection.query(
    `${getAgentSelectClause()} WHERE a.id = ?`,
    [id]
  );

  return rows[0] || null;
};

const buildAgentFilters = (query) => {
  const clauses = [];
  const params = [];

  if (query.search) {
    clauses.push('(a.nom LIKE ? OR a.prenom LIKE ? OR a.matricule LIKE ? OR a.email LIKE ?)');
    const searchValue = `%${query.search}%`;
    params.push(searchValue, searchValue, searchValue, searchValue);
  }

  if (query.service) {
    clauses.push('a.service = ?');
    params.push(query.service);
  }

  if (query.statut) {
    clauses.push('a.statut = ?');
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
      `SELECT COUNT(*) AS total
       FROM agents a
       LEFT JOIN utilisateurs u ON u.id = a.utilisateur_id
       ${whereClause}`,
      params
    );

    const total = countRows[0].total;
    const pages = total ? Math.ceil(total / limit) : 1;
    const [agents] = await pool.query(
      `${getAgentSelectClause()}
       ${whereClause}
       ORDER BY a.nom ASC, a.prenom ASC
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
    const agent = await getAgentByIdWithAccount(id);

    if (!agent) {
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
        ...agent,
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
      email,
      date_embauche = null,
      statut = 'actif'
    } = req.body;

    const normalizedEmail = normalizeEmail(email);

    if (!matricule || !nom || !prenom || !normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Les champs matricule, nom, prénom et email sont obligatoires'
      });
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Email invalide'
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

    const [existingAgentEmail] = await pool.query(
      'SELECT id FROM agents WHERE email = ?',
      [normalizedEmail]
    );

    if (existingAgentEmail.length) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà associé à un agent'
      });
    }

    const [existingUsers] = await pool.query(
      'SELECT id FROM utilisateurs WHERE email = ?',
      [normalizedEmail]
    );

    if (existingUsers.length) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé pour un compte utilisateur'
      });
    }

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    const connection = await pool.getConnection();

    let result;

    try {
      await connection.beginTransaction();

      const [userResult] = await connection.query(
        `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role)
         VALUES (?, ?, ?, ?, 'agent')`,
        [nom, prenom, normalizedEmail, hashedPassword]
      );

      [result] = await connection.query(
        `INSERT INTO agents (matricule, nom, prenom, poste, service, telephone, email, utilisateur_id, date_embauche, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [matricule, nom, prenom, poste, service, telephone, normalizedEmail, userResult.insertId, date_embauche || null, statut]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const created = await getAgentByIdWithAccount(result.insertId);

    return res.status(201).json({
      success: true,
      data: created,
      message: 'Agent créé et compte utilisateur généré',
      compte: {
        email: normalizedEmail,
        mot_de_passe_temporaire: temporaryPassword
      }
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
      'email',
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
    const nextEmail = Object.prototype.hasOwnProperty.call(req.body, 'email')
      ? normalizeEmail(req.body.email)
      : currentAgent.email;

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

    if (Object.prototype.hasOwnProperty.call(req.body, 'email') && req.body.email && !EMAIL_REGEX.test(nextEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Email invalide'
      });
    }

    if (currentAgent.utilisateur_id && Object.prototype.hasOwnProperty.call(req.body, 'email') && !nextEmail) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer l’email d’un agent déjà lié à un compte'
      });
    }

    if (nextEmail) {
      const [agentEmailDuplicate] = await pool.query(
        'SELECT id FROM agents WHERE email = ? AND id <> ?',
        [nextEmail, id]
      );

      if (agentEmailDuplicate.length) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà associé à un autre agent'
        });
      }

      const [userEmailDuplicate] = await pool.query(
        'SELECT id FROM utilisateurs WHERE email = ? AND id <> ?',
        [nextEmail, currentAgent.utilisateur_id || 0]
      );

      if (userEmailDuplicate.length) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé pour un compte utilisateur'
        });
      }
    }

    const connection = await pool.getConnection();
    let temporaryPassword = null;
    let linkedUserId = currentAgent.utilisateur_id;

    try {
      await connection.beginTransaction();

      if (currentAgent.utilisateur_id) {
        await connection.query(
          `UPDATE utilisateurs
           SET nom = ?, prenom = ?, email = ?
           WHERE id = ?`,
          [
            Object.prototype.hasOwnProperty.call(req.body, 'nom') ? req.body.nom : currentAgent.nom,
            Object.prototype.hasOwnProperty.call(req.body, 'prenom') ? req.body.prenom : currentAgent.prenom,
            nextEmail,
            currentAgent.utilisateur_id
          ]
        );
      } else if (nextEmail) {
        temporaryPassword = generateTemporaryPassword();
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
        const [userResult] = await connection.query(
          `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role)
           VALUES (?, ?, ?, ?, 'agent')`,
          [
            Object.prototype.hasOwnProperty.call(req.body, 'nom') ? req.body.nom : currentAgent.nom,
            Object.prototype.hasOwnProperty.call(req.body, 'prenom') ? req.body.prenom : currentAgent.prenom,
            nextEmail,
            hashedPassword
          ]
        );

        linkedUserId = userResult.insertId;
      }

      const updateData = {
        matricule: nextMatricule,
        nom: Object.prototype.hasOwnProperty.call(req.body, 'nom') ? req.body.nom : currentAgent.nom,
        prenom: Object.prototype.hasOwnProperty.call(req.body, 'prenom') ? req.body.prenom : currentAgent.prenom,
        poste: Object.prototype.hasOwnProperty.call(req.body, 'poste') ? req.body.poste : currentAgent.poste,
        service: Object.prototype.hasOwnProperty.call(req.body, 'service') ? req.body.service : currentAgent.service,
        telephone: Object.prototype.hasOwnProperty.call(req.body, 'telephone') ? req.body.telephone : currentAgent.telephone,
        email: nextEmail,
        date_embauche: Object.prototype.hasOwnProperty.call(req.body, 'date_embauche') ? (req.body.date_embauche || null) : currentAgent.date_embauche,
        statut: Object.prototype.hasOwnProperty.call(req.body, 'statut') ? req.body.statut : currentAgent.statut,
        utilisateur_id: linkedUserId
      };

      await connection.query(
        `UPDATE agents
         SET matricule = ?, nom = ?, prenom = ?, poste = ?, service = ?, telephone = ?, email = ?, utilisateur_id = ?, date_embauche = ?, statut = ?
         WHERE id = ?`,
        [
          updateData.matricule,
          updateData.nom,
          updateData.prenom,
          updateData.poste,
          updateData.service,
          updateData.telephone,
          updateData.email,
          updateData.utilisateur_id,
          updateData.date_embauche,
          updateData.statut,
          id
        ]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const updated = await getAgentByIdWithAccount(id);

    return res.status(200).json({
      success: true,
      data: updated,
      message: temporaryPassword ? 'Agent mis à jour et compte utilisateur créé' : 'Agent mis à jour',
      ...(temporaryPassword ? {
        compte: {
          email: nextEmail,
          mot_de_passe_temporaire: temporaryPassword
        }
      } : {})
    });
  } catch (error) {
    next(error);
  }
};

const deleteAgent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existingAgents] = await pool.query('SELECT id, utilisateur_id FROM agents WHERE id = ?', [id]);

    if (!existingAgents.length) {
      return res.status(404).json({
        success: false,
        message: 'Agent introuvable'
      });
    }

    if (existingAgents[0].utilisateur_id) {
      await pool.query(
        'UPDATE utilisateurs SET actif = FALSE WHERE id = ?',
        [existingAgents[0].utilisateur_id]
      );
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
