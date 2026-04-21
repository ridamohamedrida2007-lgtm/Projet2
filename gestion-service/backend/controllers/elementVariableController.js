const pool = require('../config/db');

const sanitizeDecimal = (value) => Number.parseFloat(value || 0).toFixed(2);
const sanitizeInteger = (value) => Number.parseInt(value || 0, 10);

const getElementById = async (id) => {
  const [rows] = await pool.query(
    `SELECT
       ev.*,
       a.nom AS agent_nom,
       a.prenom AS agent_prenom,
       a.matricule AS agent_matricule,
       a.service AS agent_service,
       CONCAT(u.nom, ' ', u.prenom) AS valide_par_nom
     FROM elements_variables ev
     INNER JOIN agents a ON a.id = ev.agent_id
     LEFT JOIN utilisateurs u ON u.id = ev.valide_par
     WHERE ev.id = ?`,
    [id]
  );

  if (!rows.length) {
    return null;
  }

  const row = rows[0];
  return {
    ...row,
    total_primes: Number(row.prime_rendement) + Number(row.indemnite_transport) + Number(row.autres_primes)
  };
};

const getAllElementsVariables = async (req, res, next) => {
  try {
    const clauses = [];
    const params = [];

    if (req.query.mois) {
      clauses.push('ev.mois = ?');
      params.push(req.query.mois);
    }

    if (req.query.annee) {
      clauses.push('ev.annee = ?');
      params.push(req.query.annee);
    }

    if (req.query.agent_id) {
      clauses.push('ev.agent_id = ?');
      params.push(req.query.agent_id);
    }

    if (typeof req.query.valide !== 'undefined' && req.query.valide !== '') {
      clauses.push('ev.valide = ?');
      params.push(req.query.valide === 'true' || req.query.valide === '1');
    }

    const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT
         ev.*,
         a.nom AS agent_nom,
         a.prenom AS agent_prenom,
         a.matricule AS agent_matricule,
         a.service AS agent_service
       FROM elements_variables ev
       INNER JOIN agents a ON a.id = ev.agent_id
       ${whereClause}
       ORDER BY ev.annee DESC, ev.mois DESC, a.nom ASC, a.prenom ASC`,
      params
    );

    return res.status(200).json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        total_primes: Number(row.prime_rendement) + Number(row.indemnite_transport) + Number(row.autres_primes)
      }))
    });
  } catch (error) {
    next(error);
  }
};

const getElementsVariablesByAgent = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         ev.*,
         a.nom AS agent_nom,
         a.prenom AS agent_prenom,
         a.matricule AS agent_matricule,
         a.service AS agent_service
       FROM elements_variables ev
       INNER JOIN agents a ON a.id = ev.agent_id
       WHERE ev.agent_id = ?
       ORDER BY ev.annee DESC, ev.mois DESC`,
      [req.params.id]
    );

    return res.status(200).json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        total_primes: Number(row.prime_rendement) + Number(row.indemnite_transport) + Number(row.autres_primes)
      }))
    });
  } catch (error) {
    next(error);
  }
};

const getRecapMensuel = async (req, res, next) => {
  try {
    const mois = Number(req.params.mois);
    const annee = Number(req.params.annee);

    const [rows] = await pool.query(
      `SELECT
         a.id AS agent_id,
         a.matricule,
         a.nom,
         a.prenom,
         a.service,
         ev.id,
         ev.mois,
         ev.annee,
         COALESCE(ev.heures_supplementaires, 0) AS heures_supplementaires,
         COALESCE(ev.jours_absence, 0) AS jours_absence,
         ev.motif_absence,
         COALESCE(ev.jours_conge, 0) AS jours_conge,
         COALESCE(ev.prime_rendement, 0) AS prime_rendement,
         COALESCE(ev.indemnite_transport, 0) AS indemnite_transport,
         COALESCE(ev.autres_primes, 0) AS autres_primes,
         COALESCE(ev.valide, FALSE) AS valide,
         ev.valide_par,
         ev.valide_le,
         ev.created_at
       FROM agents a
       LEFT JOIN elements_variables ev
         ON ev.agent_id = a.id AND ev.mois = ? AND ev.annee = ?
       ORDER BY a.nom ASC, a.prenom ASC`,
      [mois, annee]
    );

    const data = rows.map((row) => ({
      ...row,
      total_primes: Number(row.prime_rendement) + Number(row.indemnite_transport) + Number(row.autres_primes)
    }));

    const summary = data.reduce((accumulator, item) => ({
      heures_supplementaires: accumulator.heures_supplementaires + Number(item.heures_supplementaires || 0),
      jours_absence: accumulator.jours_absence + Number(item.jours_absence || 0),
      jours_conge: accumulator.jours_conge + Number(item.jours_conge || 0),
      prime_rendement: accumulator.prime_rendement + Number(item.prime_rendement || 0),
      indemnite_transport: accumulator.indemnite_transport + Number(item.indemnite_transport || 0),
      autres_primes: accumulator.autres_primes + Number(item.autres_primes || 0),
      total_primes: accumulator.total_primes + Number(item.total_primes || 0)
    }), {
      heures_supplementaires: 0,
      jours_absence: 0,
      jours_conge: 0,
      prime_rendement: 0,
      indemnite_transport: 0,
      autres_primes: 0,
      total_primes: 0
    });

    return res.status(200).json({
      success: true,
      data,
      summary
    });
  } catch (error) {
    next(error);
  }
};

const createElementVariable = async (req, res, next) => {
  try {
    const { agent_id, mois, annee } = req.body;

    if (!agent_id || !mois || !annee) {
      return res.status(400).json({
        success: false,
        message: 'Les champs agent, mois et année sont obligatoires'
      });
    }

    const [duplicates] = await pool.query(
      'SELECT id FROM elements_variables WHERE agent_id = ? AND mois = ? AND annee = ?',
      [agent_id, mois, annee]
    );

    if (duplicates.length) {
      return res.status(400).json({
        success: false,
        message: 'Un enregistrement existe déjà pour cet agent sur cette période'
      });
    }

    const [agents] = await pool.query('SELECT id FROM agents WHERE id = ?', [agent_id]);
    if (!agents.length) {
      return res.status(404).json({
        success: false,
        message: 'Agent introuvable'
      });
    }

    const payload = {
      heures_supplementaires: sanitizeDecimal(req.body.heures_supplementaires),
      jours_absence: sanitizeInteger(req.body.jours_absence),
      motif_absence: req.body.motif_absence || null,
      jours_conge: sanitizeInteger(req.body.jours_conge),
      prime_rendement: sanitizeDecimal(req.body.prime_rendement),
      indemnite_transport: sanitizeDecimal(req.body.indemnite_transport),
      autres_primes: sanitizeDecimal(req.body.autres_primes)
    };

    const [result] = await pool.query(
      `INSERT INTO elements_variables
         (agent_id, mois, annee, heures_supplementaires, jours_absence, motif_absence, jours_conge, prime_rendement, indemnite_transport, autres_primes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        agent_id,
        mois,
        annee,
        payload.heures_supplementaires,
        payload.jours_absence,
        payload.motif_absence,
        payload.jours_conge,
        payload.prime_rendement,
        payload.indemnite_transport,
        payload.autres_primes
      ]
    );

    const created = await getElementById(result.insertId);

    return res.status(201).json({
      success: true,
      data: created,
      message: 'Éléments variables créés'
    });
  } catch (error) {
    next(error);
  }
};

const updateElementVariable = async (req, res, next) => {
  try {
    const existing = await getElementById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Enregistrement introuvable'
      });
    }

    if (existing.valide && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Les éléments validés ne peuvent plus être modifiés'
      });
    }

    const updatedValues = {
      heures_supplementaires: Object.prototype.hasOwnProperty.call(req.body, 'heures_supplementaires')
        ? sanitizeDecimal(req.body.heures_supplementaires)
        : existing.heures_supplementaires,
      jours_absence: Object.prototype.hasOwnProperty.call(req.body, 'jours_absence')
        ? sanitizeInteger(req.body.jours_absence)
        : existing.jours_absence,
      motif_absence: Object.prototype.hasOwnProperty.call(req.body, 'motif_absence')
        ? (req.body.motif_absence || null)
        : existing.motif_absence,
      jours_conge: Object.prototype.hasOwnProperty.call(req.body, 'jours_conge')
        ? sanitizeInteger(req.body.jours_conge)
        : existing.jours_conge,
      prime_rendement: Object.prototype.hasOwnProperty.call(req.body, 'prime_rendement')
        ? sanitizeDecimal(req.body.prime_rendement)
        : existing.prime_rendement,
      indemnite_transport: Object.prototype.hasOwnProperty.call(req.body, 'indemnite_transport')
        ? sanitizeDecimal(req.body.indemnite_transport)
        : existing.indemnite_transport,
      autres_primes: Object.prototype.hasOwnProperty.call(req.body, 'autres_primes')
        ? sanitizeDecimal(req.body.autres_primes)
        : existing.autres_primes
    };

    await pool.query(
      `UPDATE elements_variables
       SET heures_supplementaires = ?, jours_absence = ?, motif_absence = ?, jours_conge = ?, prime_rendement = ?, indemnite_transport = ?, autres_primes = ?
       WHERE id = ?`,
      [
        updatedValues.heures_supplementaires,
        updatedValues.jours_absence,
        updatedValues.motif_absence,
        updatedValues.jours_conge,
        updatedValues.prime_rendement,
        updatedValues.indemnite_transport,
        updatedValues.autres_primes,
        req.params.id
      ]
    );

    const updated = await getElementById(req.params.id);

    return res.status(200).json({
      success: true,
      data: updated,
      message: 'Éléments variables mis à jour'
    });
  } catch (error) {
    next(error);
  }
};

const deleteElementVariable = async (req, res, next) => {
  try {
    const existing = await getElementById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Enregistrement introuvable'
      });
    }

    if (existing.valide && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Les éléments validés ne peuvent pas être supprimés'
      });
    }

    await pool.query('DELETE FROM elements_variables WHERE id = ?', [req.params.id]);

    return res.status(200).json({
      success: true,
      message: 'Éléments variables supprimés'
    });
  } catch (error) {
    next(error);
  }
};

const validerElementVariable = async (req, res, next) => {
  try {
    const existing = await getElementById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Enregistrement introuvable'
      });
    }

    await pool.query(
      `UPDATE elements_variables
       SET valide = TRUE, valide_par = ?, valide_le = NOW()
       WHERE id = ?`,
      [req.user.id, req.params.id]
    );

    const updated = await getElementById(req.params.id);

    return res.status(200).json({
      success: true,
      data: updated,
      message: 'Éléments variables validés'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllElementsVariables,
  getElementsVariablesByAgent,
  getRecapMensuel,
  createElementVariable,
  updateElementVariable,
  deleteElementVariable,
  validerElementVariable
};
