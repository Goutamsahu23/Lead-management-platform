const leadService = require('../services/leadService');
const asyncHandler = require('../utils/asyncHandler');

const createPublic = asyncHandler(async (req, res) => {
  const lead = await leadService.createLead(req.body, null);
  res.status(201).json({ data: lead });
});

const create = asyncHandler(async (req, res) => {
  const lead = await leadService.createLead(req.body, req.user);
  res.status(201).json({ data: lead });
});

const list = asyncHandler(async (req, res) => {
  const result = await leadService.listLeads(req.user, req.query);
  res.status(200).json(result);
});

const getById = asyncHandler(async (req, res) => {
  const lead = await leadService.getLeadById(req.user, req.params.id);
  res.status(200).json({ data: lead });
});

const update = asyncHandler(async (req, res) => {
  const lead = await leadService.updateLead(req.user, req.params.id, req.body);
  res.status(200).json({ data: lead });
});

const remove = asyncHandler(async (req, res) => {
  const result = await leadService.deleteLead(req.user, req.params.id);
  res.status(200).json(result);
});

const addNote = asyncHandler(async (req, res) => {
  const note = await leadService.addNote(req.user, req.params.id, req.body.body);
  res.status(201).json({ data: note });
});

const listNotes = asyncHandler(async (req, res) => {
  const notes = await leadService.listNotes(req.user, req.params.id);
  res.status(200).json({ data: notes });
});

const listActivities = asyncHandler(async (req, res) => {
  const activities = await leadService.listActivities(req.user, req.params.id);
  res.status(200).json({ data: activities });
});

const dashboard = asyncHandler(async (req, res) => {
  const stats = await leadService.getDashboardStats(req.user);
  res.status(200).json({ data: stats });
});

module.exports = {
  createPublic,
  create,
  list,
  getById,
  update,
  remove,
  addNote,
  listNotes,
  listActivities,
  dashboard,
};
